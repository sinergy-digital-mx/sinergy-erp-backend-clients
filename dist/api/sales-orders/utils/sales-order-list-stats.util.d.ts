export interface SalesOrderStatBucket {
    count: number;
    amount: number;
}
export interface SalesOrderCurrencyStats {
    count: number;
    amount: number;
    open: SalesOrderStatBucket;
    delivered: SalesOrderStatBucket;
    paid: SalesOrderStatBucket;
    pending: SalesOrderStatBucket;
}
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
export declare function emptySalesOrderListStats(): SalesOrderListStats;
export declare function buildSalesOrderListStats(rows: SalesOrderListStatRow[]): SalesOrderListStats;
