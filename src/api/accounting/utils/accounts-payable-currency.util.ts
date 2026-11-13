export type PayableCurrencyCode = 'MXN' | 'USD';
export type PayableCurrencyView = 'all' | 'mxn' | 'usd';

export interface PayableOrderInput {
  vendor_id: string;
  vendor_name: string;
  razon_social: string | null;
  company_name: string | null;
  credit_limit: number | null;
  payment_currency: string | null;
  amount_pending: number;
  amount_paid: number;
}

export interface AccountsPayableVendorTotals {
  vendor_id: string;
  vendor_name: string;
  razon_social: string | null;
  company_name: string | null;
  credit_limit: number | null;
  pending_order_count_mxn: number;
  amount_pending_mxn: number;
  amount_paid_mxn: number;
  total_committed_mxn: number;
  progress_percentage_mxn: number;
  pending_order_count_usd: number;
  amount_pending_usd: number;
  amount_paid_usd: number;
  total_committed_usd: number;
  progress_percentage_usd: number;
  pending_order_count: number;
  amount_pending: number;
  amount_paid: number;
  total_committed: number;
  progress_percentage: number;
  amount_pending_total_mxn: number | null;
  credit_balance_mxn: number;
  credit_balance_usd: number;
}

export interface VendorCreditInput {
  vendor_id: string;
  vendor_name: string;
  razon_social: string | null;
  company_name: string | null;
  credit_limit: number | null;
  credit_balance_mxn: number;
  credit_balance_usd: number;
}

export interface AccountsPayableCurrencySummary {
  currency: PayableCurrencyView;
  total_vendors: number;
  total_amount_pending_mxn: number;
  total_amount_pending_usd: number;
  total_pending_orders_mxn: number;
  total_pending_orders_usd: number;
  total_amount_pending: number;
  exchange_rate: number | null;
  exchange_rate_date: string | null;
  total_amount_pending_total_mxn: number | null;
  total_credit_balance_mxn: number;
  total_credit_balance_usd: number;
}

interface PayableBucket {
  pending_order_count: number;
  amount_pending: number;
  amount_paid: number;
  total_committed: number;
}

interface PayableVendorDraft {
  vendor_id: string;
  vendor_name: string;
  razon_social: string | null;
  company_name: string | null;
  credit_limit: number | null;
  mxn: PayableBucket;
  usd: PayableBucket;
}

export function normalizePayableCurrency(
  value: string | null | undefined,
): PayableCurrencyCode {
  return String(value ?? '').trim().toUpperCase() === 'USD' ? 'USD' : 'MXN';
}

export function parseCreditLimit(
  value: string | number | null | undefined,
): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function aggregatePayableVendors(
  orders: PayableOrderInput[],
): AccountsPayableVendorTotals[] {
  const vendorMap = new Map<string, PayableVendorDraft>();

  for (const order of orders) {
    if (order.amount_pending <= 0) continue;

    const draft = vendorMap.get(order.vendor_id) ?? {
      vendor_id: order.vendor_id,
      vendor_name: order.vendor_name,
      razon_social: order.razon_social,
      company_name: order.company_name,
      credit_limit: parseCreditLimit(order.credit_limit),
      mxn: emptyBucket(),
      usd: emptyBucket(),
    };

    const bucket =
      normalizePayableCurrency(order.payment_currency) === 'USD' ? draft.usd : draft.mxn;
    bucket.pending_order_count += 1;
    bucket.amount_pending += order.amount_pending;
    bucket.amount_paid += order.amount_paid;
    bucket.total_committed += order.amount_pending + order.amount_paid;
    vendorMap.set(order.vendor_id, draft);
  }

  return Array.from(vendorMap.values()).map((draft) => toVendorRow(draft));
}

