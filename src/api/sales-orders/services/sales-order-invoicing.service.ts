import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { lineConceptName } from '../utils/sales-order-line-name.util';
import { Repository } from 'typeorm';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { SalesOrderPayment } from '../../../entities/sales-orders/sales-order-payment.entity';
import { Customer } from '../../../entities/customers/customer.entity';
import { ElectronicInvoiceService } from '../../electronic-invoicing/services/electronic-invoice.service';
import { AdvanceCfdiService } from '../../electronic-invoicing/services/advance-cfdi.service';
import {
  BuiltCfdiAmounts,
  fiveDigitPostalCode,
  inferIvaPercentage,
  MerchandiseLineInput,
  resolveSatUnit,
} from '../../electronic-invoicing/utils/advance-cfdi.util';
import { CancelElectronicInvoiceDto } from '../../electronic-invoicing/dto/cancel-electronic-invoice.dto';
import { StampSalesOrderInvoiceDto } from '../dto/stamp-sales-order-invoice.dto';
import { StampSalesOrderCreditNoteDto } from '../dto/stamp-sales-order-credit-note.dto';
import { StampAdvanceInvoiceDto } from '../../electronic-invoicing/dto/stamp-advance-invoice.dto';
import { ApplyAdvanceInvoiceDto } from '../../electronic-invoicing/dto/apply-advance-invoice.dto';
import { PosShiftsService } from '../../pos-shifts/pos-shifts.service';
import { AdvanceShiftPaymentService } from '../../pos-shifts/services/advance-shift-payment.service';
import { paymentMethodFromFormaPago } from '../../pos-shifts/utils/advance-payment-method.util';
import { ServiceSubscriptionPeriod } from '../../../entities/service-subscriptions/service-subscription-period.entity';
import { ServiceSubscriptionPeriodStatus } from '../../../entities/service-subscriptions/service-subscription-period-status.enum';
import { ElectronicInvoice } from '../../../entities/electronic-invoicing/electronic-invoice.entity';
import { FinkokEnvironment } from '../../../entities/electronic-invoicing/finkok-provider-configuration.entity';
import {
  ParsedCfdi,
  parseCfdiXmlForPdf,
  parseStampedCfdiXml,
} from '../../electronic-invoicing/utils/cfdi-xml.parser';
import {
  buildPaymentComplementXml,
  formaPagoFromSalesMethod,
  PaymentComplementPayment,
  paymentComplementFecha,
  taxesFromIncomeCfdi,
} from '../../electronic-invoicing/utils/payment-cfdi.util';
import {
  extractStampDate,
  parseCfdiDate,
  stampDateFromXml,
} from '../../electronic-invoicing/utils/cfdi-stamp-date.util';
import { invoiceCurrencyMismatchMessage } from '../utils/sales-order-currency.util';
import { isFiscalFlagOn } from '../../billing/utils/fiscal-tax-policy.util';
import { CustomerDebtLedgerService } from '../../accounting/services/customer-debt-ledger.service';
import { CustomerCreditLedgerService } from '../../accounting/services/customer-credit-ledger.service';
import { buildSalesCreditNoteCfdi } from '../utils/credit-note-cfdi.util';
import {
  CREDIT_NOTE_RELATION_TYPE,
  creditNoteIncrement,
  isCreditableIncomeInvoice,
  nextCreditNoteFolio,
  remainingCreditable,
  roundCreditMoney,
  sumVigenteCommercialCreditNotes,
} from '../utils/credit-note.util';
import { assertSalesOrderNotInGlobalInvoice } from '../../accounting/utils/global-invoice.util';
import { assertOrderMonthStillOpen } from '../../accounting/utils/public-invoice-policy.util';

type ExistingCfdiOrigin = 'xml' | 'pdf' | 'uuid' | 'xml_pdf';

interface UploadedCfdiFile {
  buffer: Buffer;
  originalname?: string;
}

interface UploadedCfdiFiles {
  xml?: UploadedCfdiFile;
  pdf?: UploadedCfdiFile;
}

interface ExistingCfdiData {
  uuid: string;
  origin: ExistingCfdiOrigin;
  xml: string | null;
  pdf: Buffer | null;
  rfcEmisor: string | null;
  rfcReceptor: string | null;
  receptorNombre: string | null;
  subtotal: number | null;
  total: number | null;
  series: string | null;
  folio: string | null;
  currency: string | null;
  stampedAt: Date | null;
}

interface PaymentComplementStamp {
  income: ElectronicInvoice;
  xml: string;
  amount: number;
  relatedUuid: string;
  customerRfc: string;
  customerName: string;
  folio: string;
  environment?: FinkokEnvironment;
}

interface PreparedPaymentComplement {
  status: PaymentComplementStatus;
  stamp: PaymentComplementStamp | null;
}

