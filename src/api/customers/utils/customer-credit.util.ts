import { normalizeCreditCurrency } from './credit-currency.util';

export interface CustomerCreditSnapshot {
  credit_enabled: boolean;
  allow_credit_exceed: boolean;
  credit_days: number | null;
  credit_amount: number;
  credit_currency: 'MXN' | 'USD';
  credit_used: number;
  credit_available: number;
  credit_usage_percent: number;
}

export interface CustomerCreditFiscalSnapshot extends CustomerCreditSnapshot {
  fiscal_configuration_id: string;
  razon_social: string;
  rfc: string;
  fiscal_status: string;
}

export function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (value === true || value === 1 || value === '1' || value === 'true') {
    return true;
  }
  if (value === false || value === 0 || value === '0' || value === 'false') {
    return false;
  }
  return undefined;
}

export function parseOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function extractCreditPatchFromBody(body: Record<string, unknown>): {
  credit_enabled: boolean;
  allow_credit_exceed?: boolean;
  credit_days?: number | null;
  credit_amount?: number | null;
} | null {
  const nested =
    body.credit && typeof body.credit === 'object'
      ? (body.credit as Record<string, unknown>)
      : {};
  const enabled = parseOptionalBoolean(
    body.credit_enabled ?? nested.credit_enabled ?? nested.enabled,
  );
  const days = parseOptionalNumber(
    body.credit_days ?? nested.credit_days ?? nested.days,
  );
  const amount = parseOptionalNumber(
    body.credit_amount ?? nested.credit_amount ?? nested.amount,
  );
  if (enabled === undefined && days === undefined && amount === undefined) {
    return null;
  }
  const allowExceed = parseOptionalBoolean(
    body.allow_credit_exceed ?? nested.allow_credit_exceed,
  );
  return {
    credit_enabled: enabled ?? Number(amount ?? 0) > 0,
    allow_credit_exceed: allowExceed ?? false,
    credit_days: days ?? null,
    credit_amount: amount ?? null,
  };
}

export function creditChargeUsesExceedWaiver(
  amount: number,
  creditAvailable: number,
  allowCreditExceed: boolean,
): boolean {
  return allowCreditExceed && amount - creditAvailable > 0.01;
}

export function buildCreditSnapshot(params: {
  creditEnabled: boolean;
  allowCreditExceed?: boolean;
  creditDays?: number | null;
  creditAmount?: number | string | null;
  creditCurrency?: unknown;
  creditUsed?: number | string | null;
}): CustomerCreditSnapshot {
  const creditAmount = Math.max(0, Number(params.creditAmount ?? 0));
  const creditUsed = Math.max(0, Number(params.creditUsed ?? 0));
  const creditAvailable = Math.max(0, Number((creditAmount - creditUsed).toFixed(2)));
  const creditUsagePercent =
    creditAmount > 0 ? Number(((creditUsed / creditAmount) * 100).toFixed(2)) : 0;

  return {
    credit_enabled: Boolean(params.creditEnabled),
    allow_credit_exceed: Boolean(params.allowCreditExceed),
    credit_days: params.creditDays ?? null,
    credit_currency: normalizeCreditCurrency(params.creditCurrency),
    credit_amount: Number(creditAmount.toFixed(2)),
    credit_used: Number(creditUsed.toFixed(2)),
    credit_available: creditAvailable,
    credit_usage_percent: creditUsagePercent,
  };
}
