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
}
export interface AccountsPayableCurrencySummary {
    currency: PayableCurrencyView;
    total_vendors: number;
    total_amount_pending_mxn: number;
    total_amount_pending_usd: number;
    total_pending_orders_mxn: number;
    total_pending_orders_usd: number;
    total_amount_pending: number;
}
export declare function normalizePayableCurrency(value: string | null | undefined): PayableCurrencyCode;
export declare function parseCreditLimit(value: string | number | null | undefined): number | null;
export declare function aggregatePayableVendors(orders: PayableOrderInput[]): AccountsPayableVendorTotals[];
export declare function filterPayableVendors(rows: AccountsPayableVendorTotals[], view: PayableCurrencyView): AccountsPayableVendorTotals[];
export declare function sortPayableVendors(rows: AccountsPayableVendorTotals[], view: PayableCurrencyView): AccountsPayableVendorTotals[];
export declare function summarizePayableVendors(rows: AccountsPayableVendorTotals[], view: PayableCurrencyView): AccountsPayableCurrencySummary;
