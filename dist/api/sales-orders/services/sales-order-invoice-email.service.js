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
exports.SalesOrderInvoiceEmailService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const axios_1 = __importDefault(require("axios"));
const typeorm_2 = require("typeorm");
const customer_entity_1 = require("../../../entities/customers/customer.entity");
const sales_order_invoice_email_entity_1 = require("../../../entities/sales-orders/sales-order-invoice-email.entity");
const sales_order_invoice_email_template_entity_1 = require("../../../entities/sales-orders/sales-order-invoice-email-template.entity");
const sales_order_entity_1 = require("../../../entities/sales-orders/sales-order.entity");
const mailer_configuration_service_1 = require("../../mailer-configuration/services/mailer-configuration.service");
const electronic_invoice_pdf_service_1 = require("../../electronic-invoicing/services/electronic-invoice-pdf.service");
const electronic_invoice_service_1 = require("../../electronic-invoicing/services/electronic-invoice.service");
const invoice_email_template_default_1 = require("../utils/invoice-email-template.default");
const SENDABLE_STAMP_STATUSES = ['stamped', 'cancel_pending', 'cancelled'];
let SalesOrderInvoiceEmailService = class SalesOrderInvoiceEmailService {
    salesOrderRepo;
    customerRepo;
    templateRepo;
    emailRepo;
    electronicInvoiceService;
    pdfService;
    mailerConfigurationService;
    constructor(salesOrderRepo, customerRepo, templateRepo, emailRepo, electronicInvoiceService, pdfService, mailerConfigurationService) {
        this.salesOrderRepo = salesOrderRepo;
        this.customerRepo = customerRepo;
        this.templateRepo = templateRepo;
        this.emailRepo = emailRepo;
        this.electronicInvoiceService = electronicInvoiceService;
        this.pdfService = pdfService;
        this.mailerConfigurationService = mailerConfigurationService;
    }
    async getTemplate(tenantId) {
        const template = await this.ensureTemplate(tenantId);
        const sampleValues = this.sampleValues();
        return this.mapTemplate(template, sampleValues);
    }
    async updateTemplate(tenantId, userId, dto) {
        const template = await this.ensureTemplate(tenantId);
        if (dto.reset_default) {
            template.subject = invoice_email_template_default_1.DEFAULT_INVOICE_EMAIL_SUBJECT;
            template.body_html = invoice_email_template_default_1.DEFAULT_INVOICE_EMAIL_HTML;
        }
        else {
            if (dto.subject?.trim()) {
                template.subject = dto.subject.trim();
            }
            if (dto.body_html?.trim()) {
                template.body_html = dto.body_html;
            }
        }
        template.updated_by = userId;
        const saved = await this.templateRepo.save(template);
        const withUpdater = await this.templateRepo.findOne({
            where: { id: saved.id },
            relations: ['updater'],
        });
        return this.mapTemplate(withUpdater ?? saved, this.sampleValues());
    }
    async getCompose(salesOrderId, invoiceId, tenantId) {
        const { order, invoice, customer } = await this.loadSendableContext(salesOrderId, invoiceId, tenantId, false);
        const template = await this.ensureTemplate(tenantId);
        const values = this.buildValues(order, invoice, customer, null);
        const toEmail = this.resolveCustomerEmail(customer);
        const additionalEmail = this.secondaryCustomerEmail(customer, toEmail);
        const canSend = this.isSendable(invoice);
        const attachments = this.describeAttachments(invoice);
        return {
            to_email: toEmail,
            additional_email: additionalEmail,
            customer_name: values.customer_name,
            customer_company: values.customer_company,
            subject: (0, invoice_email_template_default_1.renderInvoiceEmailTemplate)(template.subject, values),
            preview_html: (0, invoice_email_template_default_1.renderInvoiceEmailTemplate)(template.body_html, values),
            body_html: template.body_html,
            values,
            variables: invoice_email_template_default_1.INVOICE_EMAIL_TEMPLATE_VARIABLES,
            attachments,
            can_send: canSend,
            block_reason: canSend
                ? null
                : 'Solo se puede enviar una factura timbrada (PDF y XML).',
        };
    }
    async send(salesOrderId, invoiceId, dto, tenantId, userId) {
        const { order, invoice, customer } = await this.loadSendableContext(salesOrderId, invoiceId, tenantId, true);
        const template = await this.ensureTemplate(tenantId);
        const values = this.buildValues(order, invoice, customer, dto.message);
        const toEmail = dto.to_email?.trim() || this.resolveCustomerEmail(customer);
        if (!toEmail) {
            throw new common_1.BadRequestException('Indica un correo destino. El cliente no tiene correo registrado.');
        }
        const subject = dto.subject?.trim() || (0, invoice_email_template_default_1.renderInvoiceEmailTemplate)(template.subject, values);
        const html = (0, invoice_email_template_default_1.renderInvoiceEmailTemplate)(template.body_html, values);
        const cc = this.normalizeCc(dto.cc, toEmail);
        const attachments = await this.buildAttachments(invoice, tenantId);
        await this.sendViaResend(tenantId, {
            toEmail,
            cc,
            subject,
            html,
            attachments,
        });
        const saved = await this.emailRepo.save(this.emailRepo.create({
            tenant_id: tenantId,
            sales_order_id: salesOrderId,
            invoice_id: invoice.id,
            to_email: toEmail,
            cc: cc.length ? cc : null,
            subject,
            message: dto.message?.trim() || null,
            sent_by: userId,
        }));
        const withSender = await this.emailRepo.findOne({
            where: { id: saved.id },
            relations: ['sender'],
        });
        return this.mapEmailRow(withSender ?? saved);
    }
    async list(salesOrderId, tenantId) {
        await this.getSalesOrderOrFail(salesOrderId, tenantId);
        const rows = await this.emailRepo.find({
            where: { sales_order_id: salesOrderId, tenant_id: tenantId },
            relations: ['sender'],
            order: { sent_at: 'DESC' },
        });
        return rows.map((row) => this.mapEmailRow(row));
    }
    async loadSendableContext(salesOrderId, invoiceId, tenantId, requireSendable) {
        const order = await this.salesOrderRepo.findOne({
            where: { id: salesOrderId, tenant_id: tenantId },
            relations: ['fiscal_configuration', 'customer'],
        });
        if (!order) {
            throw new common_1.NotFoundException('Orden de venta no encontrada');
        }
        const invoice = await this.electronicInvoiceService.findOne(invoiceId, tenantId);
        if (invoice.source_module !== 'sales_orders' || invoice.source_id !== salesOrderId) {
            throw new common_1.NotFoundException('La factura no pertenece a esta orden de venta');
        }
        if (requireSendable && !this.isSendable(invoice)) {
            throw new common_1.BadRequestException('Solo se puede enviar una factura timbrada (PDF y XML).');
        }
        const customer = order.customer ??
            (await this.customerRepo.findOne({ where: { id: order.customer_id } }));
        return { order, invoice, customer };
    }
    isSendable(invoice) {
        return (SENDABLE_STAMP_STATUSES.includes(invoice.stamp_status) &&
            (!!invoice.uuid || !!invoice.xml_stamped));
    }
    async ensureTemplate(tenantId) {
        const existing = await this.templateRepo.findOne({
            where: { tenant_id: tenantId },
            relations: ['updater'],
        });
        if (existing) {
            if ((0, invoice_email_template_default_1.isLegacyFactoryInvoiceEmailHtml)(existing.body_html)) {
                existing.body_html = invoice_email_template_default_1.DEFAULT_INVOICE_EMAIL_HTML;
                return this.templateRepo.save(existing);
            }
            return existing;
        }
        const created = await this.templateRepo.save(this.templateRepo.create({
            tenant_id: tenantId,
            subject: invoice_email_template_default_1.DEFAULT_INVOICE_EMAIL_SUBJECT,
            body_html: invoice_email_template_default_1.DEFAULT_INVOICE_EMAIL_HTML,
        }));
        return created;
    }
    buildValues(order, invoice, customer, message) {
        const customerName = [customer?.name, customer?.lastname]
            .filter(Boolean)
            .join(' ')
            .trim();
        const customerCompany = customer?.company_name?.trim() ||
            customer?.fiscal_razon_social?.trim() ||
            customerName ||
            'Cliente';
        const issuerName = order.fiscal_configuration?.razon_social?.trim() ||
            order.fiscal_razon_social?.trim() ||
            'Emisor';
        const invoiceFolio = [invoice.series, invoice.folio].filter(Boolean).join('-') || order.folio;
        const currency = invoice.currency || 'MXN';
        return {
            customer_name: customerName || 'cliente',
            customer_company: customerCompany,
            issuer_name: issuerName,
            order_folio: order.folio,
            invoice_folio: invoiceFolio,
            uuid: invoice.uuid || '—',
            total: this.formatMoney(invoice.total, currency),
            subtotal: this.formatMoney(invoice.subtotal, currency),
            stamped_at: this.formatDate(invoice.stamped_at),
            extra_message: (0, invoice_email_template_default_1.wrapExtraMessage)(message),
        };
    }
    sampleValues() {
        return {
            customer_name: 'Luis Gomez',
            customer_company: 'Grupo Ministop De Mexico',
            issuer_name: 'Sinergy Sw Solutions',
            order_folio: 'OSV-000001',
            invoice_folio: 'A-1',
            uuid: '00000000-0000-0000-0000-000000000000',
            total: this.formatMoney(34800, 'MXN'),
            subtotal: this.formatMoney(30000, 'MXN'),
            stamped_at: this.formatDate(new Date()),
            extra_message: '',
        };
    }
    mapTemplate(template, values) {
        const updater = template.updater;
        const updaterName = updater
            ? [updater.first_name, updater.last_name].filter(Boolean).join(' ').trim() ||
                updater.email ||
                null
            : null;
        return {
            id: template.id,
            subject: template.subject,
            body_html: template.body_html,
            variables: invoice_email_template_default_1.INVOICE_EMAIL_TEMPLATE_VARIABLES,
            sample_values: values,
            sample_html: (0, invoice_email_template_default_1.renderInvoiceEmailTemplate)(template.body_html, values),
            sample_subject: (0, invoice_email_template_default_1.renderInvoiceEmailTemplate)(template.subject, values),
            updated_at: template.updated_at,
            updated_by: updater
                ? {
                    id: updater.id,
                    display_name: updaterName,
                }
                : null,
        };
    }
    mapEmailRow(row) {
        const sender = row.sender;
        const senderName = sender
            ? [sender.first_name, sender.last_name].filter(Boolean).join(' ').trim() ||
                sender.email ||
                null
            : null;
        return {
            id: row.id,
            invoice_id: row.invoice_id,
            to_email: row.to_email,
            cc: row.cc ?? [],
            subject: row.subject,
            message: row.message,
            sent_at: row.sent_at,
            sent_by: sender
                ? {
                    id: sender.id,
                    first_name: sender.first_name,
                    last_name: sender.last_name,
                    display_name: senderName,
                }
                : null,
        };
    }
    resolveCustomerEmail(customer) {
        return customer?.email?.trim() || customer?.additional_email?.trim() || '';
    }
    secondaryCustomerEmail(customer, toEmail) {
        const extra = customer?.additional_email?.trim() || '';
        if (!extra || extra.toLowerCase() === toEmail.toLowerCase()) {
            return null;
        }
        return extra;
    }
    normalizeCc(cc, toEmail) {
        const seen = new Set([toEmail.trim().toLowerCase()]);
        const result = [];
        for (const raw of cc ?? []) {
            const email = raw.trim();
            const key = email.toLowerCase();
            if (!email || seen.has(key))
                continue;
            seen.add(key);
            result.push(email);
        }
        return result;
    }
    describeAttachments(invoice) {
        const attachments = [];
        if (invoice.pdf_stamped_s3_key || invoice.uuid) {
            attachments.push({
                kind: 'pdf',
                fileName: `${invoice.uuid ?? invoice.folio ?? invoice.id}.pdf`,
            });
        }
        if (invoice.xml_stamped) {
            attachments.push({
                kind: 'xml',
                fileName: `${invoice.uuid ?? invoice.folio ?? invoice.id}.xml`,
            });
        }
        return attachments;
    }
    async buildAttachments(invoice, tenantId) {
        await this.electronicInvoiceService.getPdfDownload(invoice.id, tenantId);
        const fresh = await this.electronicInvoiceService.findOne(invoice.id, tenantId);
        const pdf = await this.pdfService.getPdfBuffer(fresh);
        const attachments = [
            {
                filename: pdf.fileName,
                content: pdf.buffer.toString('base64'),
            },
        ];
        if (fresh.xml_stamped) {
            attachments.push({
                filename: `${fresh.uuid ?? fresh.folio ?? fresh.id}.xml`,
                content: Buffer.from(fresh.xml_stamped, 'utf8').toString('base64'),
            });
        }
        return attachments;
    }
    async sendViaResend(tenantId, payload) {
        let config;
        try {
            config = await this.mailerConfigurationService.findActiveInternal(tenantId);
        }
        catch {
            throw new common_1.BadRequestException('No hay una configuración de correo activa. Configúrala en Sistema.');
        }
        const vendorConfig = this.mailerConfigurationService.decryptVendorConfig(config);
        if (config.vendor !== 'resend') {
            throw new common_1.BadRequestException(`El proveedor de correo "${config.vendor}" aún no está soportado para envío.`);
        }
        const fromEmail = 'fromEmail' in vendorConfig ? vendorConfig.fromEmail : undefined;
        if (!fromEmail) {
            throw new common_1.BadRequestException('La configuración de correo activa no tiene remitente.');
        }
        if (!('apiKey' in vendorConfig) || !vendorConfig.apiKey) {
            throw new common_1.BadRequestException('La configuración de correo activa no tiene apiKey.');
        }
        const fromName = 'fromName' in vendorConfig ? vendorConfig.fromName : undefined;
        try {
            await axios_1.default.post('https://api.resend.com/emails', {
                from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
                to: [payload.toEmail],
                cc: payload.cc.length ? payload.cc : undefined,
                subject: payload.subject,
                html: payload.html,
                reply_to: 'replyTo' in vendorConfig ? vendorConfig.replyTo : undefined,
                attachments: payload.attachments,
            }, {
                headers: {
                    Authorization: `Bearer ${vendorConfig.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });
        }
        catch (err) {
            const remote = err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message;
            throw new common_1.BadRequestException(typeof remote === 'string' && remote
                ? `No se pudo enviar el correo: ${remote}`
                : 'No se pudo enviar el correo');
        }
    }
    async getSalesOrderOrFail(id, tenantId) {
        const order = await this.salesOrderRepo.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!order) {
            throw new common_1.NotFoundException('Orden de venta no encontrada');
        }
        return order;
    }
    formatMoney(value, currency) {
        const amount = Number(value);
        if (!Number.isFinite(amount)) {
            return '—';
        }
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: currency || 'MXN',
        }).format(amount);
    }
    formatDate(value) {
        if (!value)
            return '—';
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime()))
            return '—';
        return date.toLocaleString('es-MX', {
            dateStyle: 'long',
            timeStyle: 'short',
        });
    }
};
exports.SalesOrderInvoiceEmailService = SalesOrderInvoiceEmailService;
exports.SalesOrderInvoiceEmailService = SalesOrderInvoiceEmailService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sales_order_entity_1.SalesOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(2, (0, typeorm_1.InjectRepository)(sales_order_invoice_email_template_entity_1.SalesOrderInvoiceEmailTemplate)),
    __param(3, (0, typeorm_1.InjectRepository)(sales_order_invoice_email_entity_1.SalesOrderInvoiceEmail)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        electronic_invoice_service_1.ElectronicInvoiceService,
        electronic_invoice_pdf_service_1.ElectronicInvoicePdfService,
        mailer_configuration_service_1.MailerConfigurationService])
], SalesOrderInvoiceEmailService);
//# sourceMappingURL=sales-order-invoice-email.service.js.map