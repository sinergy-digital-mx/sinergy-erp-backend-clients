export interface SalesOrderStatBucket {
  count: number;
  amount: number;
}

export interface SalesOrderCurrencyStats {
  count: number;
  amount: number;
  /** Aún no entregadas y no canceladas. */
  open: SalesOrderStatBucket;
  /** Estado Surtida. */
  delivered: SalesOrderStatBucket;
  paid: SalesOrderStatBucket;
  pending: SalesOrderStatBucket;
}

/** Totales del listado: todas las órdenes del filtro, no la página. El monto es `total`. */
export interface SalesOrderListStats {
  count: number;
  by_currency: {
    MXN: SalesOrderCurrencyStats;
    USD: SalesOrderCurrencyStats;
  };
}

export interface SalesOrderListStatRow {
  currency?: string | null;
  general_status?: string | null;
  payment_status?: string | null;
  cnt?: string | number | null;
  amount?: string | number | null;
}

function emptyBucket(): SalesOrderStatBucket {
  return { count: 0, amount: 0 };
}

function emptyCurrencyStats(): SalesOrderCurrencyStats {
  return {
    count: 0,
    amount: 0,
    open: emptyBucket(),
    delivered: emptyBucket(),
    paid: emptyBucket(),
    pending: emptyBucket(),
  };
}

export function emptySalesOrderListStats(): SalesOrderListStats {
  return {
    count: 0,
    by_currency: {
      MXN: emptyCurrencyStats(),
      USD: emptyCurrencyStats(),
    },
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildSalesOrderListStats(rows: SalesOrderListStatRow[]): SalesOrderListStats {
  const by_currency = {
    MXN: emptyCurrencyStats(),
    USD: emptyCurrencyStats(),
  };

  for (const row of rows) {
    const currency = row.currency === 'USD' ? 'USD' : 'MXN';
    const bucket = by_currency[currency];
    const count = Number(row.cnt) || 0;
    const amount = roundMoney(Number(row.amount) || 0);

    bucket.count += count;
    bucket.amount = roundMoney(bucket.amount + amount);

    if (row.general_status === 'Surtida') {
      bucket.delivered.count += count;
      bucket.delivered.amount = roundMoney(bucket.delivered.amount + amount);
    } else if (row.general_status !== 'Cancelada') {
      bucket.open.count += count;
      bucket.open.amount = roundMoney(bucket.open.amount + amount);
    }
    if (row.payment_status === 'Pagado') {
      bucket.paid.count += count;
      bucket.paid.amount = roundMoney(bucket.paid.amount + amount);
    } else if (row.payment_status === 'Pendiente') {
      bucket.pending.count += count;
      bucket.pending.amount = roundMoney(bucket.pending.amount + amount);
    }
  }

  return {
    count: by_currency.MXN.count + by_currency.USD.count,
    by_currency,
  };
}
