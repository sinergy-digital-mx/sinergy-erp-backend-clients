export declare const DEFAULT_BRAND_NAV_COLORS: {
    readonly start: "#1e1b4b";
    readonly mid: "#312e81";
    readonly end: "#4c1d95";
};
export interface BrandNavColorColumns {
    brand_color_start?: string | null;
    brand_color_mid?: string | null;
    brand_color_end?: string | null;
    pos_sales_bar_color?: string | null;
    pos_cash_bar_color?: string | null;
}
export interface BrandNavMeta {
    cache_key: string;
    start: string;
    mid: string;
    end: string;
    pos_sales: string | null;
    pos_cash: string | null;
}
export declare function normalizeBrandHex(value: string | null | undefined, fallback: string): string;
export declare function resolveBrandNavMeta(row: BrandNavColorColumns | null | undefined): BrandNavMeta;
