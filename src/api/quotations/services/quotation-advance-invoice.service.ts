import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quotation } from '../../../entities/quotations/quotation.entity';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { CancelElectronicInvoiceDto } from '../../electronic-invoicing/dto/cancel-electronic-invoice.dto';
import { StampAdvanceInvoiceDto } from '../../electronic-invoicing/dto/stamp-advance-invoice.dto';
import { AdvanceCfdiService } from '../../electronic-invoicing/services/advance-cfdi.service';
import { ElectronicInvoiceService } from '../../electronic-invoicing/services/electronic-invoice.service';
import { fiveDigitPostalCode } from '../../electronic-invoicing/utils/advance-cfdi.util';
import { PosShiftsService } from '../../pos-shifts/pos-shifts.service';
import { isPosStageInCaja } from '../../../entities/sales-orders/sales-order-pos-stage.enum';
import { AdvanceShiftPaymentService } from '../../pos-shifts/services/advance-shift-payment.service';
import {
  formaPagoFromAdvancePayment,
  paymentMethodFromFormaPago,
} from '../../pos-shifts/utils/advance-payment-method.util';
import { CollectPosSaleDto } from '../../pos-shifts/dto/collect-pos-sale.dto';
import { PayerContact } from '../../pos-shifts/utils/pos-payer-contact.util';
import { PosSalePaymentMethod } from '../../../entities/pos/pos-sale-payment-method.enum';
import { getFiscalInvoiceReadiness } from '../../customers/utils/fiscal-invoice-readiness.util';
import {
  inferIvaPercentage,
  taxableBaseOfDocument,
} from '../../electronic-invoicing/utils/advance-cfdi.util';
import { isWalkInCustomer } from '../../pos-shifts/mappers/pos-sale-collection.mapper';
import { inferReceptorRegimen } from '../../electronic-invoicing/utils/cfdi-regimen-person.util';

const PUBLIC_RFC = 'XAXX010101000';
const PUBLIC_NAME = 'PUBLICO EN GENERAL';

@Injectable()
export class QuotationAdvanceInvoiceService {
  constructor(
    @InjectRepository(Quotation)
    private readonly quotationRepo: Repository<Quotation>,
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepo: Repository<SalesOrder>,
    private readonly advanceCfdi: AdvanceCfdiService,
    private readonly electronicInvoiceService: ElectronicInvoiceService,
    @Inject(forwardRef(() => PosShiftsService))
    private readonly posShiftsService: PosShiftsService,
    private readonly advancePayments: AdvanceShiftPaymentService,
  ) {}

  async collectionPreview(id: string, tenantId: string) {
    const quotation = await this.requireQuotation(id, tenantId);
    const branch =
      quotation.billing_branch ?? quotation.warehouse?.billing_branch ?? null;
    const branchId = quotation.billing_branch_id ?? branch?.id ?? null;
    if (!branchId) {
      throw new BadRequestException('La cotización no tiene sucursal');
    }
    const caja = await this.posShiftsService.resolveBranchCajaShift(
      tenantId,
      branchId,
    );
    const shift = caja.shift && !caja.queued ? caja.shift : null;
    return {
      billing_branch_id: branchId,
      sucursal: branch?.code ?? null,
      open_shift: shift
        ? { id: shift.id, shift_date: shift.shift_date }
        : null,
    };
  }

  async describe(quotation: Quotation) {
    const enabled = Boolean(
      quotation.fiscal_configuration?.advance_invoicing_enabled,
    );
    const advance = await this.advanceCfdi.findVigenteAdvance(
      quotation.tenant_id,
      'quotations',
      quotation.id,
    );
    const summary = await this.advanceCfdi.summarize(
      quotation.tenant_id,
      advance,
    );
    const payment = summary
      ? await this.advancePayments.describeQuotationPayment(
          quotation.tenant_id,
          quotation.id,
        )
      : null;
    const blocks = !!summary && quotation.general_status === 'Creada';
    return {
      enabled,
      summary,
      canStamp:
        enabled &&
        quotation.general_status === 'Creada' &&
        !summary &&
        !!quotation.customer?.fiscal_rfc,
      blocksCancel: blocks,
      blocksEdit: blocks,
      payment,
    };
  }

