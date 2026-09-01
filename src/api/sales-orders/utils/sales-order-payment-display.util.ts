import { PosSalePaymentMethod } from '../../../entities/pos/pos-sale-payment-method.enum';

export const SALES_ORDER_PAYMENT_METHOD_LABELS: Record<PosSalePaymentMethod, string> = {
  [PosSalePaymentMethod.CASH]: 'Efectivo',
  [PosSalePaymentMethod.CARD]: 'Tarjeta',
  [PosSalePaymentMethod.TRANSFER]: 'Transferencia',
  [PosSalePaymentMethod.MIXED]: 'Mixto',
  [PosSalePaymentMethod.CREDIT]: 'Crédito',
};

export type SalesOrderPaymentDisplayLine = {
  method: 'cash' | 'card' | 'transfer' | 'credit';
  label: string;
  amount_mxn: number;
  amount_usd: number;
};

export type SalesOrderPaymentDisplay = {
  payment_method: PosSalePaymentMethod | null;
  payment_method_label: string | null;
  /** Mixto: `Efectivo + Tarjeta`. Un solo método: mismo label. Sin cobro: null. */
  payment_breakdown_label: string | null;
  lines: SalesOrderPaymentDisplayLine[];
};

export type PaymentDisplayCollectionInput = {
  payment_method: PosSalePaymentMethod | string;
  amount_cash_mxn?: number | string | null;
  amount_cash_usd?: number | string | null;
  amount_transfer_mxn?: number | string | null;
  amount_card_mxn?: number | string | null;
  amount_credit_mxn?: number | string | null;
};

export type PaymentDisplayPaymentInput = {
  payment_method: PosSalePaymentMethod | string;
  amount: number | string;
  currency?: string | null;
};

const LINE_METHODS = [
  PosSalePaymentMethod.CASH,
  PosSalePaymentMethod.TRANSFER,
  PosSalePaymentMethod.CARD,
  PosSalePaymentMethod.CREDIT,
] as const;

function toNumber(value: number | string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function asMethod(value: string | null | undefined): PosSalePaymentMethod | null {
  if (!value) return null;
  return (Object.values(PosSalePaymentMethod) as string[]).includes(value)
    ? (value as PosSalePaymentMethod)
    : null;
}

function line(
  method: (typeof LINE_METHODS)[number],
  amountMxn: number,
  amountUsd = 0,
): SalesOrderPaymentDisplayLine | null {
  if (amountMxn <= 0 && amountUsd <= 0) return null;
  return {
    method,
    label: SALES_ORDER_PAYMENT_METHOD_LABELS[method],
    amount_mxn: Number(amountMxn.toFixed(2)),
    amount_usd: Number(amountUsd.toFixed(2)),
  };
}

function fromLines(
  method: PosSalePaymentMethod | null,
  lines: SalesOrderPaymentDisplayLine[],
): SalesOrderPaymentDisplay {
  if (!method && lines.length === 0) {
    return {
      payment_method: null,
      payment_method_label: null,
      payment_breakdown_label: null,
      lines: [],
    };
  }

  const resolved =
    method ??
    (lines.length > 1 ? PosSalePaymentMethod.MIXED : asMethod(lines[0]?.method) ?? null);
  const label = resolved ? SALES_ORDER_PAYMENT_METHOD_LABELS[resolved] : null;
  const breakdown =
    lines.length > 1 ? lines.map((item) => item.label).join(' + ') : lines[0]?.label ?? label;

  return {
    payment_method: resolved,
    payment_method_label: label,
    payment_breakdown_label: breakdown,
    lines,
  };
}

function fromCollection(collection: PaymentDisplayCollectionInput): SalesOrderPaymentDisplay {
  const method = asMethod(String(collection.payment_method));
  const lines = [
    line(
      PosSalePaymentMethod.CASH,
      toNumber(collection.amount_cash_mxn),
      toNumber(collection.amount_cash_usd),
    ),
    line(PosSalePaymentMethod.TRANSFER, toNumber(collection.amount_transfer_mxn)),
    line(PosSalePaymentMethod.CARD, toNumber(collection.amount_card_mxn)),
    line(PosSalePaymentMethod.CREDIT, toNumber(collection.amount_credit_mxn)),
  ].filter((item): item is SalesOrderPaymentDisplayLine => item != null);

  if (lines.length === 0 && method) {
    return {
      payment_method: method,
      payment_method_label: SALES_ORDER_PAYMENT_METHOD_LABELS[method],
      payment_breakdown_label: SALES_ORDER_PAYMENT_METHOD_LABELS[method],
      lines: [],
    };
  }

  return fromLines(method, lines);
}

function fromPayments(payments: PaymentDisplayPaymentInput[]): SalesOrderPaymentDisplay {
  const totals = new Map<(typeof LINE_METHODS)[number], { mxn: number; usd: number }>();
  const methods = new Set<PosSalePaymentMethod>();

  for (const payment of payments) {
    const method = asMethod(String(payment.payment_method));
    if (!method) continue;
    methods.add(method);
    const amount = toNumber(payment.amount);
    const isUsd = String(payment.currency ?? 'MXN').toUpperCase() === 'USD';

    if (method === PosSalePaymentMethod.MIXED) {
      continue;
    }
    if (!LINE_METHODS.includes(method as (typeof LINE_METHODS)[number])) {
      continue;
    }
    const key = method as (typeof LINE_METHODS)[number];
    const current = totals.get(key) ?? { mxn: 0, usd: 0 };
    if (isUsd) current.usd += amount;
    else current.mxn += amount;
    totals.set(key, current);
  }

  const lines = LINE_METHODS.map((method) => {
    const total = totals.get(method);
    return total ? line(method, total.mxn, total.usd) : null;
  }).filter((item): item is SalesOrderPaymentDisplayLine => item != null);

  if (methods.has(PosSalePaymentMethod.MIXED) && lines.length <= 1) {
    return fromLines(PosSalePaymentMethod.MIXED, lines);
  }

  const resolved =
    methods.size > 1 || methods.has(PosSalePaymentMethod.MIXED)
      ? PosSalePaymentMethod.MIXED
      : [...methods][0] ?? null;

  return fromLines(resolved, lines);
}

/** Cómo se pagó la OV: cobranza POS primero; si no, pagos del detalle. */
export function buildSalesOrderPaymentDisplay(input: {
  collection?: PaymentDisplayCollectionInput | null;
  payments?: PaymentDisplayPaymentInput[] | null;
  isCredit?: boolean;
}): SalesOrderPaymentDisplay {
  if (input.collection) {
    return fromCollection(input.collection);
  }

  const fromPaymentRows = fromPayments(input.payments ?? []);
  if (fromPaymentRows.payment_method) {
    return fromPaymentRows;
  }

  if (input.isCredit) {
    return fromLines(PosSalePaymentMethod.CREDIT, []);
  }

  return fromLines(null, []);
}
