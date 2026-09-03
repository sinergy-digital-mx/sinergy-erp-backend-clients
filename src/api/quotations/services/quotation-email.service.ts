import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { QuotationEmail } from '../../../entities/quotations/quotation-email.entity';
import { MailerConfigurationService } from '../../mailer-configuration/services/mailer-configuration.service';
import { QuotationService } from './quotation.service';
import { QuotationPdfService } from './quotation-pdf.service';
import { SendQuotationEmailDto } from '../dto/send-quotation-email.dto';

@Injectable()
export class QuotationEmailService {
  constructor(
    @InjectRepository(QuotationEmail)
    private readonly emailRepo: Repository<QuotationEmail>,
    private readonly quotationService: QuotationService,
    private readonly pdfService: QuotationPdfService,
    private readonly mailerConfigurationService: MailerConfigurationService,
  ) {}

  async list(quotationId: string, tenantId: string) {
    await this.quotationService.findOne(quotationId, tenantId);
    const rows = await this.emailRepo.find({
      where: { quotation_id: quotationId, tenant_id: tenantId },
      relations: ['sender'],
      order: { sent_at: 'DESC' },
    });
    return rows.map((row) => this.mapRow(row));
  }

  async send(
    quotationId: string,
    dto: SendQuotationEmailDto,
    tenantId: string,
    userId: string,
  ) {
    const quotation = await this.quotationService.findOne(quotationId, tenantId);
    if (quotation.general_status === 'Cancelada') {
      throw new BadRequestException(
        'No se puede enviar una cotización cancelada',
      );
    }

    const toEmail =
      dto.to_email?.trim() ||
      quotation.customer?.email?.trim() ||
      quotation.customer?.additional_email?.trim() ||
      '';
    if (!toEmail) {
      throw new BadRequestException(
        'Indica un correo destino. El cliente no tiene correo registrado.',
      );
    }

    const pdfBuffer = await this.pdfService.generatePdf(quotation);
    let config;
    try {
      config = await this.mailerConfigurationService.findActiveInternal(tenantId);
    } catch {
      throw new BadRequestException(
        'No hay una configuración de correo activa. Configúrala en Sistema.',
      );
    }
    const vendorConfig =
      this.mailerConfigurationService.decryptVendorConfig(config);

    if (config.vendor !== 'resend') {
      throw new BadRequestException(
        `El proveedor de correo "${config.vendor}" aún no está soportado para envío.`,
      );
    }

    const fromEmail =
      'fromEmail' in vendorConfig ? vendorConfig.fromEmail : undefined;
    if (!fromEmail) {
      throw new BadRequestException(
        'La configuración de correo activa no tiene remitente.',
      );
    }
    if (!('apiKey' in vendorConfig) || !vendorConfig.apiKey) {
      throw new BadRequestException(
        'La configuración de correo activa no tiene apiKey.',
      );
    }

    const fromName =
      'fromName' in vendorConfig ? vendorConfig.fromName : undefined;
    const subject = dto.subject?.trim() || `Cotización ${quotation.folio}`;
    const customerName = [quotation.customer?.name, quotation.customer?.lastname]
      .filter(Boolean)
      .join(' ')
      .trim();
    const html = this.buildEmailHtml(
      quotation.folio,
      customerName,
      dto.message,
    );

    try {
      await axios.post(
        'https://api.resend.com/emails',
        {
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
        },
        {
          headers: {
            Authorization: `Bearer ${vendorConfig.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (err: any) {
      const remote =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message;
      throw new BadRequestException(
        typeof remote === 'string' && remote
          ? `No se pudo enviar el correo: ${remote}`
          : 'No se pudo enviar el correo',
      );
    }

    const saved = await this.emailRepo.save(
      this.emailRepo.create({
        tenant_id: tenantId,
        quotation_id: quotation.id,
        to_email: toEmail,
        cc: dto.cc?.length ? dto.cc : null,
        bcc: dto.bcc?.length ? dto.bcc : null,
        subject,
        message: dto.message?.trim() || null,
        sent_by: userId,
      }),
    );

    const withSender = await this.emailRepo.findOne({
      where: { id: saved.id },
      relations: ['sender'],
    });

    return this.mapRow(withSender ?? saved);
  }

  private mapRow(row: QuotationEmail) {
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

  private buildEmailHtml(
    folio: string,
    customerName: string,
    message?: string,
  ): string {
    const greeting = customerName
      ? `Hola ${this.escapeHtml(customerName)},`
      : 'Hola,';
    const body = this.escapeHtml(
      message?.trim() ||
        `Adjuntamos la cotización ${folio}. Cualquier duda estamos a tus órdenes.`,
    );
    return `
      <div style="font-family: Arial, Helvetica, sans-serif; color:#1e293b; font-size:14px; line-height:1.6;">
        <p>${greeting}</p>
        <p>${body.replace(/\n/g, '<br/>')}</p>
        <p><strong>Folio:</strong> ${this.escapeHtml(folio)}</p>
      </div>
    `;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
