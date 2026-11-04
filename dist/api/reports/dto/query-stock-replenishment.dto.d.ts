export declare const STOCK_PERIOD_DAY_OPTIONS: readonly [30, 60, 90];
export declare const STOCK_COVER_DAY_OPTIONS: readonly [15, 30, 45, 60];
export declare class QueryStockReplenishmentDto {
    vendor_id: string;
    period_days?: (typeof STOCK_PERIOD_DAY_OPTIONS)[number];
    cover_days?: (typeof STOCK_COVER_DAY_OPTIONS)[number];
}
