import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Repository } from 'typeorm';
import { Customer } from '../../../entities/customers/customer.entity';
import { ElectronicInvoice } from '../../../entities/electronic-invoicing/electronic-invoice.entity';
import { SalesOrderInvoiceEmail } from '../../../entities/sales-orders/sales-order-invoice-email.entity';
import { SalesOrderInvoiceEmailTemplate } from '../../../entities/sales-orders/sales-order-invoice-email-template.entity';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { MailerConfigurationService } from '../../mailer-configuration/services/mailer-configuration.service';
import { ElectronicInvoicePdfService } from '../../electronic-invoicing/services/electronic-invoice-pdf.service';
import { ElectronicInvoiceService } from '../../electronic-invoicing/services/electronic-invoice.service';
import { SendSalesOrderInvoiceEmailDto } from '../dto/send-sales-order-invoice-email.dto';
import { UpdateInvoiceEmailTemplateDto } from '../dto/update-invoice-email-template.dto';
import {
  DEFAULT_INVOICE_EMAIL_HTML,
  DEFAULT_INVOICE_EMAIL_SUBJECT,
  INVOICE_EMAIL_TEMPLATE_VARIABLES,
  isLegacyFactoryInvoiceEmailHtml,
  renderInvoiceEmailTemplate,
  wrapExtraMessage,
} from '../utils/invoice-email-template.default';

const SENDABLE_STAMP_STATUSES = ['stamped', 'cancel_pending', 'cancelled'];

