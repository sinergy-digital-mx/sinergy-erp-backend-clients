import { CustomerDebtLedgerMovementType } from '../../../entities/accounting/customer-debt-ledger-movement-type.enum';
import { SALES_ORDER_PAYMENT_METHOD_LABELS } from '../../sales-orders/utils/sales-order-payment-display.util';

const WALK_IN_FISCAL_NAME = 'VENTA DE MOSTRADOR';
const WALK_IN_DISPLAY_NAME = 'Público en General';

export type DebtAgingBucket = 'current' | 'd1_30' | 'd31_60' | 'd61_90' | 'd91_plus';

export type DebtLedgerBalanceDraft = {
  tenantId: string;
  customerId: number;
  fiscalConfigurationId: string;
  salesOrderId: string;
  sourceKey: string;
  movementType: CustomerDebtLedgerMovementType;
  amountDelta: number;
  occurredAt: Date;
};

export type DebtLedgerBalancedDraft<T> = T & {
  balanceAfter: number;
  orderBalanceAfter: number;
};

const MOVEMENT_RANK: Record<CustomerDebtLedgerMovementType, number> = {
  [CustomerDebtLedgerMovementType.CHARGE]: 0,
  [CustomerDebtLedgerMovementType.PAYMENT]: 1,
  [CustomerDebtLedgerMovementType.CHARGE_REVERSAL]: 2,
  [CustomerDebtLedgerMovementType.PAYMENT_REVERSAL]: 3,
  [CustomerDebtLedgerMovementType.CREDIT_NOTE]: 4,
  [CustomerDebtLedgerMovementType.CREDIT_NOTE_REVERSAL]: 5,
};

export function roundDebtMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function clampDebtMoney(value: number): number {
  return roundDebtMoney(Math.max(0, value));
}

export function isWalkInDebtCustomer(customer: {
  fiscal_razon_social?: string | null;
  name?: string | null;
}): boolean {
  return (
    customer.fiscal_razon_social === WALK_IN_FISCAL_NAME ||
    customer.name === WALK_IN_DISPLAY_NAME
  );
}

export function customerDebtDisplayName(customer: {
  fiscal_razon_social?: string | null;
  company_name?: string | null;
  name?: string | null;
  lastname?: string | null;
}): string {
  const fiscal = customer.fiscal_razon_social?.trim();
  if (fiscal) return fiscal;
  const company = customer.company_name?.trim();
  if (company) return company;
  const person = [customer.name, customer.lastname].filter(Boolean).join(' ').trim();
  return person || 'Sin nombre';
}

export function billingBranchLabel(city?: string | null, code?: string | null): string | null {
  const cityLabel = city?.trim();
  const codeLabel = code?.trim();
  if (cityLabel && codeLabel) return `${cityLabel} (${codeLabel})`;
  return cityLabel || codeLabel || null;
}

export function debtDueDate(occurredAt: Date, creditDays: number | null | undefined): string {
  const days = Math.max(0, Number(creditDays ?? 0));
  const due = new Date(occurredAt.getFullYear(), occurredAt.getMonth(), occurredAt.getDate());
  due.setDate(due.getDate() + days);
  const month = String(due.getMonth() + 1).padStart(2, '0');
  const day = String(due.getDate()).padStart(2, '0');
  return `${due.getFullYear()}-${month}-${day}`;
}

export function calendarDaysPastDue(dueDate: string, asOf: Date): number {
  const [year, month, day] = dueDate.slice(0, 10).split('-').map(Number);
  const dueUtc = Date.UTC(year, (month || 1) - 1, day || 1);
  const asOfUtc = Date.UTC(asOf.getFullYear(), asOf.getMonth(), asOf.getDate());
  return Math.round((asOfUtc - dueUtc) / 86_400_000);
}

export function debtAgingBucket(dueDate: string | null, asOf: Date): DebtAgingBucket {
  if (!dueDate) return 'current';
  const days = calendarDaysPastDue(dueDate, asOf);
  if (days <= 0) return 'current';
  if (days <= 30) return 'd1_30';
  if (days <= 60) return 'd31_60';
  if (days <= 90) return 'd61_90';
  return 'd91_plus';
}

export function debtPaymentMethodLabel(method: string | null | undefined): string | null {
  if (!method) return null;
  const known = SALES_ORDER_PAYMENT_METHOD_LABELS[method];
  return known ?? method;
}

