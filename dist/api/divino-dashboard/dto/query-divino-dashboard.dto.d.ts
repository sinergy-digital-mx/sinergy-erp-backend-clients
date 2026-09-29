export type DivinoDashboardScope = 'period' | 'all_time';
export declare class QueryDivinoDashboardDto {
    scope?: DivinoDashboardScope;
    year?: number;
    month?: number;
    group_id?: string;
}
export declare class QueryRevenueSeriesDto extends QueryDivinoDashboardDto {
    period?: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
}
