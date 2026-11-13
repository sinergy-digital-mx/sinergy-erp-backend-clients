import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { randomUUID } from 'crypto';
import { CustomerDebtLedger } from '../../../entities/accounting/customer-debt-ledger.entity';
import { CustomerDebtLedgerMovementType } from '../../../entities/accounting/customer-debt-ledger-movement-type.enum';
import {
  advanceCoveredAmount,
  billingBranchLabel,
  chargeReversalSourceKey,
  chargeSourceKey,
  clampDebtMoney,
  creditNoteReversalSourceKey,
  creditNoteSourceKey,
  customerDebtDisplayName,
  debtDueDate,
  isWalkInDebtCustomer,
  paymentReversalSourceKey,
  paymentSourceKey,
  roundDebtMoney,
} from '../utils/customer-debt-ledger.util';

type DebtOrderSnapshot = {
  id: string;
  tenant_id: string;
  customer_id: number;
  fiscal_configuration_id: string;
  billing_branch_id: string | null;
  folio: string;
  total: number | string;
  created_at: Date | string;
  created_by: string | null;
  general_status: string | null;
  name: string | null;
  lastname: string | null;
  company_name: string | null;
  fiscal_razon_social: string | null;
  fiscal_rfc: string | null;
  company_razon_social: string;
  branch_city: string | null;
  branch_code: string | null;
  credit_days: number | null;
};

type DebtPaymentSnapshot = {
  id: string;
  sales_order_id: string;
  tenant_id: string;
  amount: number | string;
  payment_method: string | null;
  reference_number: string | null;
  source: string | null;
  created_by: string | null;
  created_at: Date | string | null;
};

type DebtMovementInput = {
  sourceKey: string;
  movementType: CustomerDebtLedgerMovementType;
  amountDelta: number;
  occurredAt: Date;
  dueDate?: string | null;
  paymentMethod?: string | null;
  referenceNumber?: string | null;
  source?: string | null;
  salesOrderPaymentId?: string | null;
  userId?: string | null;
};

@Injectable()
export class CustomerDebtLedgerService {
  constructor(private readonly dataSource: DataSource) {}

  async captureCharge(input: {
    tenantId: string;
    salesOrderId: string;
    userId: string | null;
    amount?: number;
    occurredAt?: Date;
  }): Promise<void> {
    const snapshot = await this.loadOrder(input.tenantId, input.salesOrderId);
    if (!snapshot || !this.canCapture(snapshot)) return;
    const raw =
      input.amount != null
        ? roundDebtMoney(input.amount)
        : await this.openAmount(input.tenantId, snapshot);
    const covered = await this.advanceCovered(input.tenantId, snapshot.id);
    const creditCap = roundDebtMoney(Math.max(Number(snapshot.total || 0) - covered, 0));
    const amount = roundDebtMoney(Math.min(Math.max(raw, 0), creditCap));
    if (amount <= 0) return;
    const occurredAt = input.occurredAt ?? new Date();
    await this.append(snapshot, {
      sourceKey: chargeSourceKey(snapshot.id),
      movementType: CustomerDebtLedgerMovementType.CHARGE,
      amountDelta: amount,
      occurredAt,
      dueDate: debtDueDate(occurredAt, snapshot.credit_days),
      source: 'system',
      userId: input.userId,
    });
  }