export function debtMovementLabel(type: CustomerDebtLedgerMovementType | 'opening'): string {
  switch (type) {
    case CustomerDebtLedgerMovementType.CHARGE:
      return 'Cargo';
    case CustomerDebtLedgerMovementType.PAYMENT:
      return 'Abono';
    case CustomerDebtLedgerMovementType.CHARGE_REVERSAL:
      return 'Cancelación';
    case CustomerDebtLedgerMovementType.PAYMENT_REVERSAL:
      return 'Reversa de abono';
    case CustomerDebtLedgerMovementType.CREDIT_NOTE:
      return 'Nota de crédito';
    case CustomerDebtLedgerMovementType.CREDIT_NOTE_REVERSAL:
      return 'Reversa de nota de crédito';
    default:
      return 'Saldo inicial';
  }
}

export function debtMovementDescription(input: {
  movementType: CustomerDebtLedgerMovementType | 'opening';
  folio?: string | null;
  dueDate?: string | null;
  paymentMethod?: string | null;
  referenceNumber?: string | null;
}): string {
  const folio = input.folio?.trim() || 'la orden';
  if (input.movementType === 'opening') {
    return `Saldo de ${folio} al inicio del periodo.`;
  }
  if (input.movementType === CustomerDebtLedgerMovementType.CHARGE) {
    const due = input.dueDate ? ` Vence ${formatDebtDay(input.dueDate)}.` : '';
    return `Cargo de ${folio}.${due}`;
  }
  if (input.movementType === CustomerDebtLedgerMovementType.PAYMENT) {
    const method = debtPaymentMethodLabel(input.paymentMethod);
    const ref = input.referenceNumber?.trim();
    const extra = [method, ref ? `ref. ${ref}` : null].filter(Boolean).join(', ');
    return extra ? `Abono a ${folio} (${extra}).` : `Abono a ${folio}.`;
  }
  if (input.movementType === CustomerDebtLedgerMovementType.CHARGE_REVERSAL) {
    return `Se canceló el saldo pendiente de ${folio}.`;
  }
  if (input.movementType === CustomerDebtLedgerMovementType.CREDIT_NOTE) {
    return `Nota de crédito sobre ${folio}.`;
  }
  if (input.movementType === CustomerDebtLedgerMovementType.CREDIT_NOTE_REVERSAL) {
    return `Se canceló la nota de crédito de ${folio}.`;
  }
  return `Se revirtió un abono de ${folio}.`;
}

export function formatDebtDay(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-');
  if (!year || !month || !day) return value;
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const label = months[Number(month) - 1];
  if (!label) return `${day}/${month}/${year}`;
  return `${Number(day)} ${label} ${year}`;
}

export function formatDebtDateTime(value: Date | string | null | undefined): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MEXICO_TIME_ZONE,
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(date);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const month = months[Number(pick('month')) - 1] ?? pick('month');
  const minute = pick('minute').padStart(2, '0');
  const dayPeriod = pick('dayPeriod').toLowerCase().replace(/\./g, '').replace('am', 'a.m.').replace('pm', 'p.m.');
  return `${Number(pick('day'))} ${month} ${pick('year')}, ${Number(pick('hour'))}:${minute} ${dayPeriod}`;
}

const MEXICO_TIME_ZONE = 'America/Tijuana';

export function applyDebtLedgerBalances<T extends DebtLedgerBalanceDraft>(
  drafts: T[],
): Array<DebtLedgerBalancedDraft<T>> {
  const groups = new Map<string, T[]>();
  for (const draft of drafts) {
    const key = `${draft.tenantId}|${draft.customerId}|${draft.fiscalConfigurationId}`;
    const list = groups.get(key) ?? [];
    list.push(draft);
    groups.set(key, list);
  }

  const balanced: Array<DebtLedgerBalancedDraft<T>> = [];
  for (const list of groups.values()) {
    list.sort((a, b) => {
      const time = a.occurredAt.getTime() - b.occurredAt.getTime();
      if (time !== 0) return time;
      const rank = MOVEMENT_RANK[a.movementType] - MOVEMENT_RANK[b.movementType];
      if (rank !== 0) return rank;
      return a.sourceKey.localeCompare(b.sourceKey);
    });

    let customerBalance = 0;
    const orderBalances = new Map<string, number>();
    for (const draft of list) {
      const prevOrder = orderBalances.get(draft.salesOrderId) ?? 0;
      customerBalance = clampDebtMoney(customerBalance + Number(draft.amountDelta));
      const orderBalance = clampDebtMoney(prevOrder + Number(draft.amountDelta));
      orderBalances.set(draft.salesOrderId, orderBalance);
      balanced.push({
        ...draft,
        balanceAfter: customerBalance,
        orderBalanceAfter: orderBalance,
      });
    }
  }
  return balanced;
}

