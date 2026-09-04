export declare enum StockFlowPeriod {
    TODAY = "today",
    WEEK = "week",
    MONTH = "month",
    YEAR = "year",
    RANGE = "range"
}
export declare enum StockFlowView {
    SUMMARY = "summary",
    LEDGER = "ledger"
}
export declare class QueryStockFlowDto {
    period: StockFlowPeriod;
    date_from?: string;
    date_to?: string;
    view?: StockFlowView;
    fiscal_configuration_id: string;
    billing_branch_id?: string;
    product_id?: string;
    search?: string;
}