  async capturePayment(input: {
    tenantId: string;
    salesOrderId: string;
    paymentId: string;
    userId: string | null;
    source: string;
  }): Promise<void> {
    const payment = await this.loadPayment(input.tenantId, input.paymentId);
    if (!payment || payment.payment_method === 'credit') return;
    if (payment.source === 'advance' || input.source === 'advance') return;

    const hasCharge = await this.hasSourceKey(input.tenantId, chargeSourceKey(input.salesOrderId));
    if (!hasCharge && input.source === 'pos_cobranza') return;
    if (!hasCharge) {
      const snapshot = await this.loadOrder(input.tenantId, input.salesOrderId);
      if (!snapshot || !this.canCapture(snapshot)) return;
      const paid = await this.sumPayments(input.tenantId, input.salesOrderId);
      const beforeThis = roundDebtMoney(
        Number(snapshot.total || 0) - paid + Number(payment.amount || 0),
      );
      await this.captureCharge({
        tenantId: input.tenantId,
        salesOrderId: input.salesOrderId,
        userId: input.userId,
        amount: beforeThis,
        occurredAt: new Date(),
      });
    }

    await this.append(await this.loadOrder(input.tenantId, input.salesOrderId), {
      sourceKey: paymentSourceKey(payment.id),
      movementType: CustomerDebtLedgerMovementType.PAYMENT,
      amountDelta: -roundDebtMoney(Number(payment.amount || 0)),
      occurredAt: this.parseDate(payment.created_at) ?? new Date(),
      paymentMethod: payment.payment_method,
      referenceNumber: payment.reference_number,
      source: input.source,
      salesOrderPaymentId: payment.id,
      userId: input.userId ?? payment.created_by,
    });
  }

  async capturePaymentReversal(input: {
    tenantId: string;
    paymentId: string;
    userId: string | null;
  }): Promise<void> {
    const original = await this.dataSource.getRepository(CustomerDebtLedger).findOne({
      where: {
        tenant_id: input.tenantId,
        source_key: paymentSourceKey(input.paymentId),
      },
    });
    if (!original) return;
    const snapshot = await this.loadOrder(input.tenantId, original.sales_order_id);
    if (!snapshot) return;
    await this.append(snapshot, {
      sourceKey: paymentReversalSourceKey(input.paymentId),
      movementType: CustomerDebtLedgerMovementType.PAYMENT_REVERSAL,
      amountDelta: roundDebtMoney(Math.abs(Number(original.amount_delta || 0))),
      occurredAt: new Date(),
      paymentMethod: original.payment_method,
      referenceNumber: original.reference_number,
      source: original.source,
      salesOrderPaymentId: input.paymentId,
      userId: input.userId,
    });
  }

  async captureChargeReversal(input: {
    tenantId: string;
    salesOrderId: string;
    userId: string | null;
  }): Promise<void> {
    const hasCharge = await this.hasSourceKey(input.tenantId, chargeSourceKey(input.salesOrderId));
    if (!hasCharge) return;
    const snapshot = await this.loadOrder(input.tenantId, input.salesOrderId);
    if (!snapshot) return;

    await this.dataSource.transaction(async (manager) => {
      await this.lockCustomer(manager, snapshot.tenant_id, snapshot.customer_id);
      if (await this.sourceExists(manager, snapshot.tenant_id, chargeReversalSourceKey(snapshot.id))) {
        return;
      }
      const orderBalance = await this.latestOrderBalance(manager, snapshot.tenant_id, snapshot.id);
      if (orderBalance <= 0) return;
      await this.insertMovement(manager, snapshot, {
        sourceKey: chargeReversalSourceKey(snapshot.id),
        movementType: CustomerDebtLedgerMovementType.CHARGE_REVERSAL,
        amountDelta: -orderBalance,
        occurredAt: new Date(),
        source: 'system',
        userId: input.userId,
      });
    });
  }

  async captureCreditNote(input: {
    tenantId: string;
    salesOrderId: string;
    invoiceId: string;
    amount: number;
    userId: string | null;
  }): Promise<void> {
    const amount = roundDebtMoney(input.amount);
    if (amount <= 0) return;
    const snapshot = await this.loadOrder(input.tenantId, input.salesOrderId);
    if (!snapshot || isWalkInDebtCustomer(snapshot)) return;
    const hasCharge = await this.hasSourceKey(input.tenantId, chargeSourceKey(snapshot.id));
    if (!hasCharge) return;

    await this.dataSource.transaction(async (manager) => {
      await this.lockCustomer(manager, snapshot.tenant_id, snapshot.customer_id);
      const sourceKey = creditNoteSourceKey(input.invoiceId);
      if (await this.sourceExists(manager, snapshot.tenant_id, sourceKey)) return;
      const orderBalance = await this.latestOrderBalance(manager, snapshot.tenant_id, snapshot.id);
      const reducible = roundDebtMoney(Math.min(amount, orderBalance));
      if (reducible <= 0) return;
      await this.insertMovement(manager, snapshot, {
        sourceKey,
        movementType: CustomerDebtLedgerMovementType.CREDIT_NOTE,
        amountDelta: -reducible,
        occurredAt: new Date(),
        source: 'credit_note',
        referenceNumber: input.invoiceId,
        userId: input.userId,
      });
    });
  }

