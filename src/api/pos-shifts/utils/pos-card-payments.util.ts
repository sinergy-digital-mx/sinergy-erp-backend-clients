export type PosCardKind = 'debit' | 'credit';

export type PosCardPayment = {
  amount_mxn: number;
  reference: string | null;
  card_kind: PosCardKind | null;
};

const MONEY_EPS = 0.01;
const MAX_CARD_PAYMENTS = 8;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function toAmount(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? roundMoney(n) : 0;
}

function toReference(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text.slice(0, 120) : null;
}

export function toCardKind(value: unknown): PosCardKind | null {
  const text = String(value ?? '').trim().toLowerCase();
  return text === 'debit' || text === 'credit' ? text : null;
}

export function normalizeCardPayments(input: {
  card_payments?: Array<{
    amount_mxn?: number;
    reference?: string | null;
    card_kind?: string | null;
  }> | null;
  amount_card_mxn?: number;
  card_reference?: string | null;
  card_kind?: string | null;
}): PosCardPayment[] {
  const fallbackKind = toCardKind(input.card_kind);
  const raw = input.card_payments;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .map((item) => ({
        amount_mxn: toAmount(item?.amount_mxn),
        reference: toReference(item?.reference),
        card_kind: toCardKind(item?.card_kind) ?? fallbackKind,
      }))
      .filter((item) => item.amount_mxn > 0)
      .slice(0, MAX_CARD_PAYMENTS);
  }
  const fallback = toAmount(input.amount_card_mxn);
  if (fallback > 0) {
    return [{
      amount_mxn: fallback,
      reference: toReference(input.card_reference),
      card_kind: fallbackKind,
    }];
  }
  return [];
}

/** Un solo tipo si todas las tarjetas coinciden. Mixto de débito y crédito queda null. */
export function sharedCardKind(payments: PosCardPayment[]): PosCardKind | null {
  if (!payments.length) return null;
  const first = payments[0].card_kind;
  if (!first) return null;
  return payments.every((item) => item.card_kind === first) ? first : null;
}

export function cardTicketLabel(
  kind: PosCardKind | null | undefined,
  index: number,
  multiple: boolean,
): string {
  const base = multiple ? `Tarjeta ${index + 1}` : 'Tarjeta';
  if (kind === 'debit') return `${base} debito`;
  if (kind === 'credit') return `${base} credito`;
  return base;
}

export function sumCardPayments(payments: PosCardPayment[]): number {
  return roundMoney(payments.reduce((sum, item) => sum + item.amount_mxn, 0));
}

export function firstCardReference(payments: PosCardPayment[]): string | null {
  return payments.find((item) => item.reference)?.reference ?? null;
}

export function mixedPaymentPartCount(input: {
  cashTotal: number;
  amountTransferMxn: number;
  amountCheckMxn: number;
  amountCheckUsd?: number;
  cardPayments: PosCardPayment[];
}): number {
  const types = [
    input.cashTotal > 0,
    input.amountTransferMxn > 0,
    input.amountCheckMxn > 0 || (input.amountCheckUsd ?? 0) > 0,
  ].filter(Boolean).length;
  return types + input.cardPayments.filter((item) => item.amount_mxn > 0).length;
}

export function cardPaymentsMatchDeclaredTotal(
  payments: PosCardPayment[],
  declaredAmount: number | undefined,
): boolean {
  if (declaredAmount == null || !Number.isFinite(declaredAmount) || payments.length === 0) {
    return true;
  }
  return Math.abs(sumCardPayments(payments) - roundMoney(declaredAmount)) <= MONEY_EPS;
}

export function parseStoredCardPayments(value: unknown): PosCardPayment[] {
  if (!value) return [];
  try {
    const raw = typeof value === 'string' ? JSON.parse(value) : value;
    return normalizeCardPayments({ card_payments: Array.isArray(raw) ? raw : [] });
  } catch {
    return [];
  }
}

export function cardPaymentsForResponse(
  stored: unknown,
  amountCardMxn: number,
  cardReference: string | null,
  cardKind?: string | null,
): PosCardPayment[] {
  const fromJson = parseStoredCardPayments(stored);
  if (fromJson.length > 0) {
    return fromJson;
  }
  return normalizeCardPayments({
    amount_card_mxn: amountCardMxn,
    card_reference: cardReference,
    card_kind: cardKind,
  });
}
