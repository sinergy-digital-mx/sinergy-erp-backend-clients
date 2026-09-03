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
export declare class QueryAccountsPayableDto {
    page?: number;
    limit?: number;
    search?: string;
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
export declare class QueryPosCollectionsDto extends QueryAccountingBaseDto {
    customer_type?: PosCollectionCustomerType;
    page?: number;
    limit?: number;
}