@Injectable()
export class SalesOrderInvoiceEmailService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(SalesOrderInvoiceEmailTemplate)
    private readonly templateRepo: Repository<SalesOrderInvoiceEmailTemplate>,
    @InjectRepository(SalesOrderInvoiceEmail)
    private readonly emailRepo: Repository<SalesOrderInvoiceEmail>,
    private readonly electronicInvoiceService: ElectronicInvoiceService,
    private readonly pdfService: ElectronicInvoicePdfService,
    private readonly mailerConfigurationService: MailerConfigurationService,
  ) {}

  async getTemplate(tenantId: string) {
    const template = await this.ensureTemplate(tenantId);
    const sampleValues = this.sampleValues();
    return this.mapTemplate(template, sampleValues);
  }

  async updateTemplate(
    tenantId: string,
    userId: string,
    dto: UpdateInvoiceEmailTemplateDto,
  ) {
    const template = await this.ensureTemplate(tenantId);

    if (dto.reset_default) {
      template.subject = DEFAULT_INVOICE_EMAIL_SUBJECT;
      template.body_html = DEFAULT_INVOICE_EMAIL_HTML;
    } else {
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

  async getCompose(salesOrderId: string, invoiceId: string, tenantId: string) {
    const { order, invoice, customer } = await this.loadSendableContext(
      salesOrderId,
      invoiceId,
      tenantId,
      false,
    );
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
      subject: renderInvoiceEmailTemplate(template.subject, values),
      preview_html: renderInvoiceEmailTemplate(template.body_html, values),
      body_html: template.body_html,
      values,
      variables: INVOICE_EMAIL_TEMPLATE_VARIABLES,
      attachments,
      can_send: canSend,
      block_reason: canSend
        ? null
        : 'Solo se puede enviar una factura timbrada (PDF y XML).',
    };
  }

  async send(
    salesOrderId: string,
    invoiceId: string,
    dto: SendSalesOrderInvoiceEmailDto,
    tenantId: string,
    userId: string,
  ) {
    const { order, invoice, customer } = await this.loadSendableContext(
      salesOrderId,
      invoiceId,
      tenantId,
      true,
    );
    const template = await this.ensureTemplate(tenantId);
    const values = this.buildValues(order, invoice, customer, dto.message);
    const toEmail = dto.to_email?.trim() || this.resolveCustomerEmail(customer);
    if (!toEmail) {
      throw new BadRequestException(
        'Indica un correo destino. El cliente no tiene correo registrado.',
      );
    }

    const subject =
      dto.subject?.trim() || renderInvoiceEmailTemplate(template.subject, values);
    const html = renderInvoiceEmailTemplate(template.body_html, values);
    const cc = this.normalizeCc(dto.cc, toEmail);
    const attachments = await this.buildAttachments(invoice, tenantId);

    await this.sendViaResend(tenantId, {
      toEmail,
      cc,
      subject,
      html,
      attachments,
    });

    const saved = await this.emailRepo.save(
      this.emailRepo.create({
        tenant_id: tenantId,
        sales_order_id: salesOrderId,
        invoice_id: invoice.id,
        to_email: toEmail,
        cc: cc.length ? cc : null,
        subject,
        message: dto.message?.trim() || null,
        sent_by: userId,
      }),
    );

    const withSender = await this.emailRepo.findOne({
      where: { id: saved.id },
      relations: ['sender'],
    });
    return this.mapEmailRow(withSender ?? saved);
  }

  async list(salesOrderId: string, tenantId: string) {
    await this.getSalesOrderOrFail(salesOrderId, tenantId);
    const rows = await this.emailRepo.find({
      where: { sales_order_id: salesOrderId, tenant_id: tenantId },
      relations: ['sender'],
      order: { sent_at: 'DESC' },
    });
    return rows.map((row) => this.mapEmailRow(row));
  }

  private async loadSendableContext(
    salesOrderId: string,
    invoiceId: string,
    tenantId: string,
    requireSendable: boolean,
  ) {
    const order = await this.salesOrderRepo.findOne({
      where: { id: salesOrderId, tenant_id: tenantId },
      relations: ['fiscal_configuration', 'customer'],
    });
    if (!order) {
      throw new NotFoundException('Orden de venta no encontrada');
    }

    const invoice = await this.electronicInvoiceService.findOne(invoiceId, tenantId);
    if (invoice.source_module !== 'sales_orders' || invoice.source_id !== salesOrderId) {
      throw new NotFoundException('La factura no pertenece a esta orden de venta');
    }

    if (requireSendable && !this.isSendable(invoice)) {
      throw new BadRequestException(
        'Solo se puede enviar una factura timbrada (PDF y XML).',
      );
    }

    const customer =
      order.customer ??
      (await this.customerRepo.findOne({ where: { id: order.customer_id } }));

    return { order, invoice, customer };
  }

  private isSendable(invoice: ElectronicInvoice): boolean {
    return (
      SENDABLE_STAMP_STATUSES.includes(invoice.stamp_status) &&
      (!!invoice.uuid || !!invoice.xml_stamped)
    );
  }

  private async ensureTemplate(tenantId: string): Promise<SalesOrderInvoiceEmailTemplate> {
    const existing = await this.templateRepo.findOne({
      where: { tenant_id: tenantId },
      relations: ['updater'],
    });
    if (existing) {
      if (isLegacyFactoryInvoiceEmailHtml(existing.body_html)) {
        existing.body_html = DEFAULT_INVOICE_EMAIL_HTML;
        return this.templateRepo.save(existing);
      }
      return existing;
    }

    const created = await this.templateRepo.save(
      this.templateRepo.create({
        tenant_id: tenantId,
        subject: DEFAULT_INVOICE_EMAIL_SUBJECT,
        body_html: DEFAULT_INVOICE_EMAIL_HTML,
      }),
    );
    return created;
  }

  private buildValues(
    order: SalesOrder,
    invoice: ElectronicInvoice,
    customer: Customer | null | undefined,
    message?: string | null,
  ): Record<string, string> {
    const customerName = [customer?.name, customer?.lastname]
      .filter(Boolean)
      .join(' ')
      .trim();
    const customerCompany =
      customer?.company_name?.trim() ||
      customer?.fiscal_razon_social?.trim() ||
      customerName ||
      'Cliente';
    const issuerName =
      order.fiscal_configuration?.razon_social?.trim() ||
      order.fiscal_razon_social?.trim() ||
      'Emisor';
    const invoiceFolio =
      [invoice.series, invoice.folio].filter(Boolean).join('-') || order.folio;
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
      extra_message: wrapExtraMessage(message),
    };
  }

  private sampleValues(): Record<string, string> {
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

  private mapTemplate(
    template: SalesOrderInvoiceEmailTemplate,
    values: Record<string, string>,
  ) {
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
      variables: INVOICE_EMAIL_TEMPLATE_VARIABLES,
      sample_values: values,
      sample_html: renderInvoiceEmailTemplate(template.body_html, values),
      sample_subject: renderInvoiceEmailTemplate(template.subject, values),
      updated_at: template.updated_at,
      updated_by: updater
        ? {
            id: updater.id,
            display_name: updaterName,
          }
        : null,
    };
  }

  private mapEmailRow(row: SalesOrderInvoiceEmail) {
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

  private resolveCustomerEmail(customer?: Customer | null): string {
    return customer?.email?.trim() || customer?.additional_email?.trim() || '';
  }

  private secondaryCustomerEmail(
    customer: Customer | null | undefined,
    toEmail: string,
  ): string | null {
    const extra = customer?.additional_email?.trim() || '';
    if (!extra || extra.toLowerCase() === toEmail.toLowerCase()) {
      return null;
    }
    return extra;
  }

  private normalizeCc(cc: string[] | undefined, toEmail: string): string[] {
    const seen = new Set([toEmail.trim().toLowerCase()]);
    const result: string[] = [];
    for (const raw of cc ?? []) {
      const email = raw.trim();
      const key = email.toLowerCase();
      if (!email || seen.has(key)) continue;
      seen.add(key);
      result.push(email);
    }
    return result;
  }

  private describeAttachments(invoice: ElectronicInvoice) {
    const attachments: { kind: 'pdf' | 'xml'; fileName: string }[] = [];
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

  private async buildAttachments(
    invoice: ElectronicInvoice,
    tenantId: string,
  ): Promise<{ filename: string; content: string }[]> {
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

  private async sendViaResend(
    tenantId: string,
    payload: {
      toEmail: string;
      cc: string[];
      subject: string;
      html: string;
      attachments: { filename: string; content: string }[];
    },
  ) {
    let config;
    try {
      config = await this.mailerConfigurationService.findActiveInternal(tenantId);
    } catch {
      throw new BadRequestException(
        'No hay una configuración de correo activa. Configúrala en Sistema.',
      );
    }
    const vendorConfig = this.mailerConfigurationService.decryptVendorConfig(config);

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

    try {
      await axios.post(
        'https://api.resend.com/emails',
        {
          from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
          to: [payload.toEmail],
          cc: payload.cc.length ? payload.cc : undefined,
          subject: payload.subject,
          html: payload.html,
          reply_to: 'replyTo' in vendorConfig ? vendorConfig.replyTo : undefined,
          attachments: payload.attachments,
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
  }

  private async getSalesOrderOrFail(id: string, tenantId: string): Promise<SalesOrder> {
    const order = await this.salesOrderRepo.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!order) {
      throw new NotFoundException('Orden de venta no encontrada');
    }
    return order;
  }

  private formatMoney(value: string | number | null | undefined, currency: string): string {
    const amount = Number(value);
    if (!Number.isFinite(amount)) {
      return '—';
    }
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency || 'MXN',
    }).format(amount);
  }

  private formatDate(value: Date | string | null | undefined): string {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('es-MX', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  }
}