  async reverseCreditNote(input: {
    tenantId: string;
    salesOrderId: string;
    invoiceId: string;
    userId: string | null;
  }): Promise<void> {
    const originalKey = creditNoteSourceKey(input.invoiceId);
    const hasOriginal = await this.hasSourceKey(input.tenantId, originalKey);
    if (!hasOriginal) return;
    const snapshot = await this.loadOrder(input.tenantId, input.salesOrderId);
    if (!snapshot) return;

    await this.dataSource.transaction(async (manager) => {
      await this.lockCustomer(manager, snapshot.tenant_id, snapshot.customer_id);
      const reversalKey = creditNoteReversalSourceKey(input.invoiceId);
      if (await this.sourceExists(manager, snapshot.tenant_id, reversalKey)) return;
      const rows = await manager.query(
        `
        SELECT amount_delta
        FROM acc_customer_debt_ledger
        WHERE tenant_id = ? AND source_key = ?
        LIMIT 1
        `,
        [snapshot.tenant_id, originalKey],
      );
      const posted = roundDebtMoney(Math.abs(Number(rows?.[0]?.amount_delta || 0)));
      if (posted <= 0) return;
      await this.insertMovement(manager, snapshot, {
        sourceKey: reversalKey,
        movementType: CustomerDebtLedgerMovementType.CREDIT_NOTE_REVERSAL,
        amountDelta: posted,
        occurredAt: new Date(),
        source: 'credit_note',
        referenceNumber: input.invoiceId,
        userId: input.userId,
      });
    });
  }

  private canCapture(snapshot: DebtOrderSnapshot): boolean {
    if (isWalkInDebtCustomer(snapshot)) return false;
    if (snapshot.general_status === 'Cancelada') return false;
    return Number(snapshot.total || 0) > 0;
  }

  private async append(
    snapshot: DebtOrderSnapshot | null,
    input: DebtMovementInput,
  ): Promise<void> {
    if (!snapshot || input.amountDelta === 0) return;
    try {
      await this.dataSource.transaction(async (manager) => {
        await this.lockCustomer(manager, snapshot.tenant_id, snapshot.customer_id);
        if (await this.sourceExists(manager, snapshot.tenant_id, input.sourceKey)) return;
        await this.insertMovement(manager, snapshot, input);
      });
    } catch (error) {
      if (this.isDuplicate(error)) return;
      throw error;
    }
  }

