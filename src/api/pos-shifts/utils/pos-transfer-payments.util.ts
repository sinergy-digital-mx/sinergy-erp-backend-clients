export type PosTransferPayment = {
  amount_mxn: number;
  reference: string;
};

const MAX_TRANSFER_PAYMENTS = 8;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function toAmount(value: unknown): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? roundMoney(Math.max(0, amount)) : 0;
}

/** Referencia comparable: sin espacios de más y sin distinguir mayúsculas. */
export function transferReferenceKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toUpperCase();
}

export function cleanTransferReference(value: unknown): string {
  if (value == null) return '';
  return String(value).trim().replace(/\s+/g, ' ').slice(0, 120);
}

export function normalizeTransferPayments(input: {
  transfer_payments?: Array<{
    amount_mxn?: number;
    reference?: string | null;
  }> | null;
  amount_transfer_mxn?: number;
  transfer_reference?: string | null;
}): PosTransferPayment[] {
  const raw = input.transfer_payments;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .map((item) => ({
        amount_mxn: toAmount(item?.amount_mxn),
        reference: cleanTransferReference(item?.reference),
      }))
      .filter((item) => item.amount_mxn > 0)
      .slice(0, MAX_TRANSFER_PAYMENTS);
  }
  const fallback = toAmount(input.amount_transfer_mxn);
  if (fallback > 0) {
    return [{
      amount_mxn: fallback,
      reference: cleanTransferReference(input.transfer_reference),
    }];
  }
  return [];
}

export function sumTransferPayments(payments: PosTransferPayment[]): number {
  return roundMoney(payments.reduce((sum, item) => sum + item.amount_mxn, 0));
}

export function firstTransferReference(payments: PosTransferPayment[]): string | null {
  return payments.find((item) => item.reference)?.reference ?? null;
}

/** La segunda vez que aparece la misma referencia, con el texto capturado. */
export function duplicateTransferReference(payments: PosTransferPayment[]): string | null {
  const seen = new Set<string>();
  for (const payment of payments) {
    const key = transferReferenceKey(payment.reference);
    if (!key) continue;
    if (seen.has(key)) return payment.reference;
    seen.add(key);
  }
  return null;
}

export function parseStoredTransferPayments(value: unknown): PosTransferPayment[] {
  if (!value) return [];
  try {
    const raw = typeof value === 'string' ? JSON.parse(value) : value;
    return normalizeTransferPayments({ transfer_payments: Array.isArray(raw) ? raw : [] });
  } catch {
    return [];
  }
}

export function transferPaymentsForResponse(
  stored: unknown,
  amountTransferMxn: number,
  transferReference: string | null,
): PosTransferPayment[] {
  const fromJson = parseStoredTransferPayments(stored);
  if (fromJson.length > 0) {
    return fromJson;
  }
  return normalizeTransferPayments({
    amount_transfer_mxn: amountTransferMxn,
    transfer_reference: transferReference,
  });
}
