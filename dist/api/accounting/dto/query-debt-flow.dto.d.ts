export declare enum DebtFlowView {
    AGING = "aging",
    LEDGER = "ledger"
}
export declare enum DebtFlowPeriod {
    TODAY = "today",
    WEEK = "week",
    MONTH = "month",
    YEAR = "year",
    RANGE = "range"
}
export declare class QueryDebtFlowDto {
    fiscal_configuration_id: string;
    billing_branch_id?: string;
    customer_id?: number;
    search?: string;
    view?: DebtFlowView;
    period?: DebtFlowPeriod;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
}
