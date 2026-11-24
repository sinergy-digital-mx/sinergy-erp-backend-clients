import { PosSalePaymentMethod } from '../../../entities/pos/pos-sale-payment-method.enum';
import { roundPosMoney } from './cash-drawer';
import { usdCentToleranceMxn } from './pos-cash-payment.util';
import {
  normalizeCardPayments,
  parseStoredCardPayments,
  PosCardPayment,
} from './pos-card-payments.util';

export type PosTenderPaymentLine = {
  method:
    | PosSalePaymentMethod.CASH
    | PosSalePaymentMethod.CARD
    | PosSalePaymentMethod.TRANSFER
    | PosSalePaymentMethod.CHECK;
  amount: number;
  reference: string | null;
  notes: string | null;
};

export type PosCollectionTenderInput = {
  amountCashMxn?: number | string | null;
  amountCashUsd?: number | string | null;
  usdExchangeRate?: number | string | null;
  amountTransferMxn?: number | string | null;
  transferReference?: string | null;
  cardPayments?: unknown;
  amountCardMxn?: number | string | null;
  cardReference?: string | null;
  cardKind?: string | null;
  amountCheckMxn?: number | string | null;
  amountCheckUsd?: number | string | null;
  checkReference?: string | null;
};

function readAmount(value: unknown): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? roundPosMoney(Math.max(0, amount)) : 0;
}

function readText(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text.slice(0, 120) : null;
}

function formatAmount(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatRate(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function cardKindNote(kind: PosCardPayment['card_kind']): string | null {
  if (kind === 'debit') return 'Débito';
  if (kind === 'credit') return 'Crédito';
  return null;
}

function readCards(input: PosCollectionTenderInput): PosCardPayment[] {
  const stored = parseStoredCardPayments(input.cardPayments);
  if (stored.length > 0) return stored;
  return normalizeCardPayments({
    amount_card_mxn: readAmount(input.amountCardMxn),
    card_reference: input.cardReference,
    card_kind: input.cardKind,
  });
}

/**
 * Parte un cobro POS en un pago por medio. Los dólares se guardan en pesos
 * para que la suma cuadre con el total. Null si no se puede cuadrar.
 */
export function buildPosTenderPaymentLines(
  input: PosCollectionTenderInput,
  targetMxn: number,
): PosTenderPaymentLine[] | null {
  const rate = Number(input.usdExchangeRate ?? 0);
  const cashMxn = readAmount(input.amountCashMxn);
  const cashUsd = readAmount(input.amountCashUsd);
  const transfer = readAmount(input.amountTransferMxn);
  const checkMxn = readAmount(input.amountCheckMxn);
  const checkUsd = readAmount(input.amountCheckUsd);
  const cards = readCards(input);
  const lines: PosTenderPaymentLine[] = [];

  if (cashMxn > 0) {
    lines.push({
      method: PosSalePaymentMethod.CASH,
      amount: cashMxn,
      reference: null,
      notes: null,
    });
  }
  if (cashUsd > 0) {
    if (!(rate > 0)) return null;
    lines.push({
      method: PosSalePaymentMethod.CASH,
      amount: roundPosMoney(cashUsd * rate),
      reference: null,
      notes: `${formatAmount(cashUsd)} USD · TC ${formatRate(rate)}`,
    });
  }
  if (transfer > 0) {
    lines.push({
      method: PosSalePaymentMethod.TRANSFER,
      amount: transfer,
      reference: readText(input.transferReference),
      notes: null,
    });
  }
  for (const card of cards) {
    const amount = roundPosMoney(card.amount_mxn);
    if (amount <= 0) continue;
    lines.push({
      method: PosSalePaymentMethod.CARD,
      amount,
      reference: card.reference,
      notes: cardKindNote(card.card_kind),
    });
  }
  if (checkMxn > 0) {
    lines.push({
      method: PosSalePaymentMethod.CHECK,
      amount: checkMxn,
      reference: readText(input.checkReference),
      notes: null,
    });
  }
  if (checkUsd > 0) {
    if (!(rate > 0)) return null;
    lines.push({
      method: PosSalePaymentMethod.CHECK,
      amount: roundPosMoney(checkUsd * rate),
      reference: readText(input.checkReference),
      notes: `${formatAmount(checkUsd)} USD · TC ${formatRate(rate)}`,
    });
  }

  if (lines.length === 0) return null;

  const target = roundPosMoney(targetMxn);
  const sum = roundPosMoney(lines.reduce((total, line) => total + line.amount, 0));
  const diff = roundPosMoney(target - sum);
  const usdLegs = (cashUsd > 0 ? 1 : 0) + (checkUsd > 0 ? 1 : 0);
  const tolerance = usdLegs > 0 ? usdCentToleranceMxn(rate) * usdLegs + 0.001 : 0.02;
  if (Math.abs(diff) > tolerance) return null;
  if (diff !== 0) {
    const last = lines[lines.length - 1];
    last.amount = roundPosMoney(last.amount + diff);
    if (last.amount <= 0) return null;
  }
  return lines;
}

/** La nota del cajero queda en el primer pago, sin repetirla en cada medio. */
export function assignPosTenderCashierNotes(
  lines: PosTenderPaymentLine[],
  cashierNotes: string | null | undefined,
): PosTenderPaymentLine[] {
  const note = cashierNotes?.trim();
  if (!note || lines.length === 0) return lines;
  const [first, ...rest] = lines;
  return [
    {
      ...first,
      notes: first.notes ? `${first.notes} · ${note}` : note,
    },
    ...rest,
  ];
}
