"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentReceiptService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = __importDefault(require("axios"));
const pdfmake_1 = __importDefault(require("pdfmake"));
const payment_entity_1 = require("../../../entities/contracts/payment.entity");
const contract_downpayment_payment_entity_1 = require("../../../entities/contracts/contract-downpayment-payment.entity");
const s3_service_1 = require("../../../common/services/s3.service");
const email_template_entity_1 = require("../../../entities/email-templates/email-template.entity");
const fiscal_configuration_entity_1 = require("../../../entities/billing/fiscal-configuration.entity");
const tenant_entity_1 = require("../../../entities/rbac/tenant.entity");
const mailer_configuration_service_1 = require("../../mailer-configuration/services/mailer-configuration.service");
const contract_currency_util_1 = require("../contract-currency.util");
const payment_receipt_template_1 = require("./payment-receipt.template");
const fonts = {
    Roboto: {
        normal: './src/_public/fonts/Roboto-Regular.ttf',
        bold: './src/_public/fonts/Roboto-Bold.ttf',
        italics: './src/_public/fonts/Roboto-Italic.ttf',
        bolditalics: './src/_public/fonts/Roboto-BoldItalic.ttf',
    },
};
let PaymentReceiptService = class PaymentReceiptService {
    paymentRepo;
    downpaymentRepo;
    templateRepo;
    fiscalRepo;
    tenantRepo;
    mailerConfigurationService;
    s3Service;
    constructor(paymentRepo, downpaymentRepo, templateRepo, fiscalRepo, tenantRepo, mailerConfigurationService, s3Service) {
        this.paymentRepo = paymentRepo;
        this.downpaymentRepo = downpaymentRepo;
        this.templateRepo = templateRepo;
        this.fiscalRepo = fiscalRepo;
        this.tenantRepo = tenantRepo;
        this.mailerConfigurationService = mailerConfigurationService;
        this.s3Service = s3Service;
    }
    async getTemplate(organizationId) {
        const template = await this.ensureTemplate(organizationId);
        const sample = this.sampleValues();
        const options = await this.fiscalOptions(organizationId);
        return {
            id: template.id,
            subject: template.subject,
            body_html: template.body_html,
            fiscal_configuration_id: this.readFiscalId(template),
            fiscal_configurations: options,
            variables: payment_receipt_template_1.PAYMENT_RECEIPT_VARIABLES,
            sample_subject: (0, payment_receipt_template_1.renderPaymentReceiptTemplate)(template.subject, sample),
            sample_html: (0, payment_receipt_template_1.renderPaymentReceiptTemplate)(template.body_html, sample),
        };
    }
    async updateTemplate(organizationId, dto) {
        const template = await this.ensureTemplate(organizationId);
        if (dto.reset_default) {
            template.subject = payment_receipt_template_1.DEFAULT_PAYMENT_RECEIPT_SUBJECT;
            template.body_html = payment_receipt_template_1.DEFAULT_PAYMENT_RECEIPT_HTML;
        }
        else {
            if (dto.subject?.trim())
                template.subject = dto.subject.trim();
            if (dto.body_html?.trim())
                template.body_html = dto.body_html;
        }
        if (dto.fiscal_configuration_id !== undefined) {
            template.custom_variables = dto.fiscal_configuration_id
                ? [{ key: 'fiscal_configuration_id', label: 'Razón social', type: 'string', defaultValue: dto.fiscal_configuration_id }]
                : null;
        }
        await this.templateRepo.save(template);
        return this.getTemplate(organizationId);
    }
    async compose(organizationId, contractId, paymentId, extraMessage = '', kind = 'payment') {
        const payment = await this.loadPayment(organizationId, contractId, paymentId, kind);
        const template = await this.ensureTemplate(organizationId);
        const values = await this.buildValues(organizationId, payment, extraMessage);
        const { logo_data: _logo, ...publicValues } = values;
        const customer = payment.contract?.customer;
        let body = template.body_html;
        if (publicValues.cadastral_key && !body.includes('cadastral_line') && !body.includes('cadastral_key')) {
            body = body.includes('{{property_code}}</strong>.')
                ? body.replace('{{property_code}}</strong>.', '{{property_code}}</strong>.{{cadastral_line}}')
                : body.replace('{{extra_message}}', '{{cadastral_line}}{{extra_message}}');
        }
        return {
            to_email: customer?.email || '',
            additional_email: customer?.additional_email || null,
            customer_name: values.customer_name,
            subject: (0, payment_receipt_template_1.renderPaymentReceiptTemplate)(template.subject, publicValues),
            preview_html: (0, payment_receipt_template_1.renderPaymentReceiptTemplate)(body, publicValues),
            body_html: template.body_html,
            values: publicValues,
            attachment_name: this.fileName(payment),
        };
    }
    async pdf(organizationId, contractId, paymentId, kind = 'payment') {
        const payment = await this.loadPayment(organizationId, contractId, paymentId, kind);
        const values = await this.buildValues(organizationId, payment, '');
        const buffer = await this.buildPdf(values);
        return { buffer, filename: this.fileName(payment) };
    }
    async send(organizationId, contractId, paymentId, dto, kind = 'payment') {
        const composed = await this.compose(organizationId, contractId, paymentId, this.wrapNote(dto.extra_message), kind);
        const toEmail = (dto.to_email || composed.to_email || '').trim();
        if (!toEmail) {
            throw new common_1.BadRequestException('Indica el correo del destinatario.');
        }
        const pdf = await this.pdf(organizationId, contractId, paymentId, kind);
        await this.sendViaResend(organizationId, {
            toEmail,
            cc: (dto.cc ?? []).map((item) => item.trim()).filter(Boolean),
            subject: composed.subject,
            html: composed.preview_html,
            attachments: [
                {
                    filename: pdf.filename,
                    content: pdf.buffer.toString('base64'),
                },
            ],
        });
        return { sent: true, to_email: toEmail };
    }
    async ensureTemplate(organizationId) {
        const existing = await this.templateRepo.findOne({
            where: { tenant_id: organizationId, name: payment_receipt_template_1.PAYMENT_RECEIPT_TEMPLATE_NAME },
        });
        if (existing)
            return existing;
        const created = this.templateRepo.create({
            tenant_id: organizationId,
            name: payment_receipt_template_1.PAYMENT_RECEIPT_TEMPLATE_NAME,
            subject: payment_receipt_template_1.DEFAULT_PAYMENT_RECEIPT_SUBJECT,
            body_html: payment_receipt_template_1.DEFAULT_PAYMENT_RECEIPT_HTML,
            variables: payment_receipt_template_1.PAYMENT_RECEIPT_VARIABLES.map((item) => item.key),
            is_active: true,
        });
        return this.templateRepo.save(created);
    }
    async loadPayment(organizationId, contractId, paymentId, kind) {
        const relations = ['contract', 'contract.customer', 'contract.property'];
        const payment = kind === 'downpayment'
            ? await this.downpaymentRepo.findOne({
                where: { id: paymentId, contract_id: contractId, tenant_id: organizationId },
                relations: [...relations],
            })
            : await this.paymentRepo.findOne({
                where: { id: paymentId, contract_id: contractId, tenant_id: organizationId },
                relations: [...relations],
            });
        if (!payment) {
            throw new common_1.NotFoundException('No se encontró el pago.');
        }
        return { ...payment, kind, payment_date: 'payment_date' in payment ? payment.payment_date : payment.paid_date };
    }
    async buildValues(organizationId, payment, extraMessage) {
        const fiscal = await this.resolveFiscal(organizationId);
        const organization = await this.tenantRepo.findOne({ where: { id: organizationId } });
        const currency = (0, contract_currency_util_1.resolveStoredContractCurrency)(payment.contract?.currency);
        const customer = payment.contract?.customer;
        const property = payment.contract?.property;
        const customerName = [customer?.name, customer?.lastname].filter(Boolean).join(' ').trim();
        const paid = Number(payment.amount_paid || 0);
        const pending = Number(payment.amount_pending || 0);
        const partial = pending > 0;
        const concept = payment.kind === 'downpayment'
            ? (partial ? 'pago parcial de enganche' : 'pago de enganche')
            : (partial ? 'pago parcial' : 'pago');
        const lotBits = [
            property?.lot_number ? `lote ${property.lot_number}` : property?.code ? `lote ${property.code}` : '',
            property?.block ? `manzana ${property.block}` : '',
            property?.name ? `del proyecto ${property.name}` : '',
        ].filter(Boolean);
        const logo = await this.loadLogo(fiscal?.logo);
        return {
            organization_name: fiscal?.razon_social || organization?.name || '',
            organization_rfc: fiscal?.rfc || '',
            customer_name: customerName || 'cliente',
            contract_number: payment.contract?.contract_number || '',
            property_code: property?.code || '',
            cadastral_key: property?.cadastral_key?.trim() || '',
            cadastral_line: property?.cadastral_key?.trim()
                ? ` Clave catastral ${property.cadastral_key.trim()}.`
                : '',
            lot_phrase: lotBits.join(', '),
            payment_number: payment.payment_number,
            amount_paid: this.money(paid, currency),
            amount_words: amountToWords(paid, currency),
            amount: this.money(payment.amount, currency),
            amount_pending: this.money(pending, currency),
            payment_date: this.formatLongDate(payment.paid_date || payment.payment_date),
            due_date: this.formatDate(payment.due_date),
            payment_method: methodLabel(payment.payment_method),
            concept,
            status: payment.status || '',
            extra_message: extraMessage,
            logo_data: logo,
        };
    }
    sampleValues() {
        return {
            organization_name: 'Organización ejemplo',
            organization_rfc: 'XAXX010101000',
            customer_name: 'Ana López',
            contract_number: 'CONT-1-01',
            property_code: 'LOT-1-01',
            cadastral_key: '02-0Q3-011',
            cadastral_line: ' Clave catastral 02-0Q3-011.',
            payment_number: 'P-1',
            amount_paid: '$1,500.00 USD',
            amount: '$1,500.00 USD',
            amount_pending: '$0.00 USD',
            payment_date: '07/10/2026',
            due_date: '05/10/2026',
            payment_method: 'transferencia',
            status: 'pagado',
            extra_message: '',
        };
    }
    async buildPdf(values) {
        const printer = new pdfmake_1.default(fonts);
        const content = [];
        if (values.logo_data) {
            content.push({ image: values.logo_data, fit: [180, 72], alignment: 'center', margin: [0, 8, 0, 18] });
        }
        else {
            content.push({ text: values.organization_name, alignment: 'center', bold: true, fontSize: 16, color: '#1e3a8a', margin: [0, 12, 0, 18] });
        }
        content.push({ text: 'RECIBO DE PAGO', alignment: 'center', bold: true, fontSize: 13, characterSpacing: 0.6, margin: [0, 18, 0, 22] }, { text: `FECHA: ${values.payment_date}`, alignment: 'right', bold: true, fontSize: 11, margin: [0, 0, 0, 28] }, {
            text: [
                'Recibo de ',
                { text: values.customer_name, bold: true },
                ' la cantidad de ',
                { text: values.amount_paid, bold: true },
                ` (${values.amount_words}), recibida mediante ${values.payment_method}, como ${values.concept} por la compraventa del ${values.lot_phrase || values.property_code}${values.cadastral_key ? `, clave catastral ${values.cadastral_key}` : ''}.`,
            ],
            alignment: 'justify',
            fontSize: 12,
            lineHeight: 1.35,
            margin: [0, 0, 0, 14],
        }, {
            text: `Recibe, en representación de ${values.organization_name}.`,
            fontSize: 12,
            margin: [0, 0, 0, 8],
        }, {
            text: `Contrato ${values.contract_number} · Pago ${values.payment_number}${values.cadastral_key ? ` · Clave catastral ${values.cadastral_key}` : ''} · Saldo de este pago ${values.amount_pending}`,
            fontSize: 9,
            color: '#64748b',
            margin: [0, 8, 0, 0],
        });
        const doc = printer.createPdfKitDocument({
            pageSize: 'LETTER',
            pageMargins: [64, 48, 64, 88],
            content,
            footer: () => ({
                margin: [64, 0, 64, 24],
                stack: [
                    { canvas: [{ type: 'line', x1: 180, y1: 0, x2: 380, y2: 0, lineWidth: 0.6, lineColor: '#94a3b8' }] },
                    { text: values.organization_name, alignment: 'center', bold: true, fontSize: 11, margin: [0, 8, 0, 0] },
                    values.organization_rfc ? { text: `RFC ${values.organization_rfc}`, alignment: 'center', fontSize: 9, color: '#64748b' } : { text: '' },
                ],
            }),
            defaultStyle: { font: 'Roboto', color: '#1e293b' },
        });
        const chunks = [];
        return new Promise((resolve, reject) => {
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            doc.end();
        });
    }
    fileName(payment) {
        const safe = String(payment.payment_number || 'pago').replace(/[^\w.-]+/g, '-');
        return `recibo-${safe}.pdf`;
    }
    money(amount, currency) {
        const formatted = Number(amount || 0).toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `$${formatted} ${currency}`;
    }
    formatLongDate(date) {
        if (!date)
            return '—';
        const text = date instanceof Date ? date.toISOString() : String(date);
        const [year, month, day] = text.slice(0, 10).split('-');
        const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const monthName = months[Number(month) - 1];
        if (!year || !monthName || !day)
            return '—';
        return `${Number(day)} de ${monthName} de ${year}`;
    }
    formatDate(date) {
        if (!date)
            return '—';
        const text = date instanceof Date ? date.toISOString() : String(date);
        const [year, month, day] = text.slice(0, 10).split('-');
        if (year && month && day)
            return `${day}/${month}/${year}`;
        return '—';
    }
    wrapNote(note) {
        const text = note?.trim();
        if (!text)
            return '';
        const safe = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        return `<p style="margin:0 0 16px;padding:12px 14px;background:#eef2ff;border-radius:10px;font-size:14px;color:#312e81;">${safe}</p>`;
    }
    readFiscalId(template) {
        const stored = template.custom_variables?.find((item) => item.key === 'fiscal_configuration_id');
        const value = stored?.defaultValue;
        return typeof value === 'string' && value ? value : null;
    }
    async fiscalOptions(organizationId) {
        const rows = await this.fiscalRepo.find({ where: { tenant_id: organizationId }, order: { razon_social: 'ASC' } });
        return rows.map((row) => ({
            id: row.id,
            razon_social: row.razon_social,
            rfc: row.rfc,
            has_logo: !!row.logo,
        }));
    }
    async resolveFiscal(organizationId) {
        const template = await this.templateRepo.findOne({
            where: { tenant_id: organizationId, name: payment_receipt_template_1.PAYMENT_RECEIPT_TEMPLATE_NAME },
        });
        const selected = template ? this.readFiscalId(template) : null;
        if (selected) {
            const match = await this.fiscalRepo.findOne({ where: { id: selected, tenant_id: organizationId } });
            if (match)
                return match;
        }
        const branded = await this.fiscalRepo.findOne({ where: { tenant_id: organizationId, use_as_system_logo: true } });
        return branded || this.fiscalRepo.findOne({ where: { tenant_id: organizationId } });
    }
    async loadLogo(key) {
        if (!key)
            return '';
        try {
            const file = await this.s3Service.getFile(key);
            const type = file.contentType || 'image/png';
            return `data:${type};base64,${file.buffer.toString('base64')}`;
        }
        catch {
            return '';
        }
    }
    async sendViaResend(organizationId, payload) {
        let config;
        try {
            config = await this.mailerConfigurationService.findActiveInternal(organizationId);
        }
        catch {
            throw new common_1.BadRequestException('No hay una configuración de correo activa. Configúrala en Sistema.');
        }
        const vendorConfig = this.mailerConfigurationService.decryptVendorConfig(config);
        if (config.vendor !== 'resend') {
            throw new common_1.BadRequestException('El proveedor de correo activo aún no puede enviar este recibo.');
        }
        const fromEmail = 'fromEmail' in vendorConfig ? vendorConfig.fromEmail : undefined;
        const apiKey = 'apiKey' in vendorConfig ? vendorConfig.apiKey : undefined;
        if (!fromEmail || !apiKey) {
            throw new common_1.BadRequestException('La configuración de correo activa no tiene remitente o apiKey.');
        }
        const fromName = 'fromName' in vendorConfig ? vendorConfig.fromName : undefined;
        try {
            await axios_1.default.post('https://api.resend.com/emails', {
                from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
                to: [payload.toEmail],
                cc: payload.cc.length ? payload.cc : undefined,
                subject: payload.subject,
                html: payload.html,
                attachments: payload.attachments,
            }, { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } });
        }
        catch (err) {
            const remote = err?.response?.data?.message || err?.message;
            throw new common_1.BadRequestException(typeof remote === 'string' && remote ? `No se pudo enviar el correo: ${remote}` : 'No se pudo enviar el correo');
        }
    }
};
exports.PaymentReceiptService = PaymentReceiptService;
exports.PaymentReceiptService = PaymentReceiptService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(1, (0, typeorm_1.InjectRepository)(contract_downpayment_payment_entity_1.ContractDownpaymentPayment)),
    __param(2, (0, typeorm_1.InjectRepository)(email_template_entity_1.EmailTemplate)),
    __param(3, (0, typeorm_1.InjectRepository)(fiscal_configuration_entity_1.FiscalConfiguration)),
    __param(4, (0, typeorm_1.InjectRepository)(tenant_entity_1.RBACTenant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        mailer_configuration_service_1.MailerConfigurationService,
        s3_service_1.S3Service])
], PaymentReceiptService);
function methodLabel(method) {
    const key = (method || '').toLowerCase();
    if (key.includes('transfer') || key.includes('deposito') || key.includes('depósito'))
        return 'depósito bancario';
    if (key.includes('efectivo'))
        return 'efectivo';
    if (key.includes('cheque'))
        return 'cheque';
    if (key.includes('tarjeta'))
        return 'tarjeta';
    return method || 'el medio registrado';
}
function amountToWords(amount, currency) {
    const whole = Math.floor(Math.abs(amount));
    const cents = Math.round((Math.abs(amount) - whole) * 100);
    const words = `${capitalize(integerToSpanish(whole))} ${currency === 'MXN' ? 'pesos mexicanos' : 'dólares americanos'}`;
    return cents ? `${words} con ${cents}/100` : words;
}
function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
function integerToSpanish(value) {
    if (value === 0)
        return 'cero';
    const units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
    const chunk = (n) => {
        if (n === 100)
            return 'cien';
        if (n < 10)
            return units[n];
        if (n < 20)
            return teens[n - 10];
        if (n < 30)
            return n === 20 ? 'veinte' : `veinti${units[n - 20]}`;
        if (n < 100) {
            const ten = tens[Math.floor(n / 10)];
            const unit = n % 10;
            return unit ? `${ten} y ${units[unit]}` : ten;
        }
        const hundred = hundreds[Math.floor(n / 100)];
        const rest = n % 100;
        return rest ? `${hundred} ${chunk(rest)}` : hundred;
    };
    if (value < 1000)
        return chunk(value);
    if (value < 1000000) {
        const thousands = Math.floor(value / 1000);
        const rest = value % 1000;
        const prefix = thousands === 1 ? 'mil' : `${chunk(thousands)} mil`;
        return rest ? `${prefix} ${chunk(rest)}` : prefix;
    }
    return String(value);
}
//# sourceMappingURL=payment-receipt.service.js.map