import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import PdfPrinter from 'pdfmake';
import { Payment } from '../../../entities/contracts/payment.entity';
import { Contract } from '../../../entities/contracts/contract.entity';
import { ContractDownpaymentPayment } from '../../../entities/contracts/contract-downpayment-payment.entity';
import { S3Service } from '../../../common/services/s3.service';
import { EmailTemplate } from '../../../entities/email-templates/email-template.entity';
import { FiscalConfiguration } from '../../../entities/billing/fiscal-configuration.entity';
import { RBACTenant } from '../../../entities/rbac/tenant.entity';
import { MailerConfigurationService } from '../../mailer-configuration/services/mailer-configuration.service';
import { resolveStoredContractCurrency } from '../contract-currency.util';
import { resolveReceiptFiscalId } from '../utils/payment-receipt-fiscal.util';
import {
  DEFAULT_PAYMENT_RECEIPT_HTML,
  DEFAULT_PAYMENT_RECEIPT_SUBJECT,
  PAYMENT_RECEIPT_TEMPLATE_NAME,
  PAYMENT_RECEIPT_VARIABLES,
  renderPaymentReceiptTemplate,
} from './payment-receipt.template';

export type ReceiptKind = 'payment' | 'downpayment';

type ReceiptPayment = (Payment | ContractDownpaymentPayment) & {
  kind: ReceiptKind;
  payment_date: Date | null;
};

type ReceiptValues = {
  organization_name: string;
  organization_rfc: string;
  customer_name: string;
  contract_number: string;
  property_code: string;
  cadastral_key: string;
  cadastral_line: string;
  lot_phrase: string;
  payment_number: string;
  payment_month: string;
  payment_reference: string;
  amount_paid: string;
  amount_words: string;
  amount: string;
  amount_pending: string;
  payment_date: string;
  due_date: string;
  payment_method: string;
  concept: string;
  status: string;
  extra_message: string;
  logo_data: string;
};

type PdfNode = Record<string, unknown>;

const fonts = {
  Roboto: {
    normal: './src/_public/fonts/Roboto-Regular.ttf',
    bold: './src/_public/fonts/Roboto-Bold.ttf',
    italics: './src/_public/fonts/Roboto-Italic.ttf',
    bolditalics: './src/_public/fonts/Roboto-BoldItalic.ttf',
  },
};