  async list(id: string, tenantId: string) {
    await this.requireQuotation(id, tenantId);
    return this.electronicInvoiceService.findBySource(
      tenantId,
      'quotations',
      id,
    );
  }

  async collectFromPos(
    id: string,
    tenantId: string,
    userId: string,
    dto: CollectPosSaleDto,
  ) {
    if (dto.payment_method === PosSalePaymentMethod.CREDIT) {
      throw new BadRequestException('El anticipo no se cobra a crédito');
    }
    let quotation = await this.requireQuotation(id, tenantId);
    if (dto.customer_id && Number(dto.customer_id) !== Number(quotation.customer_id)) {
      await this.quotationRepo.update(
        { id: quotation.id, tenant_id: tenantId },
        { customer_id: dto.customer_id },
      );
      quotation = await this.requireQuotation(id, tenantId);
    }
    const requested = Number(quotation.advance_requested_total || 0);
    if (requested <= 0) {
      throw new BadRequestException(
        'Esta cotización no tiene un anticipo por cobrar',
      );
    }
    if (quotation.general_status !== 'Creada') {
      throw new BadRequestException(
        'La cotización ya no está pendiente de anticipo',
      );
    }
    if (!isPosStageInCaja(quotation.pos_stage)) {
      throw new BadRequestException(
        'La cotización está en ventas. Debe enviarse a caja antes de cobrar',
      );
    }
    const readiness = getFiscalInvoiceReadiness(quotation.customer);
    if (!readiness.fiscal_ready_for_invoice) {
      throw new BadRequestException(
        'El cliente no tiene los datos fiscales para facturar el anticipo',
      );
    }
    const existing = await this.advanceCfdi.findVigenteAdvance(
      tenantId,
      'quotations',
      quotation.id,
    );
    if (existing) {
      throw new BadRequestException('Ese anticipo ya fue cobrado y timbrado');
    }
    const payment = await this.posShiftsService.normalizeCollectPayment(
      tenantId,
      dto,
      requested,
    );
    const cashMxn = Number(
      (
        payment.amountCashMxn +
        payment.amountCashUsd * (payment.usdExchangeRate ?? 0)
      ).toFixed(2),
    );
    const checkMxn = Number(
      (
        payment.amountCheckMxn +
        payment.amountCheckUsd * (payment.usdExchangeRate ?? 0)
      ).toFixed(2),
    );
    const formaPago = formaPagoFromAdvancePayment(dto.payment_method, {
      cashMxn,
      transferMxn: payment.amountTransferMxn,
      cardMxn: payment.amountCardMxn,
      checkMxn,
    });
    if (!formaPago) {
      throw new BadRequestException(
        'El anticipo se cobra en efectivo, tarjeta, transferencia, cheque o mixto',
      );
    }
    const taxable = taxableBaseOfDocument(
      Number(quotation.subtotal),
      Number(quotation.discount_total),
      Number(quotation.global_discount_amount),
    );
    const iva = inferIvaPercentage(Number(quotation.iva_total), taxable);
    const base =
      iva > 0 ? Number((requested / (1 + iva / 100)).toFixed(2)) : requested;
    const regimen = inferReceptorRegimen(
      quotation.customer?.fiscal_rfc,
      quotation.customer?.fiscal_person_type,
    );
    await this.stamp(
      id,
      tenantId,
      userId,
      {
        base_amount: base,
        iva_percentage: iva,
        forma_pago: formaPago,
        uso_cfdi: quotation.advance_uso_cfdi || 'G03',
        metodo_pago: quotation.advance_metodo_pago || 'PUE',
        regimen_fiscal_receptor: regimen,
      },
      {
        paymentMethod: dto.payment_method,
        amountCashMxn: cashMxn,
        amountTransferMxn: payment.amountTransferMxn,
        amountCardMxn: payment.amountCardMxn,
        amountCheckMxn: checkMxn,
        payer: payment.payer,
      },
    );
    return {
      folio: quotation.folio,
      customer_name:
        quotation.customer?.fiscal_razon_social ||
        quotation.customer?.name ||
        null,
      change_cash_mxn: payment.changeCashMxn,
      change_cash_usd: payment.changeCashUsd,
      usd_exchange_rate: payment.usdExchangeRate,
    };
  }

