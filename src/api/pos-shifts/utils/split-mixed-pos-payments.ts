import { randomUUID } from 'crypto';
import { QueryRunner } from 'typeorm';
import { clampDebtMoney, roundDebtMoney } from '../../accounting/utils/customer-debt-ledger.util';
import {
  assignPosTenderCashierNotes,
  buildPosTenderPaymentLines,
  PosTenderPaymentLine,
} from './pos-collection-payment-lines.util';

type MixedPaymentRow = {
  id: string;
  tenant_id: string;
  sales_order_id: string;
  payment_date: string | Date;
  amount: string | number;
  notes: string | null;
  created_by: string;
  created_at: string | Date;
  amount_cash_mxn: string | number;
  amount_cash_usd: string | number;
  usd_exchange_rate: string | number | null;
  amount_transfer_mxn: string | number;
  transfer_reference: string | null;
  amount_card_mxn: string | number;
  card_reference: string | null;
  card_kind: string | null;
  card_payments: unknown;
  amount_check_mxn: string | number;
  amount_check_usd: string | number;
  check_reference: string | null;
};

type LedgerRow = {
  id: string;
  tenant_id: string;
  customer_id: number;
  fiscal_configuration_id: string;
  fiscal_razon_social: string;
  billing_branch_id: string | null;
  billing_branch_name: string | null;
  sales_order_id: string;
  occurred_at: string | Date;
  due_date: string | null;
  source: string | null;
  folio: string;
  customer_name: string;
  customer_rfc: string | null;
  created_by: string | null;
  created_at: string | Date;
  amount_delta: string | number;
  balance_after: string | number;
  order_balance_after: string | number;
};

export type SplitMixedPosPaymentsResult = {
  split: number;
  skipped: number;
};

/**
 * Un cobro mixto de POS quedó como un solo pago. Lo parte en un pago por medio
 * y, si el kardex ya tenía ese abono, reparte el mismo monto sin cambiar el saldo final.
 */
export async function splitMixedPosPayments(
  queryRunner: QueryRunner,
): Promise<SplitMixedPosPaymentsResult> {
  const rows = (await queryRunner.query(`
    SELECT
      payment.id,
      payment.tenant_id,
      payment.sales_order_id,
      payment.payment_date,
      payment.amount,
      payment.notes,
      payment.created_by,
      payment.created_at,
      collection.amount_cash_mxn,
      collection.amount_cash_usd,
      collection.usd_exchange_rate,
      collection.amount_transfer_mxn,
      collection.transfer_reference,
      collection.amount_card_mxn,
      collection.card_reference,
      collection.card_kind,
      collection.card_payments,
      collection.amount_check_mxn,
      collection.amount_check_usd,
      collection.check_reference
    FROM inv_s_sales_order_payments payment
    INNER JOIN pos_sale_collections collection
      ON collection.sales_order_id = payment.sales_order_id
     AND collection.tenant_id = payment.tenant_id
    WHERE payment.source = 'pos_cobranza'
      AND payment.payment_method = 'mixed'
      AND NOT EXISTS (
        SELECT 1
        FROM inv_s_sales_order_payments other
        WHERE other.sales_order_id = payment.sales_order_id
          AND other.tenant_id = payment.tenant_id
          AND other.source = 'pos_cobranza'
          AND other.id <> payment.id
      )
  `)) as MixedPaymentRow[];

  let split = 0;
  let skipped = 0;
  for (const row of rows) {
    const lines = assignPosTenderCashierNotes(
      buildPosTenderPaymentLines(
        {
          amountCashMxn: row.amount_cash_mxn,
          amountCashUsd: row.amount_cash_usd,
          usdExchangeRate: row.usd_exchange_rate,
          amountTransferMxn: row.amount_transfer_mxn,
          transferReference: row.transfer_reference,
          amountCardMxn: row.amount_card_mxn,
          cardReference: row.card_reference,
          cardKind: row.card_kind,
          cardPayments: row.card_payments,
          amountCheckMxn: row.amount_check_mxn,
          amountCheckUsd: row.amount_check_usd,
          checkReference: row.check_reference,
        },
        Number(row.amount),
      ) ?? [],
      row.notes,
    );
    if (lines.length < 2) {
      skipped += 1;
      continue;
    }
    await applySplit(queryRunner, row, lines);
    split += 1;
  }

  return { split, skipped };
}