@Injectable()
export class PaymentReceiptService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(ContractDownpaymentPayment)
    private readonly downpaymentRepo: Repository<ContractDownpaymentPayment>,
    @InjectRepository(EmailTemplate)
    private readonly templateRepo: Repository<EmailTemplate>,
    @InjectRepository(FiscalConfiguration)
    private readonly fiscalRepo: Repository<FiscalConfiguration>,
    @InjectRepository(RBACTenant)
    private readonly tenantRepo: Repository<RBACTenant>,
    private readonly mailerConfigurationService: MailerConfigurationService,
    private readonly s3Service: S3Service,
  ) {}

  async getTemplate(organizationId: string, contractId?: string) {
    const template = await this.ensureTemplate(organizationId);
    const sample = this.sampleValues();
    const options = await this.fiscalOptions(organizationId);
    const contractFiscalId = contractId
      ? (
          await this.paymentRepo.manager.findOne(Contract, {
            where: { id: contractId, tenant_id: organizationId },
            select: ['id', 'fiscal_configuration_id'],
          })
        )?.fiscal_configuration_id
      : null;
    const effective = await this.resolveFiscal(organizationId, contractFiscalId);
    return {
      id: template.id,
      subject: template.subject,
      body_html: template.body_html,
      fiscal_configuration_id: this.readFiscalId(template),
      effective_fiscal_configuration_id: effective?.id || null,
      fiscal_configurations: options,
      variables: PAYMENT_RECEIPT_VARIABLES,
      sample_subject: renderPaymentReceiptTemplate(template.subject, sample),
      sample_html: renderPaymentReceiptTemplate(template.body_html, sample),
    };
  }

  async updateTemplate(
    organizationId: string,
    dto: {
      subject?: string;
      body_html?: string;
      reset_default?: boolean;
      fiscal_configuration_id?: string | null;
    },
  ) {
    const template = await this.ensureTemplate(organizationId);
    if (dto.reset_default) {
      template.subject = DEFAULT_PAYMENT_RECEIPT_SUBJECT;
      template.body_html = DEFAULT_PAYMENT_RECEIPT_HTML;
    } else {
      if (dto.subject?.trim()) template.subject = dto.subject.trim();
      if (dto.body_html?.trim()) template.body_html = dto.body_html;
    }
    if (dto.fiscal_configuration_id !== undefined) {
      template.custom_variables = dto.fiscal_configuration_id
        ? [{ key: 'fiscal_configuration_id', label: 'Razón social', type: 'string', defaultValue: dto.fiscal_configuration_id }]
        : null;
    }
    await this.templateRepo.save(template);
    return this.getTemplate(organizationId);
  }

  async compose(
    organizationId: string,
    contractId: string,
    paymentId: string,
    extraMessage = '',
    kind: ReceiptKind = 'payment',
  ) {
    const payment = await this.loadPayment(organizationId, contractId, paymentId, kind);
    const template = await this.ensureTemplate(organizationId);
    const values = await this.buildValues(organizationId, payment, extraMessage);
    const { logo_data: _logo, ...publicValues } = values;
    const customer = payment.contract?.customer;
    let body = this.withReceiptPeriod(template.body_html);
    if (publicValues.cadastral_key && !body.includes('cadastral_line') && !body.includes('cadastral_key')) {
      body = body.includes('{{property_code}}</strong>.')
        ? body.replace('{{property_code}}</strong>.', '{{property_code}}</strong>.{{cadastral_line}}')
        : body.replace('{{extra_message}}', '{{cadastral_line}}{{extra_message}}');
    }
    return {
      to_email: customer?.email || '',
      additional_email: customer?.additional_email || null,
      customer_name: values.customer_name,
      subject: renderPaymentReceiptTemplate(template.subject, publicValues),
      preview_html: renderPaymentReceiptTemplate(body, publicValues),
      body_html: template.body_html,
      values: publicValues,
      attachment_name: this.fileName(payment),
    };
  }

  async pdf(
    organizationId: string,
    contractId: string,
    paymentId: string,
    kind: ReceiptKind = 'payment',
  ) {
    const payment = await this.loadPayment(organizationId, contractId, paymentId, kind);
    const values = await this.buildValues(organizationId, payment, '');
    const buffer = await this.buildPdf(values);
    return { buffer, filename: this.fileName(payment) };
  }

  async send(
    organizationId: string,
    contractId: string,
    paymentId: string,
    dto: { to_email?: string; cc?: string[]; extra_message?: string },
    kind: ReceiptKind = 'payment',
  ) {
    const composed = await this.compose(
      organizationId,
      contractId,
      paymentId,
      this.wrapNote(dto.extra_message),
      kind,
    );
    const toEmail = (dto.to_email || composed.to_email || '').trim();
    if (!toEmail) {
      throw new BadRequestException('Indica el correo del destinatario.');
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

  private async ensureTemplate(organizationId: string): Promise<EmailTemplate> {
    const existing = await this.templateRepo.findOne({
      where: { tenant_id: organizationId, name: PAYMENT_RECEIPT_TEMPLATE_NAME },
    });
    if (existing) return existing;
    const created = this.templateRepo.create({
      tenant_id: organizationId,
      name: PAYMENT_RECEIPT_TEMPLATE_NAME,
      subject: DEFAULT_PAYMENT_RECEIPT_SUBJECT,
      body_html: DEFAULT_PAYMENT_RECEIPT_HTML,
      variables: PAYMENT_RECEIPT_VARIABLES.map((item) => item.key),
      is_active: true,
    });
    return this.templateRepo.save(created);
  }

  private async loadPayment(
    organizationId: string,
    contractId: string,
    paymentId: string,
    kind: ReceiptKind,
  ): Promise<ReceiptPayment> {
    const relations = ['contract', 'contract.customer', 'contract.property'];
    const payment =
      kind === 'downpayment'
        ? await this.downpaymentRepo.findOne({
            where: { id: paymentId, contract_id: contractId, tenant_id: organizationId },
            relations: [...relations],
          })
        : await this.paymentRepo.findOne({
            where: { id: paymentId, contract_id: contractId, tenant_id: organizationId },
            relations: [...relations],
          });
    if (!payment) {
      throw new NotFoundException('No se encontró el pago.');
    }
    return { ...payment, kind, payment_date: 'payment_date' in payment ? payment.payment_date : payment.paid_date };
  }

  private async buildValues(
    organizationId: string,
    payment: ReceiptPayment,
    extraMessage: string,
  ): Promise<ReceiptValues> {
    const fiscal = await this.resolveFiscal(organizationId, payment.contract?.fiscal_configuration_id);
    const organization = await this.tenantRepo.findOne({ where: { id: organizationId } });
    const currency = resolveStoredContractCurrency(payment.contract?.currency);
    const customer = payment.contract?.customer;
    const property = payment.contract?.property;
    const customerName = [customer?.name, customer?.lastname].filter(Boolean).join(' ').trim();
    const paid = Number(payment.amount_paid || 0);
    const pending = Number(payment.amount_pending || 0);
    const partial = pending > 0;
    const concept =
      payment.kind === 'downpayment'
        ? (partial ? 'pago parcial de enganche' : 'pago de enganche')
        : (partial ? 'pago parcial' : 'pago');
    const paymentMonth = this.formatMonthYear(payment.due_date || payment.payment_date);
    const paymentKindLabel = payment.kind === 'downpayment' ? 'Enganche' : 'Pago';
    const paymentReference = paymentMonth
      ? `${paymentKindLabel} ${payment.payment_number} · ${paymentMonth}`
      : `${paymentKindLabel} ${payment.payment_number}`;
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
      payment_month: paymentMonth,
      payment_reference: paymentReference,
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

  private sampleValues(): Record<string, string> {
    return {
      organization_name: 'Organización ejemplo',
      organization_rfc: 'XAXX010101000',
      customer_name: 'Ana López',
      contract_number: 'CONT-1-01',
      property_code: 'LOT-1-01',
      cadastral_key: '02-0Q3-011',
      cadastral_line: ' Clave catastral 02-0Q3-011.',
      payment_number: '12',
      payment_month: 'octubre de 2026',
      payment_reference: 'Pago 12 · octubre de 2026',
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

  private async buildPdf(values: ReceiptValues): Promise<Buffer> {
    const printer = new PdfPrinter(fonts);
    const content: PdfNode[] = [];
    if (values.logo_data) {
      content.push({ image: values.logo_data, fit: [180, 72], alignment: 'center', margin: [0, 8, 0, 18] });
    } else {
      content.push({ text: values.organization_name, alignment: 'center', bold: true, fontSize: 16, color: '#1e3a8a', margin: [0, 12, 0, 18] });
    }
    content.push(
      { text: 'RECIBO DE PAGO', alignment: 'center', bold: true, fontSize: 13, characterSpacing: 0.6, margin: [0, 18, 0, 22] },
      { text: `FECHA: ${values.payment_date}`, alignment: 'right', bold: true, fontSize: 11, margin: [0, 0, 0, 28] },
      {
        text: [
          'Recibo de ',
          { text: values.customer_name, bold: true },
          ' la cantidad de ',
          { text: values.amount_paid, bold: true },
          ` (${values.amount_words}), recibida mediante ${values.payment_method}, como ${values.concept} número ${values.payment_number}${values.payment_month ? `, correspondiente al mes de ${values.payment_month}` : ''}, por la compraventa del ${values.lot_phrase || values.property_code}${values.cadastral_key ? `, clave catastral ${values.cadastral_key}` : ''}.`,
        ],
        alignment: 'justify',
        fontSize: 12,
        lineHeight: 1.35,
        margin: [0, 0, 0, 14],
      },
      {
        text: `Recibe, en representación de ${values.organization_name}.`,
        fontSize: 12,
        margin: [0, 0, 0, 8],
      },
      {
        text: `Contrato ${values.contract_number} · ${values.payment_reference}${values.cadastral_key ? ` · Clave catastral ${values.cadastral_key}` : ''} · Saldo de este pago ${values.amount_pending}`,
        fontSize: 9,
        color: '#64748b',
        margin: [0, 8, 0, 0],
      },
    );

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
    const chunks: Buffer[] = [];
    return new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });
  }

  private fileName(payment: ReceiptPayment): string {
    const safe = String(payment.payment_number || 'pago').replace(/[^\w.-]+/g, '-');
    return `recibo-${safe}.pdf`;
  }

  private money(amount: number, currency: string): string {
    const formatted = Number(amount || 0).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `$${formatted} ${currency}`;
  }

  private formatLongDate(date: Date | string | null | undefined): string {
    if (!date) return '—';
    const text = date instanceof Date ? date.toISOString() : String(date);
    const [year, month, day] = text.slice(0, 10).split('-');
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const monthName = months[Number(month) - 1];
    if (!year || !monthName || !day) return '—';
    return `${Number(day)} de ${monthName} de ${year}`;
  }

  private formatMonthYear(date: Date | string | null | undefined): string {
    const parts = this.dateParts(date);
    if (!parts) return '';
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const monthName = months[Number(parts.month) - 1];
    if (!parts.year || !monthName) return '';
    return `${monthName} de ${parts.year}`;
  }

  private dateParts(
    date: Date | string | null | undefined,
  ): { year: string; month: string; day: string } | null {
    if (!date) return null;
    const text = date instanceof Date ? date.toISOString() : String(date);
    const match = text.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    return { year: match[1], month: match[2], day: match[3] };
  }

  private withReceiptPeriod(body: string): string {
    if (body.includes('{{payment_month}}') || body.includes('{{payment_reference}}')) return body;
    if (body.includes('del pago <strong>{{payment_number}}</strong>')) {
      return body.replace('del pago <strong>{{payment_number}}</strong>', 'del <strong>{{payment_reference}}</strong>');
    }
    if (body.includes('{{extra_message}}')) {
      return body.replace(
        '{{extra_message}}',
        '<p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#334155;">Corresponde a <strong>{{payment_reference}}</strong>.</p>{{extra_message}}',
      );
    }
    return body;
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '—';
    const text = date instanceof Date ? date.toISOString() : String(date);
    const [year, month, day] = text.slice(0, 10).split('-');
    if (year && month && day) return `${day}/${month}/${year}`;
    return '—';
  }

  private wrapNote(note?: string): string {
    const text = note?.trim();
    if (!text) return '';
    const safe = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<p style="margin:0 0 16px;padding:12px 14px;background:#eef2ff;border-radius:10px;font-size:14px;color:#312e81;">${safe}</p>`;
  }

  private readFiscalId(template: EmailTemplate): string | null {
    const stored = template.custom_variables?.find((item) => item.key === 'fiscal_configuration_id');
    const value = stored?.defaultValue;
    return typeof value === 'string' && value ? value : null;
  }

  async uploadLogo(
    organizationId: string,
    fiscalConfigurationId: string,
    file: Express.Multer.File,
  ) {
    const fiscalId = fiscalConfigurationId?.trim();
    if (!fiscalId) {
      throw new BadRequestException('Selecciona la razón social.');
    }
    const allowed = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
    if (!file?.buffer || !allowed.has(file.mimetype)) {
      throw new BadRequestException('El logo debe ser PNG, JPG o WEBP.');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('El logo no puede pasar de 5 MB.');
    }
    const fiscal = await this.fiscalRepo.findOne({ where: { id: fiscalId, tenant_id: organizationId } });
    if (!fiscal) {
      throw new NotFoundException('No se encontró la razón social.');
    }
    if (fiscal.logo) {
      await this.s3Service.deleteFile(fiscal.logo).catch(() => undefined);
    }
    fiscal.logo = await this.s3Service.uploadEntityFile(
      organizationId,
      'fiscal_configurations',
      fiscal.id,
      'logo',
      file.buffer,
      file.originalname || 'logo.png',
      file.mimetype,
    );
    await this.fiscalRepo.save(fiscal);
    return this.updateTemplate(organizationId, { fiscal_configuration_id: fiscal.id });
  }

  private async fiscalOptions(organizationId: string) {
    const rows = await this.fiscalRepo.find({ where: { tenant_id: organizationId }, order: { razon_social: 'ASC' } });
    return Promise.all(
      rows.map(async (row) => ({
        id: row.id,
        razon_social: row.razon_social,
        rfc: row.rfc,
        has_logo: !!row.logo,
        use_as_system_logo: !!row.use_as_system_logo,
        logo_url: row.logo ? await this.s3Service.getSignedUrl(row.logo, 900).catch((): null => null) : null,
      })),
    );
  }

  private async resolveFiscal(
    organizationId: string,
    contractFiscalId?: string | null,
  ): Promise<FiscalConfiguration | null> {
    const contractId = resolveReceiptFiscalId({ contractFiscalId });
    if (contractId) {
      const match = await this.fiscalRepo.findOne({
        where: { id: contractId, tenant_id: organizationId },
      });
      if (match) return match;
    }
    const template = await this.templateRepo.findOne({
      where: { tenant_id: organizationId, name: PAYMENT_RECEIPT_TEMPLATE_NAME },
    });
    const templateFiscalId = template ? this.readFiscalId(template) : null;
    if (templateFiscalId) {
      const match = await this.fiscalRepo.findOne({
        where: { id: templateFiscalId, tenant_id: organizationId },
      });
      if (match) return match;
    }
    const branded = await this.fiscalRepo.findOne({
      where: { tenant_id: organizationId, use_as_system_logo: true },
    });
    return branded || this.fiscalRepo.findOne({ where: { tenant_id: organizationId } });
  }

  private async loadLogo(key?: string | null): Promise<string> {
    if (!key) return '';
    try {
      const file = await this.s3Service.getFile(key);
      const type = file.contentType || 'image/png';
      return `data:${type};base64,${file.buffer.toString('base64')}`;
    } catch {
      return '';
    }
  }

  private async sendViaResend(
    organizationId: string,
    payload: {
      toEmail: string;
      cc: string[];
      subject: string;
      html: string;
      attachments: Array<{ filename: string; content: string }>;
    },
  ): Promise<void> {
    let config;
    try {
      config = await this.mailerConfigurationService.findActiveInternal(organizationId);
    } catch {
      throw new BadRequestException('No hay una configuración de correo activa. Configúrala en Sistema.');
    }
    const vendorConfig = this.mailerConfigurationService.decryptVendorConfig(config);
    if (config.vendor !== 'resend') {
      throw new BadRequestException('El proveedor de correo activo aún no puede enviar este recibo.');
    }
    const fromEmail = 'fromEmail' in vendorConfig ? vendorConfig.fromEmail : undefined;
    const apiKey = 'apiKey' in vendorConfig ? vendorConfig.apiKey : undefined;
    if (!fromEmail || !apiKey) {
      throw new BadRequestException('La configuración de correo activa no tiene remitente o apiKey.');
    }
    const fromName = 'fromName' in vendorConfig ? vendorConfig.fromName : undefined;
    try {
      await axios.post(
        'https://api.resend.com/emails',
        {
          from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
          to: [payload.toEmail],
          cc: payload.cc.length ? payload.cc : undefined,
          subject: payload.subject,
          html: payload.html,
          attachments: payload.attachments,
        },
        { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } },
      );
    } catch (err) {
      const remote = err?.response?.data?.message || err?.message;
      throw new BadRequestException(
        typeof remote === 'string' && remote ? `No se pudo enviar el correo: ${remote}` : 'No se pudo enviar el correo',
      );
    }
  }
}

function methodLabel(method?: string | null): string {
  const key = (method || '').toLowerCase();
  if (key.includes('transfer') || key.includes('deposito') || key.includes('depósito')) return 'depósito bancario';
  if (key.includes('efectivo')) return 'efectivo';
  if (key.includes('cheque')) return 'cheque';
  if (key.includes('tarjeta')) return 'tarjeta';
  return method || 'el medio registrado';
}

function amountToWords(amount: number, currency: string): string {
  const whole = Math.floor(Math.abs(amount));
  const cents = Math.round((Math.abs(amount) - whole) * 100);
  const words = `${capitalize(integerToSpanish(whole))} ${currency === 'MXN' ? 'pesos mexicanos' : 'dólares americanos'}`;
  return cents ? `${words} con ${cents}/100` : words;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function integerToSpanish(value: number): string {
  if (value === 0) return 'cero';
  const units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
  const chunk = (n: number): string => {
    if (n === 100) return 'cien';
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 30) return n === 20 ? 'veinte' : `veinti${units[n - 20]}`;
    if (n < 100) {
      const ten = tens[Math.floor(n / 10)];
      const unit = n % 10;
      return unit ? `${ten} y ${units[unit]}` : ten;
    }
    const hundred = hundreds[Math.floor(n / 100)];
    const rest = n % 100;
    return rest ? `${hundred} ${chunk(rest)}` : hundred;
  };
  if (value < 1000) return chunk(value);
  if (value < 1000000) {
    const thousands = Math.floor(value / 1000);
    const rest = value % 1000;
    const prefix = thousands === 1 ? 'mil' : `${chunk(thousands)} mil`;
    return rest ? `${prefix} ${chunk(rest)}` : prefix;
  }
  return String(value);
}
