import {
  normalizeExchangeRate,
  normalizePayableCurrency,
  payableTotalInMxn,
  PayableCurrencyView,
} from './accounts-payable-currency.util';

export type ReceivableCurrencyView = PayableCurrencyView;

export interface ReceivableOrderInput {
  razon_social: string;
  fiscal_rfc: string | null;
  customer_id: string | number | null;
  currency: string | null;
  amount_pending: number;
}

export interface AccountsReceivableAccountTotals {
  razon_social: string;
  fiscal_rfc: string | null;
  customer_count: number;
  pending_order_count_mxn: number;
  amount_pending_mxn: number;
  pending_order_count_usd: number;
  amount_pending_usd: number;
  pending_order_count: number;
  amount_pending: number;
  amount_pending_total_mxn: number | null;
}

export interface AccountsReceivableCurrencySummary {
  currency: ReceivableCurrencyView;
  total_accounts: number;
  total_amount_pending_mxn: number;
  total_amount_pending_usd: number;
  total_pending_orders_mxn: number;
  total_pending_orders_usd: number;
  total_amount_pending: number;
  exchange_rate: number | null;
  exchange_rate_date: string | null;
  total_amount_pending_total_mxn: number | null;
}

interface ReceivableBucket {
  pending_order_count: number;
  amount_pending: number;
}

interface ReceivableAccountDraft {
  razon_social: string;
  fiscal_rfc: string | null;
  customer_ids: Set<string>;
  mxn: ReceivableBucket;
  usd: ReceivableBucket;
}

export function aggregateReceivableAccounts(
  orders: ReceivableOrderInput[],
): AccountsReceivableAccountTotals[] {
  const accountMap = new Map<string, ReceivableAccountDraft>();

  for (const order of orders) {
    if (order.amount_pending <= 0) continue;

    const draft = accountMap.get(order.razon_social) ?? {
      razon_social: order.razon_social,
      fiscal_rfc: order.fiscal_rfc,
      customer_ids: new Set<string>(),
      mxn: emptyBucket(),
      usd: emptyBucket(),
    };

    if (!draft.fiscal_rfc && order.fiscal_rfc) {
      draft.fiscal_rfc = order.fiscal_rfc;
    }
    if (order.customer_id != null && order.customer_id !== '') {
      draft.customer_ids.add(String(order.customer_id));
    }

    const bucket = normalizePayableCurrency(order.currency) === 'USD' ? draft.usd : draft.mxn;
    bucket.pending_order_count += 1;
    bucket.amount_pending += order.amount_pending;
    accountMap.set(order.razon_social, draft);
  }

  return Array.from(accountMap.values()).map((draft) => toAccountRow(draft));
}

export function filterReceivableAccounts(
  rows: AccountsReceivableAccountTotals[],
  view: ReceivableCurrencyView,
): AccountsReceivableAccountTotals[] {
  if (view === 'mxn') return rows.filter((row) => row.amount_pending_mxn > 0);
  if (view === 'usd') return rows.filter((row) => row.amount_pending_usd > 0);
  return rows.filter((row) => row.amount_pending_mxn > 0 || row.amount_pending_usd > 0);
}

export function sortReceivableAccounts(
  rows: AccountsReceivableAccountTotals[],
  view: ReceivableCurrencyView,
): AccountsReceivableAccountTotals[] {
  return [...rows].sort((a, b) => {
    if (view === 'usd') return b.amount_pending_usd - a.amount_pending_usd;
    const byMxn = b.amount_pending_mxn - a.amount_pending_mxn;
    if (view === 'mxn' || byMxn !== 0) return byMxn;
    return b.amount_pending_usd - a.amount_pending_usd;
  });
}

export function applyReceivableExchangeRate(
  rows: AccountsReceivableAccountTotals[],
  view: ReceivableCurrencyView,
  exchangeRate: number | string | null | undefined,
): AccountsReceivableAccountTotals[] {
  const rate = normalizeExchangeRate(exchangeRate);
  return rows.map((row) => ({
    ...row,
    amount_pending_total_mxn: payableTotalInMxn(
      view === 'usd' ? 0 : row.amount_pending_mxn,
      view === 'mxn' ? 0 : row.amount_pending_usd,
      rate,
    ),
  }));
}

export function summarizeReceivableAccounts(
  rows: AccountsReceivableAccountTotals[],
  view: ReceivableCurrencyView,
  exchangeRate: number | string | null | undefined,
  exchangeRateDate: string | null,
): AccountsReceivableCurrencySummary {
  const rated = applyReceivableExchangeRate(rows, view, exchangeRate);
  const totalMxn = roundMoney(rated.reduce((sum, row) => sum + row.amount_pending_mxn, 0));
  const totalUsd = roundMoney(rated.reduce((sum, row) => sum + row.amount_pending_usd, 0));

  return {
    currency: view,
    total_accounts: rated.length,
    total_amount_pending_mxn: totalMxn,
    total_amount_pending_usd: totalUsd,
    total_pending_orders_mxn: rated.reduce((sum, row) => sum + row.pending_order_count_mxn, 0),
    total_pending_orders_usd: rated.reduce((sum, row) => sum + row.pending_order_count_usd, 0),
    total_amount_pending: view === 'usd' ? totalUsd : totalMxn,
    exchange_rate: normalizeExchangeRate(exchangeRate),
    exchange_rate_date: exchangeRateDate,
    total_amount_pending_total_mxn: sumReceivableTotals(rated),
  };
}

function toAccountRow(draft: ReceivableAccountDraft): AccountsReceivableAccountTotals {
  const mxnPending = roundMoney(draft.mxn.amount_pending);
  const usdPending = roundMoney(draft.usd.amount_pending);

  return {
    razon_social: draft.razon_social,
    fiscal_rfc: draft.fiscal_rfc,
    customer_count: draft.customer_ids.size,
    pending_order_count_mxn: draft.mxn.pending_order_count,
    amount_pending_mxn: mxnPending,
    pending_order_count_usd: draft.usd.pending_order_count,
    amount_pending_usd: usdPending,
    pending_order_count: draft.mxn.pending_order_count + draft.usd.pending_order_count,
    amount_pending: mxnPending,
    amount_pending_total_mxn: null,
  };
}

function sumReceivableTotals(rows: AccountsReceivableAccountTotals[]): number | null {
  if (rows.some((row) => row.amount_pending_total_mxn == null)) return null;
  return roundMoney(rows.reduce((sum, row) => sum + (row.amount_pending_total_mxn ?? 0), 0));
}

function emptyBucket(): ReceivableBucket {
  return { pending_order_count: 0, amount_pending: 0 };
}

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}
