import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AdvanceShiftPayment } from '../../../entities/pos/advance-shift-payment.entity';
import { PosDailyShift } from '../../../entities/pos/pos-daily-shift.entity';
import { PosDailyShiftStatus } from '../../../entities/pos/pos-daily-shift-status.enum';
import { PosSalePaymentMethod } from '../../../entities/pos/pos-sale-payment-method.enum';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { Quotation } from '../../../entities/quotations/quotation.entity';
import {
  advanceDocumentPending,
  roundAdvanceMoney,
} from '../../customers/utils/advance-credit.util';
import { SalesOrderPayment } from '../../../entities/sales-orders/sales-order-payment.entity';
import {
  advancePaymentMethodLabel,
  advanceShiftAmountSplits,
} from '../utils/advance-payment-method.util';
import {
  formatPayerContactSummary,
  PayerContact,
} from '../utils/pos-payer-contact.util';

export interface RecordAdvanceShiftPaymentInput {
  tenantId: string;
  userId: string;
  shiftId: string;
  invoiceId: string;
  amountMxn: number;
  paymentMethod: PosSalePaymentMethod;
  documentFolio: string;
  quotationId?: string | null;
  salesOrderId?: string | null;
  amountCashMxn?: number;
  amountTransferMxn?: number;
  amountCardMxn?: number;
  amountCheckMxn?: number;
  payer?: PayerContact | null;
}