  private async insertMovement(
    manager: EntityManager,
    snapshot: DebtOrderSnapshot,
    input: DebtMovementInput,
  ): Promise<void> {
    const prevCustomer = await this.latestCustomerBalance(
      manager,
      snapshot.tenant_id,
      snapshot.customer_id,
      snapshot.fiscal_configuration_id,
    );
    const prevOrder = await this.latestOrderBalance(manager, snapshot.tenant_id, snapshot.id);
    const balanceAfter = clampDebtMoney(prevCustomer + input.amountDelta);
    const orderBalanceAfter = clampDebtMoney(prevOrder + input.amountDelta);
    const dueDate =
      input.dueDate ??
      (await this.latestDueDate(manager, snapshot.tenant_id, snapshot.id));

    await manager.getRepository(CustomerDebtLedger).insert({
      id: randomUUID(),
      tenant_id: snapshot.tenant_id,
      source_key: input.sourceKey,
      customer_id: snapshot.customer_id,
      fiscal_configuration_id: snapshot.fiscal_configuration_id,
      fiscal_razon_social: snapshot.company_razon_social.slice(0, 255),
      billing_branch_id: snapshot.billing_branch_id,
      billing_branch_name: billingBranchLabel(snapshot.branch_city, snapshot.branch_code),
      sales_order_id: snapshot.id,
      sales_order_payment_id: input.salesOrderPaymentId ?? null,
      movement_type: input.movementType,
      amount_delta: roundDebtMoney(input.amountDelta),
      balance_after: balanceAfter,
      order_balance_after: orderBalanceAfter,
      occurred_at: input.occurredAt,
      due_date: dueDate,
      payment_method: input.paymentMethod ?? null,
      reference_number: input.referenceNumber ?? null,
      source: input.source ?? null,
      folio: snapshot.folio.slice(0, 20),
      customer_name: customerDebtDisplayName(snapshot).slice(0, 255),
      customer_rfc: snapshot.fiscal_rfc?.trim().slice(0, 20) || null,
      created_by: input.userId ?? null,
    });
  }

  private async loadOrder(
    tenantId: string,
    salesOrderId: string,
  ): Promise<DebtOrderSnapshot | null> {
    const rows = await this.dataSource.query(
      `
      SELECT
        so.id,
        so.tenant_id,
        so.customer_id,
        so.fiscal_configuration_id,
        so.billing_branch_id,
        so.folio,
        so.total,
        so.created_at,
        so.created_by,
        so.general_status,
        c.name,
        c.lastname,
        c.company_name,
        c.fiscal_razon_social,
        c.fiscal_rfc,
        fc.razon_social AS company_razon_social,
        bb.city AS branch_city,
        bb.code AS branch_code,
        cc.credit_days
      FROM inv_s_sales_orders so
      INNER JOIN customers c ON c.id = so.customer_id
      INNER JOIN fiscal_configurations fc ON fc.id = so.fiscal_configuration_id
      LEFT JOIN billing_branches bb ON bb.id = so.billing_branch_id
      LEFT JOIN customer_credits cc
        ON cc.tenant_id = so.tenant_id
       AND cc.customer_id = so.customer_id
       AND cc.fiscal_configuration_id = so.fiscal_configuration_id
      WHERE so.id = ? AND so.tenant_id = ?
      LIMIT 1
      `,
      [salesOrderId, tenantId],
    );
    return rows?.[0] ?? null;
  }

  private async loadPayment(
    tenantId: string,
    paymentId: string,
  ): Promise<DebtPaymentSnapshot | null> {
    const rows = await this.dataSource.query(
      `
      SELECT id, sales_order_id, tenant_id, amount, payment_method,
             reference_number, source, created_by, created_at
      FROM inv_s_sales_order_payments
      WHERE id = ? AND tenant_id = ?
      LIMIT 1
      `,
      [paymentId, tenantId],
    );
    return rows?.[0] ?? null;
  }

  private async advanceCovered(tenantId: string, salesOrderId: string): Promise<number> {
    const rows = await this.dataSource.query(
      `
      SELECT
        COALESCE((
          SELECT MAX(q.advance_requested_total)
          FROM inv_s_quotations q
          WHERE q.tenant_id = ? AND q.converted_to_sales_order_id = ?
        ), 0) AS advance_requested,
        COALESCE((
          SELECT SUM(p.amount)
          FROM inv_s_sales_order_payments p
          WHERE p.tenant_id = ? AND p.sales_order_id = ? AND p.source = 'advance'
        ), 0) AS advance_paid,
        COALESCE((
          SELECT SUM(ei.total)
          FROM electronic_invoices ei
          WHERE ei.tenant_id = ?
            AND ei.source_id = ?
            AND ei.invoice_role = 'advance'
            AND (ei.sat_status IS NULL OR ei.sat_status <> 'Cancelado')
            AND (
              ei.sat_status = 'Vigente'
              OR ei.stamp_status IN ('stamped', 'cancel_pending', 'cancel_error')
            )
        ), 0) AS advance_invoiced
      `,
      [tenantId, salesOrderId, tenantId, salesOrderId, tenantId, salesOrderId],
    );
    return advanceCoveredAmount(rows?.[0] ?? {});
  }