export function mergeVendorCredits(
  rows: AccountsPayableVendorTotals[],
  credits: VendorCreditInput[],
): AccountsPayableVendorTotals[] {
  const map = new Map(rows.map((row) => [row.vendor_id, { ...row }]));

  for (const credit of credits) {
    const current = map.get(credit.vendor_id);
    if (current) {
      current.credit_balance_mxn = roundMoney(credit.credit_balance_mxn);
      current.credit_balance_usd = roundMoney(credit.credit_balance_usd);
      map.set(credit.vendor_id, current);
      continue;
    }

    if (credit.credit_balance_mxn <= 0 && credit.credit_balance_usd <= 0) continue;

    map.set(
      credit.vendor_id,
      toVendorRow(
        {
          vendor_id: credit.vendor_id,
          vendor_name: credit.vendor_name,
          razon_social: credit.razon_social,
          company_name: credit.company_name,
          credit_limit: parseCreditLimit(credit.credit_limit),
          mxn: emptyBucket(),
          usd: emptyBucket(),
        },
        {
          mxn: roundMoney(credit.credit_balance_mxn),
          usd: roundMoney(credit.credit_balance_usd),
        },
      ),
    );
  }

  return Array.from(map.values());
}

export function filterPayableVendors(
  rows: AccountsPayableVendorTotals[],
  view: PayableCurrencyView,
): AccountsPayableVendorTotals[] {
  if (view === 'mxn') {
    return rows.filter((row) => row.amount_pending_mxn > 0 || row.credit_balance_mxn > 0);
  }
  if (view === 'usd') {
    return rows.filter((row) => row.amount_pending_usd > 0 || row.credit_balance_usd > 0);
  }
  return rows.filter(
    (row) =>
      row.amount_pending_mxn > 0 ||
      row.amount_pending_usd > 0 ||
      row.credit_balance_mxn > 0 ||
      row.credit_balance_usd > 0,
  );
}

export function sortPayableVendors(
  rows: AccountsPayableVendorTotals[],
  view: PayableCurrencyView,
): AccountsPayableVendorTotals[] {
  return [...rows].sort((a, b) => {
    if (view === 'usd') return b.amount_pending_usd - a.amount_pending_usd;
    const byMxn = b.amount_pending_mxn - a.amount_pending_mxn;
    if (view === 'mxn' || byMxn !== 0) return byMxn;
    return b.amount_pending_usd - a.amount_pending_usd;
  });
}

export function summarizePayableVendors(
  rows: AccountsPayableVendorTotals[],
  view: PayableCurrencyView,
): AccountsPayableCurrencySummary {
  const totalMxn = roundMoney(rows.reduce((sum, row) => sum + row.amount_pending_mxn, 0));
  const totalUsd = roundMoney(rows.reduce((sum, row) => sum + row.amount_pending_usd, 0));

  return {
    currency: view,
    total_vendors: rows.length,
    total_amount_pending_mxn: totalMxn,
    total_amount_pending_usd: totalUsd,
    total_pending_orders_mxn: rows.reduce((sum, row) => sum + row.pending_order_count_mxn, 0),
    total_pending_orders_usd: rows.reduce((sum, row) => sum + row.pending_order_count_usd, 0),
    total_amount_pending: view === 'usd' ? totalUsd : totalMxn,
    exchange_rate: null,
    exchange_rate_date: null,
    total_amount_pending_total_mxn: sumPayableTotals(rows),
    total_credit_balance_mxn: roundMoney(rows.reduce((sum, row) => sum + row.credit_balance_mxn, 0)),
    total_credit_balance_usd: roundMoney(rows.reduce((sum, row) => sum + row.credit_balance_usd, 0)),
  };
}

export function normalizeExchangeRate(
  value: number | string | null | undefined,
): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Number(parsed.toFixed(4));
}

export function payableTotalInMxn(
  amountMxn: number,
  amountUsd: number,
  exchangeRate: number | string | null | undefined,
): number | null {
  const mxn = roundMoney(amountMxn);
  const usd = roundMoney(amountUsd);
  if (usd <= 0) return mxn;
  const rate = normalizeExchangeRate(exchangeRate);
  if (rate == null) return null;
  return roundMoney(mxn + usd * rate);
}

