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
export declare function normalizePayableCurrency(value: string | null | undefined): PayableCurrencyCode;
export declare function parseCreditLimit(value: string | number | null | undefined): number | null;
export declare function aggregatePayableVendors(orders: PayableOrderInput[]): AccountsPayableVendorTotals[];
export declare function mergeVendorCredits(rows: AccountsPayableVendorTotals[], credits: VendorCreditInput[]): AccountsPayableVendorTotals[];
export declare function filterPayableVendors(rows: AccountsPayableVendorTotals[], view: PayableCurrencyView): AccountsPayableVendorTotals[];
export declare function sortPayableVendors(rows: AccountsPayableVendorTotals[], view: PayableCurrencyView): AccountsPayableVendorTotals[];
export declare function summarizePayableVendors(rows: AccountsPayableVendorTotals[], view: PayableCurrencyView): AccountsPayableCurrencySummary;
export declare function normalizeExchangeRate(value: number | string | null | undefined): number | null;
export declare function payableTotalInMxn(amountMxn: number, amountUsd: number, exchangeRate: number | string | null | undefined): number | null;
export declare function applyPayableExchangeRate(rows: AccountsPayableVendorTotals[], view: PayableCurrencyView, exchangeRate: number | string | null | undefined): AccountsPayableVendorTotals[];
export declare function summarizePayableWithRate(rows: AccountsPayableVendorTotals[], view: PayableCurrencyView, exchangeRate: number | string | null | undefined, exchangeRateDate: string | null): AccountsPayableCurrencySummary;