  async stamp(
    id: string,
    tenantId: string,
    userId: string,
    dto: StampAdvanceInvoiceDto,
    collected?: {
      paymentMethod: PosSalePaymentMethod;
      amountCashMxn?: number;
      amountTransferMxn?: number;
      amountCardMxn?: number;
      amountCheckMxn?: number;
      payer?: PayerContact;
    },
  ) {
    const quotation = await this.requireQuotation(id, tenantId);
    if (!quotation.fiscal_configuration?.advance_invoicing_enabled) {
      throw new BadRequestException(
        'Esta razón social no tiene activada la factura de anticipo',
      );
    }
    if (quotation.general_status !== 'Creada') {
      throw new BadRequestException(
        'Solo se factura anticipo de una cotización en estado Creada',
      );
    }
    const branch =
      quotation.billing_branch ?? quotation.warehouse?.billing_branch ?? null;
    const branchId = quotation.billing_branch_id ?? branch?.id ?? null;
    if (!branchId) {
      throw new BadRequestException('La cotización no tiene sucursal');
    }
    const formaPago = dto.forma_pago ?? '01';
    const paymentMethod =
      collected?.paymentMethod ?? paymentMethodFromFormaPago(formaPago);
    if (!paymentMethod || paymentMethod === PosSalePaymentMethod.CREDIT) {
      throw new BadRequestException(
        'La forma de pago del anticipo debe ser efectivo (01), cheque (02), transferencia (03), tarjeta (04 o 28) o mixto',
      );
    }
    if (paymentMethod === PosSalePaymentMethod.MIXED && !collected) {
      throw new BadRequestException(
        'La forma de pago del anticipo debe ser efectivo (01), cheque (02), transferencia (03) o tarjeta (04 o 28)',
      );
    }
    const caja = await this.posShiftsService.resolveBranchCajaShift(
      tenantId,
      branchId,
    );
    if (!caja.shift) {
      const sucursal = branch?.code ?? 'la sucursal';
      throw new BadRequestException(
        `No hay corte abierto en ${sucursal}. Abre el corte para registrar el dinero del anticipo.`,
      );
    }
    const parties = this.parties(quotation);
    const saved = await this.advanceCfdi.stampAdvance(
      tenantId,
      userId,
      {
        sourceModule: 'quotations',
        sourceId: quotation.id,
        folio: quotation.folio,
        subtotal: Number(quotation.subtotal),
        discountTotal: Number(quotation.discount_total),
        globalDiscount: Number(quotation.global_discount_amount),
        ivaTotal: Number(quotation.iva_total),
        fiscalConfigurationId: quotation.fiscal_configuration_id,
        series: quotation.fiscal_configuration?.prefix,
        emisor: parties.emisor,
        receptor: parties.receptor,
      },
      { ...dto, forma_pago: formaPago },
    );
    await this.advancePayments.record({
      tenantId,
      userId,
      shiftId: caja.shift.id,
      invoiceId: saved.id,
      amountMxn: Number(saved.total),
      paymentMethod,
      amountCashMxn: collected?.amountCashMxn,
      amountTransferMxn: collected?.amountTransferMxn,
      amountCardMxn: collected?.amountCardMxn,
      amountCheckMxn: collected?.amountCheckMxn,
      payer: collected?.payer,
      documentFolio: quotation.folio,
      quotationId: quotation.id,
    });
    return saved;
  }

  async getPdf(
    id: string,
    invoiceId: string,
    tenantId: string,
    regenerate = false,
    preview = false,
  ) {
    await this.assertOwnedInvoice(id, invoiceId, tenantId);
    return this.electronicInvoiceService.getPdfDownload(
      invoiceId,
      tenantId,
      regenerate,
      preview,
    );
  }

  async getXml(id: string, invoiceId: string, tenantId: string) {
    await this.assertOwnedInvoice(id, invoiceId, tenantId);
    return this.electronicInvoiceService.getXmlDownload(invoiceId, tenantId);
  }