@Injectable()
export class SalesOrderInvoicingService {
  private readonly logger = new Logger(SalesOrderInvoicingService.name);

  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderPayment)
    private readonly paymentRepo: Repository<SalesOrderPayment>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly electronicInvoiceService: ElectronicInvoiceService,
    private readonly advanceCfdi: AdvanceCfdiService,
    private readonly posShiftsService: PosShiftsService,
    private readonly advancePayments: AdvanceShiftPaymentService,
    private readonly debtLedger: CustomerDebtLedgerService,
    private readonly creditLedger: CustomerCreditLedgerService,
    @InjectRepository(ServiceSubscriptionPeriod)
    private readonly periodRepo: Repository<ServiceSubscriptionPeriod>,
  ) {}

  async registerExistingInvoice(
    salesOrderId: string,
    tenantId: string,
    userId: string,
    files: UploadedCfdiFiles,
    typedUuid?: string,
  ): Promise<ElectronicInvoice> {
    const order = await this.getSalesOrderWithRelations(salesOrderId, tenantId);

    if (order.general_status === 'Cancelada') {
      throw new BadRequestException('No se puede facturar una orden cancelada');
    }
    if (!order.fiscal_configuration_id || !order.fiscal_configuration?.rfc) {
      throw new BadRequestException('La orden no tiene razón social');
    }

    const customer = await this.customerRepo.findOne({
      where: { id: order.customer_id },
    });
    if (!customer?.fiscal_rfc) {
      throw new BadRequestException('El cliente debe tener RFC configurado');
    }

    const parsed = this.readExistingCfdi(files, typedUuid);

    const invoice = await this.electronicInvoiceService.registerExisting(tenantId, userId, {
      fiscal_configuration_id: order.fiscal_configuration_id,
      source_id: salesOrderId,
      uuid: parsed.uuid,
      rfc_emisor: parsed.rfcEmisor || order.fiscal_configuration.rfc,
      rfc_receptor: parsed.rfcReceptor || customer.fiscal_rfc,
      receptor_nombre: parsed.receptorNombre || customer.fiscal_razon_social || customer.name,
      subtotal: parsed.subtotal ?? Number(order.subtotal),
      total: parsed.total ?? Number(order.total),
      series: parsed.series,
      folio: parsed.folio || order.folio,
      currency: parsed.currency || 'MXN',
      stamped_at: parsed.stampedAt,
      xml: parsed.xml,
      pdf: parsed.pdf,
      origin: parsed.origin,
    });

    await this.periodRepo.update(
      { tenant_id: tenantId, sales_order_id: salesOrderId },
      {
        electronic_invoice_id: invoice.id,
        status: ServiceSubscriptionPeriodStatus.Invoiced,
        invoice_error: null,
      },
    );

    return invoice;
  }

  async attachManualFiles(
    salesOrderId: string,
    invoiceId: string,
    tenantId: string,
    files: UploadedCfdiFiles,
  ): Promise<ElectronicInvoice> {
    await this.getSalesOrderWithRelations(salesOrderId, tenantId);
    const invoice = await this.electronicInvoiceService.findOne(invoiceId, tenantId);
    if (invoice.source_id !== salesOrderId || invoice.metadata?.registered_existing !== true) {
      throw new BadRequestException('Solo se pueden completar facturas registradas a mano');
    }
    if (!files.xml && !files.pdf) {
      throw new BadRequestException('Sube el XML, el PDF o ambos');
    }

    const parsed = this.readExistingCfdi(files, invoice.uuid ?? undefined);
    if (parsed.uuid !== String(invoice.uuid || '').toUpperCase()) {
      throw new BadRequestException('El archivo no corresponde al UUID de esta factura');
    }

    return this.electronicInvoiceService.attachManualFiles(invoiceId, tenantId, {
      xml: parsed.xml,
      pdf: parsed.pdf,
      series: parsed.series,
      folio: parsed.folio,
      subtotal: parsed.subtotal,
      total: parsed.total,
      rfcEmisor: parsed.rfcEmisor,
      rfcReceptor: parsed.rfcReceptor,
      receptorNombre: parsed.receptorNombre,
      stampedAt: parsed.stampedAt,
    });
  }

  async unlinkManualInvoice(
    salesOrderId: string,
    invoiceId: string,
    tenantId: string,
  ): Promise<void> {
    await this.getSalesOrderWithRelations(salesOrderId, tenantId);
    await this.electronicInvoiceService.unlinkManualRegistration(invoiceId, tenantId, salesOrderId);
    await this.periodRepo.update(
      { tenant_id: tenantId, sales_order_id: salesOrderId, electronic_invoice_id: invoiceId },
      {
        electronic_invoice_id: null,
        status: ServiceSubscriptionPeriodStatus.Linked,
        invoice_error: null,
      },
    );
  }

  private readExistingCfdi(files: UploadedCfdiFiles, typedUuid?: string): ExistingCfdiData {
    const xmlFile = files?.xml;
    const pdfFile = files?.pdf;

    let fromXml: ExistingCfdiData | null = null;
    if (xmlFile) {
      fromXml = this.readXmlCfdi(xmlFile.buffer.toString('utf8'));
    }

    let pdfUuid: string | null = null;
    if (pdfFile) {
      const isPdf =
        (pdfFile.originalname ?? '').toLowerCase().endsWith('.pdf')
        || pdfFile.buffer.subarray(0, 4).toString() === '%PDF';
      if (!isPdf) {
        throw new BadRequestException('El archivo PDF no es un PDF');
      }
      pdfUuid = extractUuid(pdfFile.buffer.toString('latin1'));
    }
    const pdfStamp = pdfFile ? extractStampDate(pdfFile.buffer) : null;

    if (fromXml && pdfUuid && fromXml.uuid !== pdfUuid) {
      throw new BadRequestException('El UUID del XML y el del PDF no coinciden');
    }

    if (fromXml) {
      return {
        ...fromXml,
        stampedAt: fromXml.stampedAt ?? pdfStamp,
        origin: pdfFile ? 'xml_pdf' : 'xml',
        pdf: pdfFile?.buffer ?? null,
      };
    }

    if (pdfFile) {
      const uuid = pdfUuid ?? extractUuid(typedUuid);
      if (!uuid) {
        throw new BadRequestException(
          'No encontré el UUID en el PDF. Sube también el XML o escríbelo.',
        );
      }
      return { ...emptyFromUuid(uuid, 'pdf'), pdf: pdfFile.buffer, stampedAt: pdfStamp };
    }

    const uuid = extractUuid(typedUuid);
    if (!uuid) {
      throw new BadRequestException('Sube el XML, el PDF o ambos, o escribe el UUID');
    }
    return { ...emptyFromUuid(uuid, 'uuid'), pdf: null };
  }

  private readXmlCfdi(text: string): ExistingCfdiData {
    let parsed: ParsedCfdi;
    try {
      parsed = parseStampedCfdiXml(text);
    } catch {
      throw new BadRequestException('El XML no trae un CFDI timbrado con UUID');
    }
    return {
      uuid: parsed.timbre.uuid.toUpperCase(),
      origin: 'xml',
      xml: text,
      pdf: null,
      rfcEmisor: parsed.emisor.rfc || null,
      rfcReceptor: parsed.receptor.rfc || null,
      receptorNombre: parsed.receptor.nombre || null,
      subtotal: Number(parsed.subTotal) || null,
      total: Number(parsed.total) || null,
      series: parsed.serie || null,
      folio: parsed.folio || null,
      currency: parsed.moneda || null,
      stampedAt: parseCfdiDate(parsed.timbre.fechaTimbrado),
    };
  }

  async listInvoices(salesOrderId: string, tenantId: string): Promise<ElectronicInvoice[]> {
    const order = await this.getSalesOrderOrFail(salesOrderId, tenantId);
    const invoices = await this.electronicInvoiceService.findBySource(
      tenantId,
      'sales_orders',
      salesOrderId,
    );

    if (
      order.advance_invoice_id &&
      !invoices.some((invoice) => invoice.id === order.advance_invoice_id)
    ) {
      const advance = await this.electronicInvoiceService
        .findOne(order.advance_invoice_id, tenantId)
        .catch(() => null);
      if (advance) {
        invoices.unshift(advance);
      }
    }

    for (const invoice of invoices) {
      await this.repairStoredStampDate(invoice);
    }

    return invoices;
  }

  async getPaymentComplementStatus(
    salesOrderId: string,
    tenantId: string,
  ): Promise<PaymentComplementStatus> {
    return (await this.preparePaymentComplement(salesOrderId, tenantId)).status;
  }

  async stampPaymentComplement(
    salesOrderId: string,
    tenantId: string,
    userId: string,
    environment?: FinkokEnvironment,
  ): Promise<ElectronicInvoice> {
    const prepared = await this.preparePaymentComplement(salesOrderId, tenantId);
    if (!prepared.stamp) {
      throw new BadRequestException(prepared.status.reason || 'No se puede generar el CEP');
    }

    const { income, customerRfc, customerName, xml, amount } = prepared.stamp;
    const stampEnvironment = environment ?? prepared.stamp.environment;
    return this.electronicInvoiceService.stamp(tenantId, userId, {
      fiscal_configuration_id: income.fiscal_configuration_id,
      source_module: 'sales_orders',
      source_id: salesOrderId,
      xml,
      rfc_receptor: customerRfc,
      receptor_nombre: customerName,
      subtotal: 0,
      total: 0,
      series: 'CP',
      folio: prepared.stamp.folio,
      tipo_comprobante: 'P',
      currency: 'XXX',
      environment: stampEnvironment,
      metadata: {
        kind: 'payment_complement',
        related_invoice_id: income.id,
        related_uuid: prepared.stamp.relatedUuid,
        monto_total_pagos: amount,
        sales_order_folio: prepared.stamp.folio,
      },
    });
  }

  private async repairStoredStampDate(invoice: ElectronicInvoice): Promise<void> {
    if (invoice.metadata?.registered_existing !== true) return;

    const fromXml = stampDateFromXml(invoice.xml_stamped);
    let next = fromXml;
    if (!next && invoice.pdf_stamped_s3_key) {
      try {
        const pdf = await this.electronicInvoiceService.readPdfBuffer(invoice.id, invoice.tenant_id);
        next = extractStampDate(pdf);
      } catch {
        next = null;
      }
    }
    if (!next) return;

    const current = invoice.stamped_at ? new Date(invoice.stamped_at).getTime() : 0;
    if (Math.abs(current - next.getTime()) < 60_000) return;

    invoice.stamped_at = next;
    await this.electronicInvoiceService.saveStampDate(invoice.id, invoice.tenant_id, next);
  }

  async stampInvoice(
    salesOrderId: string,
    tenantId: string,
    userId: string,
    dto: StampSalesOrderInvoiceDto,
  ): Promise<ElectronicInvoice> {
    const order = await this.getSalesOrderWithRelations(salesOrderId, tenantId);

    if (order.general_status === 'Cancelada') {
      throw new BadRequestException('No se puede facturar una orden cancelada');
    }

    assertOrderMonthStillOpen(order.created_at, order.fiscal_configuration);
    await assertSalesOrderNotInGlobalInvoice(this.salesOrderRepo.manager, tenantId, salesOrderId);

    await this.electronicInvoiceService.assertNoActiveProductionInvoice(
      tenantId,
      'sales_orders',
      salesOrderId,
      dto.environment,
    );

    if (order.advance_invoice_id) {
      const advance = await this.electronicInvoiceService
        .findOne(order.advance_invoice_id, tenantId)
        .catch(() => null);
      const summary = await this.advanceCfdi.summarize(tenantId, advance);
      if (summary && !summary.applied) {
        throw new BadRequestException(
          'Esta orden tiene un anticipo sin aplicar. Factura la mercancía aplicando el anticipo.',
        );
      }
    }

    const customer = await this.customerRepo.findOne({
      where: { id: order.customer_id },
    });

    if (!customer?.fiscal_rfc) {
      throw new BadRequestException('El cliente debe tener RFC configurado');
    }

    const xml = dto.xml ?? this.buildXmlPlaceholder(order, customer);

    const currencyError = invoiceCurrencyMismatchMessage(order.currency, xml, order.exchange_rate);
    if (currencyError) {
      throw new BadRequestException(currencyError);
    }

    let parsedXml: ParsedCfdi | null = null;
    try {
      parsedXml = parseCfdiXmlForPdf(xml);
    } catch {
      parsedXml = null;
    }

    const invoice = await this.electronicInvoiceService.stamp(tenantId, userId, {
      fiscal_configuration_id: order.fiscal_configuration_id,
      source_module: 'sales_orders',
      source_id: salesOrderId,
      xml,
      rfc_receptor: customer.fiscal_rfc,
      receptor_nombre: customer.fiscal_razon_social ?? customer.name ?? undefined,
      subtotal: Number(parsedXml?.subTotal) || Number(order.subtotal),
      total: Number(parsedXml?.total) || Number(order.total),
      currency: parsedXml?.moneda || order.currency || 'MXN',
      series: dto.series,
      folio: dto.folio ?? order.folio,
      tipo_comprobante: dto.tipo_comprobante ?? 'I',
      certificate_serial: dto.certificate_serial,
      environment: dto.environment,
      metadata: {
        sales_order_folio: order.folio,
        customer_id: order.customer_id,
      },
    });

    await this.periodRepo.update(
      { tenant_id: tenantId, sales_order_id: salesOrderId },
      {
        electronic_invoice_id: invoice.id,
        status: ServiceSubscriptionPeriodStatus.Invoiced,
        invoice_error: null,
      },
    );

    return invoice;
  }

  async stampCreditNote(
    salesOrderId: string,
    invoiceId: string,
    tenantId: string,
    userId: string,
    dto: StampSalesOrderCreditNoteDto,
  ): Promise<ElectronicInvoice> {
    const order = await this.getSalesOrderOrFail(salesOrderId, tenantId);
    const income = await this.electronicInvoiceService.findOne(invoiceId, tenantId);
    if (!this.invoiceBelongsToOrder(order, income)) {
      throw new NotFoundException('La factura no pertenece a esta orden de venta');
    }
    if (!isCreditableIncomeInvoice(income) || !this.electronicInvoiceService.isCfdiVigente(income)) {
      throw new BadRequestException(
        'Solo se puede emitir una nota de crédito sobre una factura de ingreso vigente',
      );
    }
    if (!income.uuid) {
      throw new BadRequestException('La factura no tiene UUID para relacionar la nota de crédito');
    }

    const xmlSource = income.xml_stamped || income.xml_unsigned;
    if (!xmlSource) {
      throw new BadRequestException('La factura no tiene XML para armar la nota de crédito');
    }
    let parsed: ParsedCfdi;
    try {
      parsed = parseCfdiXmlForPdf(xmlSource);
    } catch {
      throw new BadRequestException('El XML de la factura no se pudo leer');
    }
    if (!parsed.emisor.rfc || !parsed.receptor.rfc || !parsed.emisor.regimenFiscal || !parsed.receptor.regimenFiscalReceptor) {
      throw new BadRequestException('El XML de la factura no trae los datos fiscales para la nota');
    }
    if (!parsed.lugarExpedicion || !parsed.receptor.domicilioFiscalReceptor) {
      throw new BadRequestException(
        'El XML de la factura no trae el código postal de expedición o del receptor',
      );
    }

    const siblings = await this.electronicInvoiceService.findBySource(tenantId, 'sales_orders', salesOrderId);
    const previousOnInvoice = sumVigenteCommercialCreditNotes(siblings, income.id);
    const previousOnOrder = sumVigenteCommercialCreditNotes(siblings);
    const available = remainingCreditable(Number(income.total), previousOnInvoice);
    const amount = roundCreditMoney(dto.amount);
    if (amount > available + 0.009) {
      throw new BadRequestException(
        `El importe supera lo disponible de la factura (${available.toFixed(2)})`,
      );
    }

    const paid = await this.sumOrderPayments(tenantId, salesOrderId);
    const effect = creditNoteIncrement({
      orderTotal: Number(order.total || 0),
      amountPaid: paid,
      previousNotesTotal: previousOnOrder,
      noteTotal: amount,
    });

    const tax = Number(parsed.totalImpuestosTrasladados) || 0;
    const taxableBase = Math.max(0, Number(parsed.subTotal || income.subtotal) - Number(parsed.descuento || 0));
    const ivaPercentage = inferIvaPercentage(tax, taxableBase);
    const concept = parsed.conceptos[0];
    const currency = (income.currency || parsed.moneda || order.currency || 'MXN').toUpperCase();
    const reason = dto.reason.trim().replace(/\s+/g, ' ');
    const folio = nextCreditNoteFolio(order.folio, siblings.map((row) => row.folio));

    let built: BuiltCfdiAmounts;
    try {
      built = buildSalesCreditNoteCfdi({
        series: income.series,
        folio,
        totalAmount: amount,
        ivaPercentage,
        usoCfdi: (dto.uso_cfdi || 'G02').trim() || 'G02',
        formaPago: (parsed.formaPago || '15').trim() || '15',
        emisor: {
          rfc: parsed.emisor.rfc,
          nombre: parsed.emisor.nombre,
          regimen: parsed.emisor.regimenFiscal,
          postalCode: parsed.lugarExpedicion,
        },
        receptor: {
          rfc: parsed.receptor.rfc,
          nombre: parsed.receptor.nombre,
          regimen: parsed.receptor.regimenFiscalReceptor,
          postalCode: parsed.receptor.domicilioFiscalReceptor,
        },
        descripcion: reason,
        relatedUuid: income.uuid,
        satClave: concept?.claveProdServ,
        unitCode: concept?.claveUnidad,
        unitName: concept?.unidad,
        currency,
        exchangeRate: currency === 'USD' ? Number(order.exchange_rate || 0) : null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo armar la nota de crédito';
      throw new BadRequestException(message);
    }

    const stamped = await this.electronicInvoiceService.stamp(tenantId, userId, {
      fiscal_configuration_id: income.fiscal_configuration_id,
      source_module: 'sales_orders',
      source_id: salesOrderId,
      xml: built.xml,
      rfc_receptor: parsed.receptor.rfc,
      receptor_nombre: parsed.receptor.nombre,
      subtotal: built.subtotal,
      total: built.total,
      series: income.series ?? undefined,
      folio,
      tipo_comprobante: 'E',
      currency,
      environment: dto.environment ?? this.finkokEnvironment(income),
      invoice_role: 'credit_note',
      related_invoice_id: income.id,
      relation_type: CREDIT_NOTE_RELATION_TYPE,
      metadata: {
        invoice_role: 'credit_note',
        related_uuid: income.uuid,
        relation_type: CREDIT_NOTE_RELATION_TYPE,
        related_invoice_id: income.id,
        applied_to_pending: effect.appliedToPending,
        customer_credit: effect.customerCredit,
        reason,
        sales_order_folio: order.folio,
      },
    });

    await this.postCreditNoteEffect(order, stamped.id, effect, reason, currency, userId);
    return stamped;
  }

  async cancelInvoice(
    salesOrderId: string,
    invoiceId: string,
    tenantId: string,
    userId: string,
    dto: CancelElectronicInvoiceDto,
  ): Promise<ElectronicInvoice> {
    const order = await this.getSalesOrderOrFail(salesOrderId, tenantId);
    const invoice = await this.electronicInvoiceService.findOne(invoiceId, tenantId);

    if (!this.invoiceBelongsToOrder(order, invoice)) {
      throw new NotFoundException('La factura no pertenece a esta orden de venta');
    }

    await this.advanceCfdi.assertAdvanceCancellable(tenantId, invoice);
    await this.advancePayments.assertVoidable(tenantId, invoiceId);
    const cancelled = await this.electronicInvoiceService.cancel(invoiceId, tenantId, userId, dto);
    await this.advancePayments.voidByInvoice(tenantId, userId, invoiceId);
    await this.settleCancelledCreditNote(order, cancelled, userId);
    return cancelled;
  }

  async syncInvoiceSat(
    salesOrderId: string,
    invoiceId: string,
    tenantId: string,
    userId: string,
  ): Promise<ElectronicInvoice> {
    const order = await this.getSalesOrderOrFail(salesOrderId, tenantId);
    const invoice = await this.electronicInvoiceService.findOne(invoiceId, tenantId);

    if (!this.invoiceBelongsToOrder(order, invoice)) {
      throw new NotFoundException('La factura no pertenece a esta orden de venta');
    }

    const synced = await this.electronicInvoiceService.syncSatStatus(
      invoiceId,
      tenantId,
      userId,
      'manual',
    );
    await this.settleCancelledCreditNote(order, synced, userId);
    return synced;
  }

  async getInvoicePdf(
    salesOrderId: string,
    invoiceId: string,
    tenantId: string,
    regenerate = false,
    preview = false,
  ) {
    const order = await this.getSalesOrderOrFail(salesOrderId, tenantId);
    const invoice = await this.electronicInvoiceService.findOne(invoiceId, tenantId);

    if (!this.invoiceBelongsToOrder(order, invoice)) {
      throw new NotFoundException('La factura no pertenece a esta orden de venta');
    }

    return this.electronicInvoiceService.getPdfDownload(invoiceId, tenantId, regenerate, preview);
  }

  async getInvoiceXml(salesOrderId: string, invoiceId: string, tenantId: string) {
    const order = await this.getSalesOrderOrFail(salesOrderId, tenantId);
    const invoice = await this.electronicInvoiceService.findOne(invoiceId, tenantId);

    if (!this.invoiceBelongsToOrder(order, invoice)) {
      throw new NotFoundException('La factura no pertenece a esta orden de venta');
    }

    return this.electronicInvoiceService.getXmlDownload(invoiceId, tenantId);
  }

  private buildXmlPlaceholder(order: SalesOrder, customer: Customer): string {
    throw new BadRequestException(
      'Debe enviar el XML CFDI en el campo xml. La generación automática desde la orden estará disponible próximamente.',
    );
  }

  private async preparePaymentComplement(
    salesOrderId: string,
    tenantId: string,
  ): Promise<PreparedPaymentComplement> {
    const order = await this.getSalesOrderOrFail(salesOrderId, tenantId);
    const payments = await this.paymentRepo.find({
      where: { sales_order_id: salesOrderId, tenant_id: tenantId },
      order: { payment_date: 'ASC', created_at: 'ASC' },
    });
    const orderTotal = Number(order.total || 0);
    const paidAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const pending = Math.max(Number((orderTotal - paidAmount).toFixed(2)), 0);
    const paid = order.general_status !== 'Cancelada' && orderTotal > 0.009 && pending <= 0.009;

    const invoices = await this.electronicInvoiceService.findBySource(
      tenantId,
      'sales_orders',
      salesOrderId,
    );
    const empty: PaymentComplementStatus = {
      paid,
      can_generate: false,
      reason: null,
      payment_complement: null,
    };

    if (order.general_status === 'Cancelada') {
      return { status: { ...empty, paid: false, reason: null }, stamp: null };
    }

    const income = this.pickIncomeInvoice(invoices);
    const complement = this.pickPaymentComplement(invoices, income);
    if (complement) {
      return {
        status: {
          paid,
          can_generate: false,
          reason: null,
          payment_complement: this.mapPaymentComplement(complement),
        },
        stamp: null,
      };
    }

    if (!paid) {
      return { status: empty, stamp: null };
    }

    if (!income) {
      return {
        status: {
          ...empty,
          reason: 'Primero timbra la factura de la venta. El CEP se liga a ese comprobante.',
        },
        stamp: null,
      };
    }

    if (!income.xml_stamped) {
      return {
        status: {
          ...empty,
          reason: 'La factura no tiene XML timbrado, así que no se puede armar el CEP.',
        },
        stamp: null,
      };
    }

    let parsed: ParsedCfdi;
    try {
      parsed = parseCfdiXmlForPdf(income.xml_stamped);
    } catch {
      return {
        status: { ...empty, reason: 'El XML de la factura no se pudo leer.' },
        stamp: null,
      };
    }

    if (!parsed.timbre.uuid && !income.uuid) {
      return {
        status: { ...empty, reason: 'La factura no tiene UUID, así que no se puede ligar el CEP.' },
        stamp: null,
      };
    }

    if (
      !parsed.emisor.rfc ||
      !parsed.receptor.rfc ||
      !parsed.lugarExpedicion ||
      !parsed.receptor.domicilioFiscalReceptor ||
      !parsed.receptor.regimenFiscalReceptor
    ) {
      return {
        status: {
          ...empty,
          reason: 'A la factura le faltan datos fiscales para armar el CEP.',
        },
        stamp: null,
      };
    }

    if ((parsed.metodoPago || '').toUpperCase() !== 'PPD') {
      return {
        status: {
          ...empty,
          reason:
            'El comprobante electrónico de pago solo aplica si la factura es PPD. Esta se timbró como PUE, y el pago ya quedó en esa factura.',
        },
        stamp: null,
      };
    }

    if (/<(?:[\w.-]+:)?Retencion\b/i.test(income.xml_stamped)) {
      return {
        status: {
          ...empty,
          reason: 'Esta factura tiene retenciones. El CEP automático todavía no las arma.',
        },
        stamp: null,
      };
    }

    const selected: PaymentComplementPayment[] = [];
    let remaining = Number(parsed.total) || Number(income.total) || 0;
    for (const payment of payments) {
      if (remaining <= 0.009) break;
      if (payment.source === 'advance') continue;
      const amount = Number(payment.amount || 0);
      if (amount <= 0) continue;
      if ((payment.currency || 'MXN') !== 'MXN') {
        return {
          status: { ...empty, reason: 'El CEP automático solo cubre pagos en MXN.' },
          stamp: null,
        };
      }
      const formaPago = formaPagoFromSalesMethod(payment.payment_method);
      if (!formaPago) {
        return {
          status: {
            ...empty,
            reason:
              'Para el CEP cada pago debe ser efectivo, cheque, transferencia o tarjeta. Separa un pago mixto.',
          },
          stamp: null,
        };
      }
      selected.push({
        amount,
        paymentDate: String(payment.payment_date),
        formaPago,
        reference: payment.reference_number,
      });
      remaining -= amount;
    }

    const taxInfo = taxesFromIncomeCfdi(parsed);

    try {
      const built = buildPaymentComplementXml({
        series: 'CP',
        folio: order.folio || income.folio || '1',
        fecha: paymentComplementFecha(),
        lugarExpedicion: parsed.lugarExpedicion,
        emisor: {
          rfc: parsed.emisor.rfc,
          nombre: parsed.emisor.nombre,
          regimen: parsed.emisor.regimenFiscal,
        },
        receptor: {
          rfc: parsed.receptor.rfc,
          nombre: parsed.receptor.nombre,
          regimen: parsed.receptor.regimenFiscalReceptor,
          postalCode: parsed.receptor.domicilioFiscalReceptor,
        },
        related: {
          uuid: parsed.timbre.uuid || income.uuid || '',
          serie: parsed.serie,
          folio: parsed.folio,
          moneda: parsed.moneda || 'MXN',
          total: Number(parsed.total) || Number(income.total) || 0,
          fecha: parsed.fecha,
        },
        taxes: taxInfo.taxes,
        objetoImp: taxInfo.objetoImp,
        payments: selected,
      });

      const environment = this.finkokEnvironment(income);
      return {
        status: {
          ...empty,
          can_generate: true,
          related_environment: this.finkokEnvironment(income) ?? null,
        },
        stamp: {
          income,
          xml: built.xml,
          amount: built.amount,
          relatedUuid: (parsed.timbre.uuid || income.uuid || '').toUpperCase(),
          customerRfc: parsed.receptor.rfc,
          customerName: parsed.receptor.nombre,
          folio: order.folio || income.folio || '1',
          environment,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo armar el CEP';
      return { status: { ...empty, reason: message }, stamp: null };
    }
  }

  private async sumOrderPayments(tenantId: string, salesOrderId: string): Promise<number> {
    const row = await this.paymentRepo
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'paid')
      .where('payment.tenant_id = :tenantId', { tenantId })
      .andWhere('payment.sales_order_id = :salesOrderId', { salesOrderId })
      .getRawOne<{ paid: string | number }>();
    return Number(row?.paid || 0);
  }

  private async postCreditNoteEffect(
    order: SalesOrder,
    invoiceId: string,
    effect: { appliedToPending: number; customerCredit: number },
    reason: string,
    currency: string,
    userId: string,
  ): Promise<void> {
    try {
      await this.debtLedger.captureCreditNote({
        tenantId: order.tenant_id,
        salesOrderId: order.id,
        invoiceId,
        amount: effect.appliedToPending,
        userId,
      });
      if (order.fiscal_configuration_id) {
        await this.creditLedger.recordCredit({
          tenantId: order.tenant_id,
          customerId: order.customer_id,
          fiscalConfigurationId: order.fiscal_configuration_id,
          currency,
          amount: effect.customerCredit,
          salesOrderId: order.id,
          electronicInvoiceId: invoiceId,
          notes: reason,
          userId,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Nota de crédito timbrada sin reflejar el saldo (${invoiceId}): ${message}`);
    }
  }

  private async settleCancelledCreditNote(
    order: SalesOrder,
    invoice: ElectronicInvoice,
    userId: string,
  ): Promise<void> {
    if (invoice.invoice_role !== 'credit_note') return;
    if (this.electronicInvoiceService.isCfdiVigente(invoice)) return;
    try {
      await this.debtLedger.reverseCreditNote({
        tenantId: order.tenant_id,
        salesOrderId: order.id,
        invoiceId: invoice.id,
        userId,
      });
      await this.creditLedger.reverseCredit({
        tenantId: order.tenant_id,
        electronicInvoiceId: invoice.id,
        userId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`No se revirtió el saldo de la nota ${invoice.id}: ${message}`);
    }
  }

  private pickIncomeInvoice(invoices: ElectronicInvoice[]): ElectronicInvoice | null {
    const candidates = invoices.filter(
      (invoice) =>
        this.electronicInvoiceService.isCfdiVigente(invoice) &&
        (invoice.tipo_comprobante || 'I') === 'I' &&
        invoice.invoice_role !== 'advance',
    );
    const parsed = candidates.map((invoice) => ({
      invoice,
      metodo: this.readMetodoPago(invoice),
    }));
    const ppd = parsed.filter((row) => row.metodo === 'PPD');
    const pool = (ppd.length ? ppd : parsed).slice().sort((a, b) => {
      const role = (row: { invoice: ElectronicInvoice }) =>
        row.invoice.invoice_role === 'merchandise' ? 0 : 1;
      if (role(a) !== role(b)) return role(a) - role(b);
      return Number(b.invoice.total) - Number(a.invoice.total);
    });
    return pool[0]?.invoice ?? null;
  }

  private pickPaymentComplement(
    invoices: ElectronicInvoice[],
    income: ElectronicInvoice | null,
  ): ElectronicInvoice | null {
    const relatedUuid = (income?.uuid || '').toUpperCase();
    const complements = invoices.filter(
      (invoice) => invoice.tipo_comprobante === 'P' && this.electronicInvoiceService.isCfdiVigente(invoice),
    );
    if (relatedUuid) {
      const match = complements.find(
        (invoice) => String(invoice.metadata?.related_uuid || '').toUpperCase() === relatedUuid,
      );
      if (match) return match;
      return complements.find((invoice) => !invoice.metadata?.related_uuid) ?? null;
    }
    return complements[0] ?? null;
  }

  private mapPaymentComplement(invoice: ElectronicInvoice): PaymentComplementCard {
    const amount = Number(invoice.metadata?.monto_total_pagos ?? invoice.total ?? 0);
    return {
      id: invoice.id,
      uuid: invoice.uuid,
      stamp_status: invoice.stamp_status,
      sat_status: invoice.sat_status,
      stamped_at: invoice.stamped_at,
      amount: Number.isFinite(amount) ? amount : 0,
    };
  }

  private readMetodoPago(invoice: ElectronicInvoice): string {
    if (!invoice.xml_stamped) return '';
    try {
      return parseCfdiXmlForPdf(invoice.xml_stamped).metodoPago.toUpperCase();
    } catch {
      return '';
    }
  }

  private finkokEnvironment(invoice: ElectronicInvoice): FinkokEnvironment | undefined {
    const value = invoice.metadata?.finkok_environment;
    return value === 'demo' || value === 'production' ? value : undefined;
  }

  private invoiceBelongsToOrder(order: SalesOrder, invoice: ElectronicInvoice): boolean {
    if (invoice.source_module === 'sales_orders' && invoice.source_id === order.id) {
      return true;
    }
    if (order.advance_invoice_id && invoice.id === order.advance_invoice_id) {
      return true;
    }
    return (
      !!order.advance_invoice_id &&
      invoice.related_advance_invoice_id === order.advance_invoice_id
    );
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

  private async getSalesOrderWithRelations(
    id: string,
    tenantId: string,
  ): Promise<SalesOrder> {
    const order = await this.salesOrderRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['line_items', 'fiscal_configuration'],
    });
    if (!order) {
      throw new NotFoundException('Orden de venta no encontrada');
    }
    return order;
  }

  async stampAdvance(
    salesOrderId: string,
    tenantId: string,
    userId: string,
    dto: StampAdvanceInvoiceDto,
  ): Promise<ElectronicInvoice> {
    const order = await this.getAdvanceOrder(salesOrderId, tenantId);
    if (!order.fiscal_configuration?.advance_invoicing_enabled) {
      throw new BadRequestException('Esta razón social no tiene activada la factura de anticipo');
    }
    if (order.general_status === 'Cancelada') {
      throw new BadRequestException('No se puede facturar una orden cancelada');
    }
    await assertSalesOrderNotInGlobalInvoice(this.salesOrderRepo.manager, tenantId, salesOrderId);
    if (order.advance_invoice_id) {
      throw new BadRequestException('La orden ya tiene un anticipo ligado');
    }

    const branch = order.billing_branch ?? order.warehouse?.billing_branch ?? null;
    const branchId = order.billing_branch_id ?? branch?.id ?? null;
    if (!branchId) {
      throw new BadRequestException('La orden no tiene sucursal');
    }
    const formaPago = dto.forma_pago ?? '01';
    const paymentMethod = paymentMethodFromFormaPago(formaPago);
    if (!paymentMethod) {
      throw new BadRequestException(
        'La forma de pago del anticipo debe ser efectivo (01), cheque (02), transferencia (03) o tarjeta (04 o 28)',
      );
    }
    const caja = await this.posShiftsService.resolveBranchCajaShift(tenantId, branchId);
    if (!caja.shift) {
      const sucursal = branch?.code ?? 'la sucursal';
      throw new BadRequestException(
        `No hay corte abierto en ${sucursal}. Abre el corte para registrar el dinero del anticipo.`,
      );
    }

    const parties = this.parties(order);
    const invoice = await this.advanceCfdi.stampAdvance(
      tenantId,
      userId,
      {
        sourceModule: 'sales_orders',
        sourceId: order.id,
        folio: order.folio,
        subtotal: Number(order.subtotal),
        discountTotal: Number(order.discount_total),
        globalDiscount: Number(order.global_discount_amount),
        ivaTotal: Number(order.iva_total),
        fiscalConfigurationId: order.fiscal_configuration_id,
        series: order.fiscal_configuration?.prefix,
        emisor: parties.emisor,
        receptor: parties.receptor,
      },
      { ...dto, forma_pago: formaPago },
    );
    await this.salesOrderRepo.update(
      { id: order.id, tenant_id: tenantId },
      { advance_invoice_id: invoice.id },
    );
    await this.advancePayments.record({
      tenantId,
      userId,
      shiftId: caja.shift.id,
      invoiceId: invoice.id,
      amountMxn: Number(invoice.total),
      paymentMethod,
      documentFolio: order.folio,
      salesOrderId: order.id,
    });
    return invoice;
  }

  async applyAdvance(
    salesOrderId: string,
    tenantId: string,
    userId: string,
    dto: ApplyAdvanceInvoiceDto,
  ): Promise<{ merchandise: ElectronicInvoice; application: ElectronicInvoice }> {
    const order = await this.getAdvanceOrder(salesOrderId, tenantId);
    if (order.general_status === 'Cancelada') {
      throw new BadRequestException('No se puede facturar una orden cancelada');
    }
    const advanceId = order.advance_invoice_id;
    if (!advanceId) {
      throw new BadRequestException('La orden no tiene factura de anticipo');
    }
    const advance = await this.electronicInvoiceService.findOne(advanceId, tenantId);
    const parties = this.parties(order);
    const iepsEnabled = isFiscalFlagOn(order.fiscal_configuration?.ieps_enabled, true);

    const lines: MerchandiseLineInput[] = (order.line_items ?? []).map((line) => {
      const unit = resolveSatUnit(line.product_uom?.uom?.name, line.product?.item_kind);
      const quantity = Number(line.quantity) || 0;
      return {
        satClave: line.product?.sat_clave || '01010101',
        quantity,
        unitPrice: Number(line.unit_price) || 0,
        lineDiscount: (Number(line.discount_unit) || 0) * quantity,
        ivaPercentage: Number(line.iva_percentage) || 0,
        iepsPercentage: iepsEnabled ? Number(line.ieps_percentage) || 0 : 0,
        unitCode: unit.code,
        unitName: unit.name,
        description: lineConceptName(line),
      };
    });

    return this.advanceCfdi.applyToSalesOrder(
      tenantId,
      userId,
      {
        sourceModule: 'sales_orders',
        sourceId: order.id,
        folio: order.folio,
        subtotal: Number(order.subtotal),
        discountTotal: Number(order.discount_total),
        globalDiscount: Number(order.global_discount_amount),
        ivaTotal: Number(order.iva_total),
        fiscalConfigurationId: order.fiscal_configuration_id,
        series: dto.series ?? order.fiscal_configuration?.prefix,
        emisor: parties.emisor,
        receptor: parties.receptor,
        lines,
      },
      advance,
      dto,
    );
  }

  private parties(order: SalesOrder) {
    const fiscal = order.fiscal_configuration;
    const branch = order.billing_branch ?? order.warehouse?.billing_branch ?? null;
    const lugar = fiveDigitPostalCode(branch?.postal_code);
    if (!fiscal?.rfc || !fiscal.razon_social || !fiscal.fiscal_regime) {
      throw new BadRequestException('La razón emisora no tiene RFC, nombre o régimen fiscal');
    }
    if (!lugar) {
      throw new BadRequestException('La sucursal no tiene código postal de expedición');
    }
    const customer = order.customer;
    const generic = !customer?.fiscal_rfc;
    const rfc = generic ? 'XAXX010101000' : customer.fiscal_rfc;
    const domicilio = generic ? lugar : fiveDigitPostalCode(customer.fiscal_postal_code);
    if (!domicilio) {
      throw new BadRequestException('El cliente debe tener código postal fiscal de 5 dígitos');
    }
    return {
      emisor: {
        rfc: fiscal.rfc,
        nombre: fiscal.razon_social,
        regimen: fiscal.fiscal_regime,
        postalCode: lugar,
      },
      receptor: {
        rfc,
        nombre: generic
          ? 'PUBLICO EN GENERAL'
          : customer.fiscal_razon_social || customer.name || 'PUBLICO EN GENERAL',
        regimen: '601',
        postalCode: domicilio,
      },
    };
  }

  private async getAdvanceOrder(id: string, tenantId: string): Promise<SalesOrder> {
    const order = await this.salesOrderRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: [
        'customer',
        'billing_branch',
        'warehouse',
        'warehouse.billing_branch',
        'fiscal_configuration',
        'line_items',
        'line_items.product',
        'line_items.product_uom',
        'line_items.product_uom.uom',
      ],
    });
    if (!order) {
      throw new NotFoundException('Orden de venta no encontrada');
    }
    return order;
  }
}

export interface PaymentComplementCard {
  id: string;
  uuid: string | null;
  stamp_status: string;
  sat_status: string | null;
  stamped_at: Date | null;
  amount: number;
}

export interface PaymentComplementStatus {
  paid: boolean;
  can_generate: boolean;
  reason: string | null;
  payment_complement: PaymentComplementCard | null;
  related_environment?: FinkokEnvironment | null;
}

const UUID_PATTERN =
  /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;

function extractUuid(value?: string | null): string | null {
  const match = UUID_PATTERN.exec(value ?? '');
  return match ? match[0].toUpperCase() : null;
}

function emptyFromUuid(uuid: string, origin: ExistingCfdiOrigin): ExistingCfdiData {
  return {
    uuid,
    origin,
    xml: null,
    pdf: null,
    rfcEmisor: null,
    rfcReceptor: null,
    receptorNombre: null,
    subtotal: null,
    total: null,
    series: null,
    folio: null,
    currency: null,
    stampedAt: null,
  };
}
