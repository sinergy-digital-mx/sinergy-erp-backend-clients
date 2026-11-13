import { computeDownPaymentRemaining } from '../contract-financial.util';

export type OpenContractPaymentStatus = 'pendiente' | 'parcial';
export type SettledContractPaymentStatus = OpenContractPaymentStatus | 'pagado';

export function roundPaymentMoney(value: number): number {
  return Math.round(Number(value || 0) * 100) / 100;
}

export function isOpenPaymentStatus(
  status: string | null | undefined,
): status is OpenContractPaymentStatus {
  return status === 'pendiente' || status === 'parcial';
}

export function settlePaymentAmounts(
  amount: number,
  amountPaid: number,
): {
  status: SettledContractPaymentStatus;
  amount: number;
  amount_paid: number;
  amount_pending: number;
} {
  const total = Math.max(0, roundPaymentMoney(amount));
  const paid = Math.max(0, roundPaymentMoney(amountPaid));
  const cappedPaid = Math.min(paid, total);
  const pending = roundPaymentMoney(Math.max(0, total - cappedPaid));

  if (pending <= 0 && cappedPaid > 0) {
    return {
      status: 'pagado',
      amount: total,
      amount_paid: total,
      amount_pending: 0,
    };
  }

  if (cappedPaid > 0) {
    return {
      status: 'parcial',
      amount: total,
      amount_paid: cappedPaid,
      amount_pending: pending,
    };
  }

  return {
    status: 'pendiente',
    amount: total,
    amount_paid: 0,
    amount_pending: total,
  };
}

export function startOfLocalDay(value: Date | string): Date {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  const date = value instanceof Date ? value : new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function resolvePaymentOverdueFlag(
  status: string,
  dueDate: Date | string | null | undefined,
  today: Date = new Date(),
): boolean {
  if (!isOpenPaymentStatus(status) || !dueDate) {
    return false;
  }
  return startOfLocalDay(dueDate).getTime() < startOfLocalDay(today).getTime();
}

export function applyPaymentSettlement<
  T extends {
    amount: number;
    amount_paid: number;
    amount_pending: number;
    status: string;
    is_overdue: boolean;
    due_date?: Date | string | null;
  },
>(payment: T, today: Date = new Date()): T {
  if (payment.status === 'cancelado') {
    payment.is_overdue = false;
    return payment;
  }
  const settled = settlePaymentAmounts(payment.amount, payment.amount_paid);
  payment.amount = settled.amount;
  payment.amount_paid = settled.amount_paid;
  payment.amount_pending = settled.amount_pending;
  payment.status = settled.status;
  payment.is_overdue = resolvePaymentOverdueFlag(
    settled.status,
    payment.due_date,
    today,
  );
  return payment;
}

export function paymentSettlementChanged(
  before: {
    status: string;
    amount_paid: number;
    amount_pending: number;
    is_overdue: boolean;
  },
  after: {
    status: string;
    amount_paid: number;
    amount_pending: number;
    is_overdue: boolean;
  },
): boolean {
  return (
    before.status !== after.status ||
    roundPaymentMoney(before.amount_paid) !==
      roundPaymentMoney(after.amount_paid) ||
    roundPaymentMoney(before.amount_pending) !==
      roundPaymentMoney(after.amount_pending) ||
    Boolean(before.is_overdue) !== Boolean(after.is_overdue)
  );
}

export function isActiveOverduePayment(payment: {
  status: string;
  is_overdue?: boolean;
}): boolean {
  return Boolean(payment.is_overdue) && isOpenPaymentStatus(payment.status);
}

export function countActiveOverduePayments(
  payments: Array<{ status: string; is_overdue?: boolean }>,
): number {
  return payments.filter(isActiveOverduePayment).length;
}

export function sumActiveOverdueAmount(
  payments: Array<{
    status: string;
    is_overdue?: boolean;
    amount_pending?: number | string | null;
    amount?: number | string | null;
  }>,
): number {
  return roundPaymentMoney(
    payments.reduce((sum, payment) => {
      if (!isActiveOverduePayment(payment)) {
        return sum;
      }
      return sum + Number(payment.amount_pending ?? payment.amount ?? 0);
    }, 0),
  );
}

export function isDownPaymentTargetMet(
  target: number | null | undefined,
  applied: number,
): boolean {
  const safeTarget = Number(target);
  if (!Number.isFinite(safeTarget) || safeTarget <= 0) {
    return false;
  }
  return computeDownPaymentRemaining(safeTarget, applied) <= 0;
}
