export declare const PURCHASE_TREND_TIMEZONE = "America/Mexico_City";
export declare const PURCHASE_TREND_MONTHS = 12;
export interface PurchaseTrendMonthPoint {
    month: string;
    label: string;
    total: number;
    orders_count: number;
}
export interface PurchaseTrendSeries {
    from: string;
    to: string;
    total: number;
    orders_count: number;
    months: PurchaseTrendMonthPoint[];
}
export interface PurchaseTrendRow {
    created_at: Date | string;
    total: number | string | null;
}
export declare function rollingPurchaseMonths(now?: Date, count?: number, timeZone?: string): Array<{
    month: string;
    label: string;
}>;
export declare function rollingWindowStart(now?: Date, count?: number, timeZone?: string): Date;
export declare function formatUtcDateTime(date: Date): string;
export declare function buildPurchaseTrend(rows: PurchaseTrendRow[], now?: Date, count?: number, timeZone?: string): PurchaseTrendSeries;
export declare function parseStoredDateTime(value: Date | string | null | undefined): Date | null;
