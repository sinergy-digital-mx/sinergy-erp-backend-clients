export declare enum CustomerSalesReportPeriod {
    TODAY = "today",
    WEEK = "week",
    MONTH = "month",
    YEAR = "year",
    RANGE = "range"
}
export declare class QueryCustomerSalesReportDto {
    fiscal_configuration_id?: string;
    billing_branch_id?: string;
    period?: CustomerSalesReportPeriod;
    date_from?: string;
    date_to?: string;
    limit?: number;
}