@Injectable()
export class AdvanceShiftPaymentService {
  constructor(
    @InjectRepository(AdvanceShiftPayment)
    private readonly paymentRepo: Repository<AdvanceShiftPayment>,
    @InjectRepository(PosDailyShift)
    private readonly shiftRepo: Repository<PosDailyShift>,
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderPayment)
    private readonly orderPaymentRepo: Repository<SalesOrderPayment>,
  ) {}

  async record(input: RecordAdvanceShiftPaymentInput): Promise<AdvanceShiftPayment> {
    const amount = roundMoney(input.amountMxn);
    if (amount <= 0) {
      throw new BadRequestException('El anticipo no tiene un importe por cobrar');
    }

    const existing = await this.paymentRepo.findOne({
      where: { electronic_invoice_id: input.invoiceId },
    });
    if (existing && !existing.voided_at) {
      if (input.salesOrderId && !existing.sales_order_payment_id) {
        await this.applyToSalesOrder(existing, input.salesOrderId, input.userId);
      }
      return existing;
    }

    const splits = advanceShiftAmountSplits(input.paymentMethod, amount, {
      cashMxn: input.amountCashMxn,
      transferMxn: input.amountTransferMxn,
      cardMxn: input.amountCardMxn,
      checkMxn: input.amountCheckMxn,
    });

    const row = this.paymentRepo.create({
      id: existing?.id ?? uuidv4(),
      tenant_id: input.tenantId,
      quotation_id: input.quotationId ?? null,
      sales_order_id: input.salesOrderId ?? null,
      electronic_invoice_id: input.invoiceId,
      pos_daily_shift_id: input.shiftId,
      payment_method: input.paymentMethod,
      amount_mxn: amount,
      amount_cash_mxn: splits.cashMxn,
      amount_transfer_mxn: splits.transferMxn,
      amount_card_mxn: splits.cardMxn,
      amount_check_mxn: splits.checkMxn,
      transfer_payer_name: input.payer?.transferPayerName ?? null,
      transfer_payer_business_name: input.payer?.transferPayerBusinessName ?? null,
      card_payer_name: input.payer?.cardPayerName ?? null,
      card_payer_phone: input.payer?.cardPayerPhone ?? null,
      check_payer_name: input.payer?.checkPayerName ?? null,
      check_payer_phone: input.payer?.checkPayerPhone ?? null,
      document_folio: input.documentFolio,
      collected_by_user_id: input.userId,
      sales_order_payment_id: null,
      voided_at: null,
    });
    const saved = await this.paymentRepo.save(row);

    if (input.salesOrderId) {
      await this.applyToSalesOrder(saved, input.salesOrderId, input.userId);
    }

    return saved;
  }

  async attachQuotationPaymentToOrder(
    tenantId: string,
    userId: string,
    quotationId: string,
    salesOrderId: string,
  ): Promise<{ payment_status: string } | null> {
    const row = await this.paymentRepo.findOne({
      where: {
        tenant_id: tenantId,
        quotation_id: quotationId,
        voided_at: IsNull(),
      },
      order: { created_at: 'DESC' },
    });
    if (!row) return null;
    if (row.sales_order_payment_id) {
      const order = await this.salesOrderRepo.findOne({
        where: { id: salesOrderId, tenant_id: tenantId },
      });
      return order ? { payment_status: order.payment_status } : null;
    }
    row.sales_order_id = salesOrderId;
    await this.paymentRepo.save(row);
    const status = await this.applyToSalesOrder(row, salesOrderId, userId);
    return { payment_status: status };
  }

  async describeQuotationPayment(
    tenantId: string,
    quotationId: string,
  ): Promise<{
    amount_mxn: number;
    payment_method: PosSalePaymentMethod;
    payment_method_label: string;
    shift_date: string;
  } | null> {
    const row = await this.paymentRepo.findOne({
      where: { tenant_id: tenantId, quotation_id: quotationId, voided_at: IsNull() },
      relations: ['pos_daily_shift'],
      order: { created_at: 'DESC' },
    });
    if (!row) return null;
    return {
      amount_mxn: Number(row.amount_mxn),
      payment_method: row.payment_method,
      payment_method_label: advancePaymentMethodLabel(row.payment_method),
      shift_date: row.pos_daily_shift?.shift_date ?? null,
    };
  }

  async assertVoidable(tenantId: string, invoiceId: string): Promise<void> {
    const row = await this.activeByInvoice(tenantId, invoiceId);
    if (!row) return;
    const shift = await this.shiftRepo.findOne({ where: { id: row.pos_daily_shift_id } });
    if (!shift || shift.status !== PosDailyShiftStatus.OPEN) {
      throw new BadRequestException(
        'El anticipo ya quedó en un corte cerrado. No se puede cancelar el cobro.',
      );
    }
  }

  async voidByInvoice(tenantId: string, userId: string, invoiceId: string): Promise<void> {
    const row = await this.activeByInvoice(tenantId, invoiceId);
    if (!row) return;
    await this.assertVoidable(tenantId, invoiceId);
    if (row.sales_order_payment_id && row.sales_order_id) {
      await this.removeOrderPayment(
        tenantId,
        userId,
        row.sales_order_id,
        row.sales_order_payment_id,
      );
    }
    row.voided_at = new Date();
    row.sales_order_payment_id = null;
    await this.paymentRepo.save(row);
  }

  async sumActiveByShift(dailyShiftId: string): Promise<{
    cash_mxn: number;
    card_mxn: number;
    transfer_mxn: number;
    check_mxn: number;
  }> {
    const rows = await this.paymentRepo.find({
      where: { pos_daily_shift_id: dailyShiftId, voided_at: IsNull() },
    });
    const totals = { cash_mxn: 0, card_mxn: 0, transfer_mxn: 0, check_mxn: 0 };
    for (const row of rows) {
      const splits = advanceShiftAmountSplits(row.payment_method, Number(row.amount_mxn || 0), {
        cashMxn: Number(row.amount_cash_mxn || 0),
        transferMxn: Number(row.amount_transfer_mxn || 0),
        cardMxn: Number(row.amount_card_mxn || 0),
        checkMxn: Number(row.amount_check_mxn || 0),
      });
      totals.cash_mxn += splits.cashMxn;
      totals.card_mxn += splits.cardMxn;
      totals.transfer_mxn += splits.transferMxn;
      totals.check_mxn += splits.checkMxn;
    }
    return {
      cash_mxn: roundMoney(totals.cash_mxn),
      card_mxn: roundMoney(totals.card_mxn),
      transfer_mxn: roundMoney(totals.transfer_mxn),
      check_mxn: roundMoney(totals.check_mxn),
    };
  }

  async listActive(dailyShiftId: string): Promise<
    {
      id: string;
      folio: string;
      payment_method: PosSalePaymentMethod;
      payment_method_label: string;
      amount_mxn: number;
      document_total: number;
      amount_pending: number;
      payer_summary: string | null;
    }[]
  > {
    const rows = await this.paymentRepo.find({
      where: { pos_daily_shift_id: dailyShiftId, voided_at: IsNull() },
      order: { created_at: 'ASC' },
    });
    const quotationIds = [
      ...new Set(rows.map((row) => row.quotation_id).filter((id): id is string => Boolean(id))),
    ];
    const orderIds = [
      ...new Set(rows.map((row) => row.sales_order_id).filter((id): id is string => Boolean(id))),
    ];
    const [quotations, orders, quotePayments, orderPayments] = await Promise.all([
      quotationIds.length
        ? this.paymentRepo.manager.getRepository(Quotation).find({ where: { id: In(quotationIds) } })
        : Promise.resolve([] as Quotation[]),
      orderIds.length
        ? this.salesOrderRepo.find({ where: { id: In(orderIds) } })
        : Promise.resolve([] as SalesOrder[]),
      quotationIds.length
        ? this.paymentRepo.find({ where: { quotation_id: In(quotationIds), voided_at: IsNull() } })
        : Promise.resolve([] as AdvanceShiftPayment[]),
      orderIds.length
        ? this.orderPaymentRepo.find({ where: { sales_order_id: In(orderIds) } })
        : Promise.resolve([] as SalesOrderPayment[]),
    ]);
    const quoteTotal = new Map(quotations.map((row) => [row.id, Number(row.total || 0)]));
    const orderTotal = new Map(orders.map((row) => [row.id, Number(row.total || 0)]));
    const quotePaid = new Map<string, number>();
    for (const payment of quotePayments) {
      if (!payment.quotation_id) continue;
      quotePaid.set(
        payment.quotation_id,
        roundAdvanceMoney((quotePaid.get(payment.quotation_id) ?? 0) + Number(payment.amount_mxn || 0)),
      );
    }
    const orderPaid = new Map<string, number>();
    for (const payment of orderPayments) {
      orderPaid.set(
        payment.sales_order_id,
        roundAdvanceMoney((orderPaid.get(payment.sales_order_id) ?? 0) + Number(payment.amount || 0)),
      );
    }

    return rows.map((row) => {
      const documentTotal = row.sales_order_id
        ? orderTotal.get(row.sales_order_id) ?? quoteTotal.get(row.quotation_id ?? '') ?? 0
        : quoteTotal.get(row.quotation_id ?? '') ?? 0;
      const paid = row.sales_order_id
        ? orderPaid.get(row.sales_order_id) ?? quotePaid.get(row.quotation_id ?? '') ?? Number(row.amount_mxn || 0)
        : quotePaid.get(row.quotation_id ?? '') ?? Number(row.amount_mxn || 0);
      return {
        id: row.id,
        folio: row.document_folio,
        payment_method: row.payment_method,
        payment_method_label: advancePaymentMethodLabel(row.payment_method),
        amount_mxn: Number(row.amount_mxn),
        document_total: roundAdvanceMoney(documentTotal),
        amount_pending: advanceDocumentPending(documentTotal, paid),
        payer_summary: formatPayerContactSummary({
          transferPayerName: row.transfer_payer_name,
          transferPayerBusinessName: row.transfer_payer_business_name,
          cardPayerName: row.card_payer_name,
          cardPayerPhone: row.card_payer_phone,
          checkPayerName: row.check_payer_name,
          checkPayerPhone: row.check_payer_phone,
        }),
      };
    });
  }

  private async activeByInvoice(tenantId: string, invoiceId: string) {
    return this.paymentRepo.findOne({
      where: { tenant_id: tenantId, electronic_invoice_id: invoiceId, voided_at: IsNull() },
    });
  }

  private async applyToSalesOrder(
    row: AdvanceShiftPayment,
    salesOrderId: string,
    userId: string,
  ): Promise<string> {
    const order = await this.salesOrderRepo.findOne({
      where: { id: salesOrderId, tenant_id: row.tenant_id },
    });
    if (!order || order.general_status === 'Cancelada') {
      return order?.payment_status ?? 'Pendiente';
    }

    const existing = await this.orderPaymentRepo.find({
      where: { sales_order_id: salesOrderId, tenant_id: row.tenant_id },
    });
    let paid = existing.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const pending = roundMoney(Math.max(Number(order.total || 0) - paid, 0));
    const amount = roundMoney(Math.min(Number(row.amount_mxn || 0), pending));

    if (amount > 0 && !row.sales_order_payment_id) {
      const payment = this.orderPaymentRepo.create({
        id: uuidv4(),
        tenant_id: row.tenant_id,
        sales_order_id: salesOrderId,
        payment_date: new Date(),
        amount,
        currency: 'MXN',
        payment_method: row.payment_method,
        reference_number: null,
        notes: `Anticipo ${row.document_folio}`,
        source: 'advance',
        created_by: userId,
      });
      await this.orderPaymentRepo.save(payment);
      row.sales_order_id = salesOrderId;
      row.sales_order_payment_id = payment.id;
      await this.paymentRepo.save(row);
      paid += amount;
    }

    const stillPending = roundMoney(Math.max(Number(order.total || 0) - paid, 0));
    order.payment_status = stillPending <= 0 ? 'Pagado' : 'Pendiente';
    order.updated_by = userId;
    await this.salesOrderRepo.save(order);
    return order.payment_status;
  }

  private async removeOrderPayment(
    tenantId: string,
    userId: string,
    salesOrderId: string,
    paymentId: string,
  ): Promise<void> {
    const payment = await this.orderPaymentRepo.findOne({
      where: { id: paymentId, sales_order_id: salesOrderId, tenant_id: tenantId },
    });
    if (payment?.source === 'advance') {
      await this.orderPaymentRepo.remove(payment);
    }
    const order = await this.salesOrderRepo.findOne({
      where: { id: salesOrderId, tenant_id: tenantId },
    });
    if (!order) return;
    const remaining = await this.orderPaymentRepo.find({
      where: { sales_order_id: salesOrderId, tenant_id: tenantId },
    });
    const paid = remaining.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const pending = roundMoney(Math.max(Number(order.total || 0) - paid, 0));
    order.payment_status = pending <= 0 ? 'Pagado' : 'Pendiente';
    order.updated_by = userId;
    await this.salesOrderRepo.save(order);
  }
}

function roundMoney(value: number): number {
  return Number(Number(value || 0).toFixed(2));
}
