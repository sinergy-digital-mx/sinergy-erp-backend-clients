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
exports.QuotationEmailService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = __importDefault(require("axios"));
const quotation_email_entity_1 = require("../../../entities/quotations/quotation-email.entity");
const mailer_configuration_service_1 = require("../../mailer-configuration/services/mailer-configuration.service");
const quotation_service_1 = require("./quotation.service");
const quotation_pdf_service_1 = require("./quotation-pdf.service");
let QuotationEmailService = class QuotationEmailService {
    emailRepo;
    quotationService;
    pdfService;
    mailerConfigurationService;
    constructor(emailRepo, quotationService, pdfService, mailerConfigurationService) {
        this.emailRepo = emailRepo;
        this.quotationService = quotationService;
        this.pdfService = pdfService;
        this.mailerConfigurationService = mailerConfigurationService;
    }
    async list(quotationId, tenantId) {
        await this.quotationService.findOne(quotationId, tenantId);
        const rows = await this.emailRepo.find({
            where: { quotation_id: quotationId, tenant_id: tenantId },
            relations: ['sender'],
            order: { sent_at: 'DESC' },
        });
        return rows.map((row) => this.mapRow(row));
    }
    async send(quotationId, dto, tenantId, userId) {
        const quotation = await this.quotationService.findOne(quotationId, tenantId);
        if (quotation.general_status === 'Cancelada') {
            throw new common_1.BadRequestException('No se puede enviar una cotización cancelada');
        }
        const toEmail = dto.to_email?.trim() ||
            quotation.customer?.email?.trim() ||
            quotation.customer?.additional_email?.trim() ||
            '';
        if (!toEmail) {
            throw new common_1.BadRequestException('Indica un correo destino. El cliente no tiene correo registrado.');
        }
        const pdfBuffer = await this.pdfService.generatePdf(quotation);
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
        const subject = dto.subject?.trim() || `Cotización ${quotation.folio}`;
        const customerName = [quotation.customer?.name, quotation.customer?.lastname]
            .filter(Boolean)
            .join(' ')
            .trim();
        const html = this.buildEmailHtml(quotation.folio, customerName, dto.message);
        try {
            await axios_1.default.post('https://api.resend.com/emails', {
                from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
                to: [toEmail],
                cc: dto.cc,
                bcc: dto.bcc,
                subject,
                html,
                reply_to: 'replyTo' in vendorConfig ? vendorConfig.replyTo : undefined,
                attachments: [
                    {
                        filename: `cotizacion-${quotation.folio}.pdf`,
                        content: pdfBuffer.toString('base64'),
                    },
                ],
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
        const saved = await this.emailRepo.save(this.emailRepo.create({
            tenant_id: tenantId,
            quotation_id: quotation.id,
            to_email: toEmail,
            cc: dto.cc?.length ? dto.cc : null,
            bcc: dto.bcc?.length ? dto.bcc : null,
            subject,
            message: dto.message?.trim() || null,
            sent_by: userId,
        }));
        const withSender = await this.emailRepo.findOne({
            where: { id: saved.id },
            relations: ['sender'],
        });
        return this.mapRow(withSender ?? saved);
    }
    mapRow(row) {
        const sender = row.sender;
        const senderName = sender
            ? [sender.first_name, sender.last_name].filter(Boolean).join(' ').trim() ||
                sender.email ||
                null
            : null;
        return {
            id: row.id,
            to_email: row.to_email,
            cc: row.cc ?? [],
            bcc: row.bcc ?? [],
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
    buildEmailHtml(folio, customerName, message) {
        const greeting = customerName
            ? `Hola ${this.escapeHtml(customerName)},`
            : 'Hola,';
        const body = this.escapeHtml(message?.trim() ||
            `Adjuntamos la cotización ${folio}. Cualquier duda estamos a tus órdenes.`);
        return `
      <div style="font-family: Arial, Helvetica, sans-serif; color:#1e293b; font-size:14px; line-height:1.6;">
        <p>${greeting}</p>
        <p>${body.replace(/\n/g, '<br/>')}</p>
        <p><strong>Folio:</strong> ${this.escapeHtml(folio)}</p>
      </div>
    `;
    }
    escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
};
exports.QuotationEmailService = QuotationEmailService;
exports.QuotationEmailService = QuotationEmailService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(quotation_email_entity_1.QuotationEmail)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        quotation_service_1.QuotationService,
        quotation_pdf_service_1.QuotationPdfService,
        mailer_configuration_service_1.MailerConfigurationService])
], QuotationEmailService);
//# sourceMappingURL=quotation-email.service.js.map