  async cancel(
    id: string,
    invoiceId: string,
    tenantId: string,
    userId: string,
    dto: CancelElectronicInvoiceDto,
  ) {
    await this.requireQuotation(id, tenantId);
    const invoice = await this.electronicInvoiceService.findOne(
      invoiceId,
      tenantId,
    );
    if (invoice.source_module !== 'quotations' || invoice.source_id !== id) {
      throw new NotFoundException('La factura no pertenece a esta cotización');
    }
    await this.advanceCfdi.assertAdvanceCancellable(tenantId, invoice);
    await this.advancePayments.assertVoidable(tenantId, invoiceId);
    const cancelled = await this.electronicInvoiceService.cancel(
      invoiceId,
      tenantId,
      userId,
      dto,
    );
    await this.advancePayments.voidByInvoice(tenantId, userId, invoiceId);
    return cancelled;
  }

  async assertQuotationCancellable(quotation: Quotation): Promise<void> {
    const advance = await this.advanceCfdi.findVigenteAdvance(
      quotation.tenant_id,
      'quotations',
      quotation.id,
    );
    if (advance) {
      const uuid = advance.uuid ? ` (UUID ${advance.uuid})` : '';
      throw new BadRequestException(
        `No se puede cancelar la cotización: tiene una factura de anticipo vigente${uuid}. Cancela la factura primero.`,
      );
    }
  }

  async attachToSalesOrder(
    tenantId: string,
    userId: string,
    quotationId: string,
    salesOrderId: string,
  ) {
    const advance = await this.advanceCfdi.findVigenteAdvance(
      tenantId,
      'quotations',
      quotationId,
    );
    if (!advance) return null;
    await this.salesOrderRepo.update(
      { id: salesOrderId, tenant_id: tenantId },
      { advance_invoice_id: advance.id },
    );
    return this.advancePayments.attachQuotationPaymentToOrder(
      tenantId,
      userId,
      quotationId,
      salesOrderId,
    );
  }

  private async assertOwnedInvoice(
    id: string,
    invoiceId: string,
    tenantId: string,
  ) {
    await this.requireQuotation(id, tenantId);
    const invoice = await this.electronicInvoiceService.findOne(
      invoiceId,
      tenantId,
    );
    if (invoice.source_module !== 'quotations' || invoice.source_id !== id) {
      throw new NotFoundException('La factura no pertenece a esta cotización');
    }
    return invoice;
  }

  private async requireQuotation(id: string, tenantId: string) {
    const quotation = await this.quotationRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['customer', 'billing_branch', 'warehouse', 'warehouse.billing_branch', 'fiscal_configuration'],
    });
    if (!quotation) {
      throw new NotFoundException(`Cotización no encontrada: ${id}`);
    }
    return quotation;
  }

  private parties(quotation: Quotation) {
    const fiscal = quotation.fiscal_configuration;
    const branch =
      quotation.billing_branch ?? quotation.warehouse?.billing_branch ?? null;
    const lugar = fiveDigitPostalCode(branch?.postal_code);
    if (!fiscal?.rfc || !fiscal.razon_social || !fiscal.fiscal_regime) {
      throw new BadRequestException(
        'La razón emisora no tiene RFC, nombre o régimen fiscal',
      );
    }
    if (!lugar) {
      throw new BadRequestException(
        'La sucursal no tiene código postal de expedición',
      );
    }
    const customer = quotation.customer;
    const generic =
      !customer?.fiscal_rfc || isWalkInCustomer(customer) && !customer.fiscal_rfc;
    const rfc = generic ? PUBLIC_RFC : customer.fiscal_rfc;
    if (!rfc) {
      throw new BadRequestException('El cliente debe tener RFC');
    }
    const domicilio = generic ? lugar : fiveDigitPostalCode(customer.fiscal_postal_code);
    if (!domicilio) {
      throw new BadRequestException(
        'El cliente debe tener código postal fiscal de 5 dígitos',
      );
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
          ? PUBLIC_NAME
          : customer.fiscal_razon_social || customer.name || PUBLIC_NAME,
        regimen: inferReceptorRegimen(rfc, customer?.fiscal_person_type),
        postalCode: domicilio,
      },
    };
  }
}
