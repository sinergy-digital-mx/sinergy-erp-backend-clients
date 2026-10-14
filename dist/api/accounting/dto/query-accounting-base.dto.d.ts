export declare enum AccountingReportPeriod {
    TODAY = "today",
    WEEK = "week",
    MONTH = "month",
    RANGE = "range"
}
export declare class QueryAccountingBaseDto {
    billing_branch_id: string;
    period?: AccountingReportPeriod;
    date_from?: string;
    date_to?: string;
}
export declare enum AccountsPayableCurrencyView {
    ALL = "all",
    MXN = "mxn",
    USD = "usd"
}
export declare class QueryAccountsPayableDto {
    page?: number;
    limit?: number;
    search?: string;
    currency?: AccountsPayableCurrencyView;
}
export declare class QueryAccountsReceivableDto {
    billing_branch_id?: string;
    page?: number;
    limit?: number;
    search?: string;
}
export declare class QueryPosTerminalSalesDto extends QueryAccountingBaseDto {
    page?: number;
    limit?: number;
}
export declare enum PosCollectionCustomerType {
    ALL = "all",
    WALK_IN = "walk_in",
    INVOICED = "invoiced"
}
export declare enum PosCollectionDateBasis {
    SHIFT = "shift",
    COLLECTED = "collected"
}
export declare class QueryPosCollectionsDto extends QueryAccountingBaseDto {
    date_basis?: PosCollectionDateBasis;
    customer_type?: PosCollectionCustomerType;
    search?: string;
    page?: number;
    limit?: number;
}