export function applyPayableExchangeRate(
  rows: AccountsPayableVendorTotals[],
  view: PayableCurrencyView,
  exchangeRate: number | string | null | undefined,
): AccountsPayableVendorTotals[] {
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

export function summarizePayableWithRate(
  rows: AccountsPayableVendorTotals[],
  view: PayableCurrencyView,
  exchangeRate: number | string | null | undefined,
  exchangeRateDate: string | null,
): AccountsPayableCurrencySummary {
  const rated = applyPayableExchangeRate(rows, view, exchangeRate);
  return {
    ...summarizePayableVendors(rated, view),
    exchange_rate: normalizeExchangeRate(exchangeRate),
    exchange_rate_date: exchangeRateDate,
    total_amount_pending_total_mxn: sumPayableTotals(rated),
  };
}

function toVendorRow(
  draft: PayableVendorDraft,
  credit: { mxn: number; usd: number } = { mxn: 0, usd: 0 },
): AccountsPayableVendorTotals {
  const mxnPending = roundMoney(draft.mxn.amount_pending);
  const mxnPaid = roundMoney(draft.mxn.amount_paid);
  const mxnCommitted = roundMoney(draft.mxn.total_committed);
  const usdPending = roundMoney(draft.usd.amount_pending);
  const usdPaid = roundMoney(draft.usd.amount_paid);
  const usdCommitted = roundMoney(draft.usd.total_committed);
  const progressMxn = payableProgress(mxnPending, mxnCommitted, draft.credit_limit, true);
  const progressUsd = payableProgress(usdPending, usdCommitted, draft.credit_limit, false);

  return {
    vendor_id: draft.vendor_id,
    vendor_name: draft.vendor_name,
    razon_social: draft.razon_social,
    company_name: draft.company_name,
    credit_limit: draft.credit_limit,
    pending_order_count_mxn: draft.mxn.pending_order_count,
    amount_pending_mxn: mxnPending,
    amount_paid_mxn: mxnPaid,
    total_committed_mxn: mxnCommitted,
    progress_percentage_mxn: progressMxn,
    pending_order_count_usd: draft.usd.pending_order_count,
    amount_pending_usd: usdPending,
    amount_paid_usd: usdPaid,
    total_committed_usd: usdCommitted,
    progress_percentage_usd: progressUsd,
    pending_order_count: draft.mxn.pending_order_count + draft.usd.pending_order_count,
    amount_pending: mxnPending,
    amount_paid: mxnPaid,
    total_committed: mxnCommitted,
    progress_percentage: progressMxn,
    amount_pending_total_mxn: null,
    credit_balance_mxn: roundMoney(credit.mxn),
    credit_balance_usd: roundMoney(credit.usd),
  };
}

function sumPayableTotals(rows: AccountsPayableVendorTotals[]): number | null {
  if (rows.some((row) => row.amount_pending_total_mxn == null)) return null;
  return roundMoney(rows.reduce((sum, row) => sum + (row.amount_pending_total_mxn ?? 0), 0));
}

function payableProgress(
  pending: number,
  committed: number,
  creditLimit: number | null,
  applyCreditLimit: boolean,
): number {
  if (applyCreditLimit && creditLimit && creditLimit > 0) {
    return Number(((pending / creditLimit) * 100).toFixed(2));
  }
  if (committed > 0) {
    return Number(((pending / committed) * 100).toFixed(2));
  }
  return 0;
}

function emptyBucket(): PayableBucket {
  return {
    pending_order_count: 0,
    amount_pending: 0,
    amount_paid: 0,
    total_committed: 0,
  };
}

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

const PAYABLE_TIME_ZONE = 'America/Tijuana';

export function payableCalendarDay(value: Date | string | null | undefined): string {
  if (value == null || value === '') return '';
  if (typeof value === 'string') {
    const dateOnly = /^(\d{4}-\d{2}-\d{2})$/.exec(value.trim());
    if (dateOnly) return dateOnly[1];
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PAYABLE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function isWithinPayablePeriod(
  value: Date | string | null | undefined,
  from: string,
  to: string,
): boolean {
  const day = payableCalendarDay(value);
  if (!day || !from || !to) return false;
  return day >= from && day <= to;
}