async function applySplit(
  queryRunner: QueryRunner,
  row: MixedPaymentRow,
  lines: PosTenderPaymentLine[],
): Promise<void> {
  const [first, ...rest] = lines;
  await queryRunner.query(
    `
    UPDATE inv_s_sales_order_payments
    SET payment_method = ?, amount = ?, currency = 'MXN', reference_number = ?, notes = ?
    WHERE id = ? AND tenant_id = ?
    `,
    [
      first.method,
      first.amount,
      first.reference,
      first.notes,
      row.id,
      row.tenant_id,
    ],
  );

  const created: Array<{ id: string; line: PosTenderPaymentLine; index: number }> = [];
  for (let index = 0; index < rest.length; index += 1) {
    const id = randomUUID();
    const line = rest[index];
    await queryRunner.query(
      `
      INSERT INTO inv_s_sales_order_payments (
        id, tenant_id, sales_order_id, payment_date, amount, currency,
        payment_method, reference_number, notes, source, created_by, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, 'MXN', ?, ?, ?, 'pos_cobranza', ?, DATE_ADD(?, INTERVAL ? SECOND)
      )
      `,
      [
        id,
        row.tenant_id,
        row.sales_order_id,
        dateOnly(row.payment_date),
        line.amount,
        line.method,
        line.reference,
        line.notes,
        row.created_by,
        row.created_at,
        index + 1,
      ],
    );
    created.push({ id, line, index: index + 1 });
  }

  const ledgerTable = await queryRunner.hasTable('acc_customer_debt_ledger');
  if (!ledgerTable) return;

  const movements = (await queryRunner.query(
    `
    SELECT *
    FROM acc_customer_debt_ledger
    WHERE tenant_id = ? AND source_key = ?
    LIMIT 2
    `,
    [row.tenant_id, `payment:${row.id}`],
  )) as LedgerRow[];
  if (movements.length !== 1) return;

  const original = movements[0];
  await queryRunner.query(
    `
    UPDATE acc_customer_debt_ledger
    SET amount_delta = ?, payment_method = ?, reference_number = ?
    WHERE id = ? AND tenant_id = ?
    `,
    [-roundDebtMoney(first.amount), first.method, first.reference, original.id, row.tenant_id],
  );

  for (const item of created) {
    await queryRunner.query(
      `
      INSERT INTO acc_customer_debt_ledger (
        id, tenant_id, source_key, customer_id, fiscal_configuration_id,
        fiscal_razon_social, billing_branch_id, billing_branch_name, sales_order_id,
        sales_order_payment_id, movement_type, amount_delta, balance_after,
        order_balance_after, occurred_at, due_date, payment_method, reference_number,
        source, folio, customer_name, customer_rfc, created_by, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'payment', ?, 0, 0,
        DATE_ADD(?, INTERVAL ? SECOND), ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(?, INTERVAL ? SECOND)
      )
      `,
      [
        randomUUID(),
        original.tenant_id,
        `payment:${item.id}`,
        original.customer_id,
        original.fiscal_configuration_id,
        original.fiscal_razon_social,
        original.billing_branch_id,
        original.billing_branch_name,
        original.sales_order_id,
        item.id,
        -roundDebtMoney(item.line.amount),
        original.occurred_at,
        item.index,
        original.due_date,
        item.line.method,
        item.line.reference,
        original.source,
        original.folio,
        original.customer_name,
        original.customer_rfc,
        original.created_by,
        original.created_at,
        item.index,
      ],
    );
  }

  await rebuildBalancesFrom(queryRunner, original);
}

async function rebuildBalancesFrom(queryRunner: QueryRunner, origin: LedgerRow): Promise<void> {
  const priorRows = (await queryRunner.query(
    `
    SELECT balance_after
    FROM acc_customer_debt_ledger
    WHERE tenant_id = ?
      AND customer_id = ?
      AND fiscal_configuration_id = ?
      AND (
        occurred_at < ?
        OR (occurred_at = ? AND created_at < ?)
        OR (occurred_at = ? AND created_at = ? AND id < ?)
      )
    ORDER BY occurred_at DESC, created_at DESC, id DESC
    LIMIT 1
    `,
    [
      origin.tenant_id,
      origin.customer_id,
      origin.fiscal_configuration_id,
      origin.occurred_at,
      origin.occurred_at,
      origin.created_at,
      origin.occurred_at,
      origin.created_at,
      origin.id,
    ],
  )) as Array<{ balance_after: string | number }>;
  let customerBalance = roundDebtMoney(Number(priorRows[0]?.balance_after || 0));

  const forward = (await queryRunner.query(
    `
    SELECT id, sales_order_id, amount_delta, occurred_at, created_at
    FROM acc_customer_debt_ledger
    WHERE tenant_id = ?
      AND customer_id = ?
      AND fiscal_configuration_id = ?
      AND (
        occurred_at > ?
        OR (occurred_at = ? AND created_at > ?)
        OR (occurred_at = ? AND created_at = ? AND id >= ?)
      )
    ORDER BY occurred_at ASC, created_at ASC, id ASC
    `,
    [
      origin.tenant_id,
      origin.customer_id,
      origin.fiscal_configuration_id,
      origin.occurred_at,
      origin.occurred_at,
      origin.created_at,
      origin.occurred_at,
      origin.created_at,
      origin.id,
    ],
  )) as Array<{
    id: string;
    sales_order_id: string;
    amount_delta: string | number;
  }>;

  const orderIds = [...new Set(forward.map((row) => row.sales_order_id))];
  const orderBalances = new Map<string, number>();
  for (const salesOrderId of orderIds) {
    const previous = (await queryRunner.query(
      `
      SELECT order_balance_after
      FROM acc_customer_debt_ledger
      WHERE tenant_id = ?
        AND sales_order_id = ?
        AND (
          occurred_at < ?
          OR (occurred_at = ? AND created_at < ?)
          OR (occurred_at = ? AND created_at = ? AND id < ?)
        )
      ORDER BY occurred_at DESC, created_at DESC, id DESC
      LIMIT 1
      `,
      [
        origin.tenant_id,
        salesOrderId,
        origin.occurred_at,
        origin.occurred_at,
        origin.created_at,
        origin.occurred_at,
        origin.created_at,
        origin.id,
      ],
    )) as Array<{ order_balance_after: string | number }>;
    orderBalances.set(salesOrderId, roundDebtMoney(Number(previous[0]?.order_balance_after || 0)));
  }

  for (const row of forward) {
    customerBalance = clampDebtMoney(customerBalance + Number(row.amount_delta));
    const nextOrder = clampDebtMoney(
      (orderBalances.get(row.sales_order_id) ?? 0) + Number(row.amount_delta),
    );
    orderBalances.set(row.sales_order_id, nextOrder);
    await queryRunner.query(
      `
      UPDATE acc_customer_debt_ledger
      SET balance_after = ?, order_balance_after = ?
      WHERE id = ?
      `,
      [customerBalance, nextOrder, row.id],
    );
  }
}

function dateOnly(value: string | Date): string {
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}
