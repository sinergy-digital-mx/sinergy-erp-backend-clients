import {
  isOpenPaymentStatus,
  roundPaymentMoney,
  startOfLocalDay,
} from './contract-payment-settlement.util';

export const DEFAULT_LATE_INTEREST_RATE_PERCENT = 10;
export const DEFAULT_LATE_INTEREST_GRACE_DAYS = 6;

export interface LateInterestConfig {
  ratePercent: number;
  graceDays: number;
}

export interface LateInterestPaymentInput {
  amount: number;
  status: string;
  due_date?: Date | string | null;
  late_interest_amount?: number | string | null;
  late_interest_waived?: boolean | null;
}

export interface LateInterestResolution {
  late_interest_amount: number;
  late_interest_suggested: number;
  late_interest_waived: boolean;
  late_interest_eligible: boolean;
  late_interest_manual: boolean;
  late_interest_days_overdue: number;
  late_interest_rate_percent: number;
  late_interest_grace_days: number;
}

export function normalizeInterestRatePercent(
  raw: number | string | null | undefined,
): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return 0;
  const percent = value <= 1 ? value * 100 : value;
  return Math.round(percent * 100) / 100;
}

export function normalizeGraceDays(raw: number | string | null | undefined): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

export function resolveLateInterestConfig(contract: {
  interest_rate?: number | string | null;
  payment_due_day?: number | string | null;
}): LateInterestConfig {
  return {
    ratePercent: normalizeInterestRatePercent(contract.interest_rate),
    graceDays: normalizeGraceDays(contract.payment_due_day),
  };
}

export function countDaysPastDue(
  dueDate: Date | string | null | undefined,
  today: Date = new Date(),
): number {
  if (!dueDate) return 0;
  const due = startOfLocalDay(dueDate);
  const current = startOfLocalDay(today);
  const diffMs = current.getTime() - due.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / 86400000);
}

export function isLateInterestEligible(
  status: string,
  daysPastDue: number,
  config: LateInterestConfig,
): boolean {
  if (!isOpenPaymentStatus(status)) return false;
  if (config.ratePercent <= 0) return false;
  return daysPastDue > 0 && daysPastDue >= config.graceDays;
}

export function computeSuggestedLateInterest(
  amount: number,
  config: LateInterestConfig,
  eligible: boolean,
): number {
  if (!eligible || config.ratePercent <= 0) return 0;
  return roundPaymentMoney((Number(amount) || 0) * (config.ratePercent / 100));
}

export function resolveLateInterest(
  payment: LateInterestPaymentInput,
  config: LateInterestConfig,
  today: Date = new Date(),
): LateInterestResolution {
  const daysPastDue = countDaysPastDue(payment.due_date, today);
  const eligible = isLateInterestEligible(payment.status, daysPastDue, config);
  const suggested = computeSuggestedLateInterest(
    Number(payment.amount) || 0,
    config,
    eligible,
  );
  const waived = !!payment.late_interest_waived;
  const rawOverride = payment.late_interest_amount;
  const hasOverride =
    rawOverride !== null && rawOverride !== undefined && rawOverride !== '';
  const override = hasOverride ? roundPaymentMoney(Number(rawOverride) || 0) : null;
  const manual = !waived && override != null;
  return {
    late_interest_amount: waived ? 0 : (manual ? override : suggested),
    late_interest_suggested: suggested,
    late_interest_waived: waived,
    late_interest_eligible: eligible,
    late_interest_manual: manual,
    late_interest_days_overdue: daysPastDue,
    late_interest_rate_percent: config.ratePercent,
    late_interest_grace_days: config.graceDays,
  };
}
