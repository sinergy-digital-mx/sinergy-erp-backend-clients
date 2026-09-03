export declare enum SalesReportPeriod {
    TODAY = "today",
    WEEK = "week",
    MONTH = "month",
    YEAR = "year",
    RANGE = "range"
}
export declare enum SalesReportView {
    SALES = "sales",
    COMMISSIONS = "commissions"
}
export declare class QuerySalesBySellerReportDto {
    view?: SalesReportView;
    fiscal_configuration_id?: string;
    billing_branch_id?: string;
    period?: SalesReportPeriod;
    date_from?: string;
    date_to?: string;
    commission_rate?: number;
}
export declare class QuerySalesBySellerOrdersDto extends QuerySalesBySellerReportDto {
    seller_id: string;
    page?: number;
    limit?: number;
}