export function chargeSourceKey(salesOrderId: string): string {
  return `charge:${salesOrderId}`;
}

export function paymentSourceKey(paymentId: string): string {
  return `payment:${paymentId}`;
}

export function chargeReversalSourceKey(salesOrderId: string): string {
  return `charge_reversal:${salesOrderId}`;
}

export function paymentReversalSourceKey(paymentId: string): string {
  return `payment_reversal:${paymentId}`;
}

export function creditNoteSourceKey(invoiceId: string): string {
  return `credit_note:${invoiceId}`;
}

export function creditNoteReversalSourceKey(invoiceId: string): string {
  return `credit_note_reversal:${invoiceId}`;
}

export type DebtAdvanceCoverage = {
  advance_requested?: number | string | null;
  advance_paid?: number | string | null;
  advance_invoiced?: number | string | null;
};

export function advanceCoveredAmount(input: DebtAdvanceCoverage): number {
  const paid = roundDebtMoney(Number(input.advance_paid || 0));
  const requested = roundDebtMoney(Number(input.advance_requested || 0));
  const invoiced = roundDebtMoney(Number(input.advance_invoiced || 0));
  const asked = requested > 0.009 ? requested : paid > 0.009 ? paid : invoiced;
  return roundDebtMoney(Math.max(asked, paid));
}

export function isAdvanceDebtMovement(
  source: string | null | undefined,
  paymentSource: string | null | undefined,
): boolean {
  return isAdvanceSource(source) || isAdvanceSource(paymentSource);
}

function isAdvanceSource(value: string | null | undefined): boolean {
  return String(value ?? '').trim().toLowerCase() === 'advance';
}

export type DebtAdvanceMovement = DebtAdvanceCoverage & {
  sales_order_id: string;
  movement_type: CustomerDebtLedgerMovementType | string;
  amount_delta: number | string;
  order_balance_after?: number | string | null;
  source?: string | null;
  payment_source?: string | null;
  order_total?: number | string | null;
};

export function stripAdvanceFromDebtMovements<T extends DebtAdvanceMovement>(
  rows: T[],
): Array<T & { amount_delta: number; order_balance_after: number }> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const list = groups.get(row.sales_order_id) ?? [];
    list.push(row);
    groups.set(row.sales_order_id, list);
  }
  const result: Array<T & { amount_delta: number; order_balance_after: number }> = [];
  for (const list of groups.values()) {
    result.push(...stripAdvanceFromOrder(list));
  }
  return result;
}

function stripAdvanceFromOrder<T extends DebtAdvanceMovement>(
  rows: T[],
): Array<T & { amount_delta: number; order_balance_after: number }> {
  const sample = rows[0];
  const dropped = droppedAdvanceAmount(rows);
  const covered = roundDebtMoney(Math.max(advanceCoveredAmount(sample ?? {}), dropped));
  const totalKnown = sample?.order_total != null && sample.order_total !== '';
  const chargeLimit = totalKnown
    ? roundDebtMoney(Math.max(roundDebtMoney(Number(sample?.order_total || 0)) - covered, 0))
    : null;

  const kept: Array<T & { amount_delta: number; order_balance_after: number }> = [];
  let balance = 0;
  for (const row of rows) {
    if (isAdvanceDebtMovement(row.source, row.payment_source)) continue;
    let delta = roundDebtMoney(Number(row.amount_delta || 0));
    if (row.movement_type === CustomerDebtLedgerMovementType.CHARGE) {
      const next =
        chargeLimit == null
          ? roundDebtMoney(Math.max(delta - covered, 0))
          : roundDebtMoney(Math.min(Math.max(delta, 0), chargeLimit));
      if (next <= 0.009) continue;
      delta = next;
    } else if (row.movement_type === CustomerDebtLedgerMovementType.CHARGE_REVERSAL) {
      if (balance <= 0.009) continue;
      delta = roundDebtMoney(-balance);
    }
    balance = clampDebtMoney(balance + delta);
    kept.push({ ...row, amount_delta: delta, order_balance_after: balance });
  }
  return kept;
}

function droppedAdvanceAmount(rows: DebtAdvanceMovement[]): number {
  let net = 0;
  for (const row of rows) {
    if (!isAdvanceDebtMovement(row.source, row.payment_source)) continue;
    const amount = Math.abs(roundDebtMoney(Number(row.amount_delta || 0)));
    if (row.movement_type === CustomerDebtLedgerMovementType.PAYMENT) net += amount;
    if (row.movement_type === CustomerDebtLedgerMovementType.PAYMENT_REVERSAL) net -= amount;
  }
  return roundDebtMoney(Math.max(net, 0));
}