  private async openAmount(tenantId: string, snapshot: DebtOrderSnapshot): Promise<number> {
    const paid = await this.sumPayments(tenantId, snapshot.id);
    return roundDebtMoney(Math.max(0, Number(snapshot.total || 0) - paid));
  }

  private async sumPayments(tenantId: string, salesOrderId: string): Promise<number> {
    const rows = await this.dataSource.query(
      `
      SELECT COALESCE(SUM(amount), 0) AS paid
      FROM inv_s_sales_order_payments
      WHERE tenant_id = ? AND sales_order_id = ?
      `,
      [tenantId, salesOrderId],
    );
    return Number(rows?.[0]?.paid || 0);
  }

  private async hasSourceKey(tenantId: string, sourceKey: string): Promise<boolean> {
    const rows = await this.dataSource.query(
      `
      SELECT id FROM acc_customer_debt_ledger
      WHERE tenant_id = ? AND source_key = ?
      LIMIT 1
      `,
      [tenantId, sourceKey],
    );
    return rows.length > 0;
  }

  private async lockCustomer(
    manager: EntityManager,
    tenantId: string,
    customerId: number,
  ): Promise<void> {
    await manager.query(
      `SELECT id FROM customers WHERE id = ? AND tenant_id = ? FOR UPDATE`,
      [customerId, tenantId],
    );
  }

  private async sourceExists(
    manager: EntityManager,
    tenantId: string,
    sourceKey: string,
  ): Promise<boolean> {
    const rows = await manager.query(
      `
      SELECT id FROM acc_customer_debt_ledger
      WHERE tenant_id = ? AND source_key = ?
      LIMIT 1
      `,
      [tenantId, sourceKey],
    );
    return rows.length > 0;
  }

  private async latestCustomerBalance(
    manager: EntityManager,
    tenantId: string,
    customerId: number,
    fiscalConfigurationId: string,
  ): Promise<number> {
    const rows = await manager.query(
      `
      SELECT balance_after
      FROM acc_customer_debt_ledger
      WHERE tenant_id = ?
        AND customer_id = ?
        AND fiscal_configuration_id = ?
      ORDER BY occurred_at DESC, created_at DESC, id DESC
      LIMIT 1
      `,
      [tenantId, customerId, fiscalConfigurationId],
    );
    return Number(rows?.[0]?.balance_after || 0);
  }

  private async latestOrderBalance(
    manager: EntityManager,
    tenantId: string,
    salesOrderId: string,
  ): Promise<number> {
    const rows = await manager.query(
      `
      SELECT order_balance_after
      FROM acc_customer_debt_ledger
      WHERE tenant_id = ? AND sales_order_id = ?
      ORDER BY occurred_at DESC, created_at DESC, id DESC
      LIMIT 1
      `,
      [tenantId, salesOrderId],
    );
    return Number(rows?.[0]?.order_balance_after || 0);
  }

  private async latestDueDate(
    manager: EntityManager,
    tenantId: string,
    salesOrderId: string,
  ): Promise<string | null> {
    const rows = await manager.query(
      `
      SELECT due_date
      FROM acc_customer_debt_ledger
      WHERE tenant_id = ?
        AND sales_order_id = ?
        AND due_date IS NOT NULL
      ORDER BY occurred_at DESC, created_at DESC, id DESC
      LIMIT 1
      `,
      [tenantId, salesOrderId],
    );
    const value = rows?.[0]?.due_date;
    if (!value) return null;
    return String(value).slice(0, 10);
  }

  private parseDate(value: Date | string | null | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private isDuplicate(error: unknown): boolean {
    const code = (error as { code?: string })?.code;
    const errno = (error as { errno?: number })?.errno;
    return code === 'ER_DUP_ENTRY' || errno === 1062;
  }
}
