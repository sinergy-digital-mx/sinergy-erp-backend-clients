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
    templateRepo;
    fiscalRepo;
    tenantRepo;
    mailerConfigurationService;
    constructor(paymentRepo, templateRepo, fiscalRepo, tenantRepo, mailerConfigurationService) {
        this.paymentRepo = paymentRepo;
        this.templateRepo = templateRepo;
        this.fiscalRepo = fiscalRepo;
        this.tenantRepo = tenantRepo;
        this.mailerConfigurationService = mailerConfigurationService;
    }
    async getTemplate(organizationId) {
        const template = await this.ensureTemplate(organizationId);
        const sample = this.sampleValues();
        return {
            id: template.id,
            subject: template.subject,
            body_html: template.body_html,
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
        await this.templateRepo.save(template);
        return this.getTemplate(organizationId);
    }
    async compose(organizationId, contractId, paymentId, extraMessage = '') {
        const payment = await this.loadPayment(organizationId, contractId, paymentId);
        const template = await this.ensureTemplate(organizationId);
        const values = await this.buildValues(organizationId, payment, extraMessage);
        const customer = payment.contract?.customer;
        return {
            to_email: customer?.email || '',
            additional_email: customer?.additional_email || null,
            customer_name: values.customer_name,
            subject: (0, payment_receipt_template_1.renderPaymentReceiptTemplate)(template.subject, values),
            preview_html: (0, payment_receipt_template_1.renderPaymentReceiptTemplate)(template.body_html, values),
            body_html: template.body_html,
            values,
            attachment_name: this.fileName(payment),
        };
    }
    async pdf(organizationId, contractId, paymentId) {
        const payment = await this.loadPayment(organizationId, contractId, paymentId);
        const values = await this.buildValues(organizationId, payment, '');
        const buffer = await this.buildPdf(values);
        return { buffer, filename: this.fileName(payment) };
    }
    async send(organizationId, contractId, paymentId, dto) {
        const composed = await this.compose(organizationId, contractId, paymentId, this.wrapNote(dto.extra_message));
        const toEmail = (dto.to_email || composed.to_email || '').trim();
        if (!toEmail) {
            throw new common_1.BadRequestException('Indica el correo del destinatario.');
        }
        const pdf = await this.pdf(organizationId, contractId, paymentId);
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
    async loadPayment(organizationId, contractId, paymentId) {
        const payment = await this.paymentRepo.findOne({
            where: { id: paymentId, contract_id: contractId, tenant_id: organizationId },
            relations: ['contract', 'contract.customer', 'contract.property'],
        });
        if (!payment) {
            throw new common_1.NotFoundException('No se encontró el pago.');
        }
        return payment;
    }
    async buildValues(organizationId, payment, extraMessage) {
        const [fiscal, organization] = await Promise.all([
            this.fiscalRepo.findOne({ where: { tenant_id: organizationId } }),
            this.tenantRepo.findOne({ where: { id: organizationId } }),
        ]);
        const currency = (0, contract_currency_util_1.resolveStoredContractCurrency)(payment.contract?.currency);
        const customer = payment.contract?.customer;
        const customerName = [customer?.name, customer?.lastname].filter(Boolean).join(' ').trim();
        return {
            organization_name: fiscal?.razon_social || organization?.name || '',
            organization_rfc: fiscal?.rfc || '',
            customer_name: customerName || 'cliente',
            contract_number: payment.contract?.contract_number || '',
            property_code: payment.contract?.property?.code || '',
            payment_number: payment.payment_number,
            amount_paid: this.money(payment.amount_paid, currency),
            amount: this.money(payment.amount, currency),
            amount_pending: this.money(payment.amount_pending, currency),
            payment_date: this.formatDate(payment.paid_date || payment.payment_date),
            due_date: this.formatDate(payment.due_date),
            payment_method: payment.payment_method || '',
            status: payment.status || '',
            extra_message: extraMessage,
        };
    }
    sampleValues() {
        return {
            organization_name: 'Organización ejemplo',
            organization_rfc: 'XAXX010101000',
            customer_name: 'Ana López',
            contract_number: 'CONT-1-01',
            property_code: 'LOT-1-01',
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
        const doc = printer.createPdfKitDocument({
            pageSize: 'LETTER',
            pageMargins: [40, 40, 40, 40],
            content: [
                { text: 'RECIBO DE PAGO', fontSize: 11, color: '#64748b', bold: true },
                { text: values.organization_name || 'Recibo', fontSize: 20, bold: true, margin: [0, 4, 0, 2] },
                { text: values.organization_rfc ? `RFC ${values.organization_rfc}` : '', fontSize: 10, color: '#64748b', margin: [0, 0, 0, 16] },
                {
                    table: {
                        widths: ['*', '*'],
                        body: [
                            ['Cliente', values.customer_name],
                            ['Contrato', values.contract_number],
                            ['Lote', values.property_code],
                            ['Pago', values.payment_number],
                            ['Fecha de pago', values.payment_date],
                            ['Fecha límite', values.due_date],
                            ['Forma de pago', values.payment_method],
                            ['Estado', values.status],
                            ['Monto del pago', values.amount],
                            ['Saldo del pago', values.amount_pending],
                            ['Pagado', values.amount_paid],
                        ].map(([label, value]) => [
                            { text: label, color: '#64748b', fontSize: 10 },
                            { text: value || '—', bold: true, fontSize: 11, alignment: 'right' },
                        ]),
                    },
                    layout: 'lightHorizontalLines',
                },
            ],
            defaultStyle: { font: 'Roboto' },
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
    __param(1, (0, typeorm_1.InjectRepository)(email_template_entity_1.EmailTemplate)),
    __param(2, (0, typeorm_1.InjectRepository)(fiscal_configuration_entity_1.FiscalConfiguration)),
    __param(3, (0, typeorm_1.InjectRepository)(tenant_entity_1.RBACTenant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        mailer_configuration_service_1.MailerConfigurationService])
], PaymentReceiptService);
//# sourceMappingURL=payment-receipt.service.js.map