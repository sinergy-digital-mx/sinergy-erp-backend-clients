import { PayableCurrencyView } from './accounts-payable-currency.util';
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
export declare function aggregateReceivableAccounts(orders: ReceivableOrderInput[]): AccountsReceivableAccountTotals[];
export declare function filterReceivableAccounts(rows: AccountsReceivableAccountTotals[], view: ReceivableCurrencyView): AccountsReceivableAccountTotals[];
export declare function sortReceivableAccounts(rows: AccountsReceivableAccountTotals[], view: ReceivableCurrencyView): AccountsReceivableAccountTotals[];
export declare function applyReceivableExchangeRate(rows: AccountsReceivableAccountTotals[], view: ReceivableCurrencyView, exchangeRate: number | string | null | undefined): AccountsReceivableAccountTotals[];
export declare function summarizeReceivableAccounts(rows: AccountsReceivableAccountTotals[], view: ReceivableCurrencyView, exchangeRate: number | string | null | undefined, exchangeRateDate: string | null): AccountsReceivableCurrencySummary;
