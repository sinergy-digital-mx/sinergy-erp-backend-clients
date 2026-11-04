export declare const STOCK_REPLENISHMENT_FORMULA = "La venta diaria es la venta del periodo dividida entre sus d\u00EDas. Si el periodo anterior vendi\u00F3 distinto, esa venta diaria se ajusta entre 75% y 150%. El m\u00EDnimo es la venta diaria ajustada por los d\u00EDas de seguridad (25% de los d\u00EDas a cubrir). El m\u00E1ximo es la venta diaria ajustada por los d\u00EDas a cubrir. Se recomienda comprar m\u00E1ximo menos existencia cuando hubo ventas y la existencia est\u00E1 debajo del m\u00E1ximo. Si no hubo ventas, no se recomienda comprar.";
export type SalesTrend = 'up' | 'down' | 'flat' | 'none';
export type ReplenishmentStatus = 'no_movement' | 'out' | 'reorder' | 'fill' | 'healthy' | 'overstock';
export type AveragePriceSource = 'sales' | 'list' | 'none';
export interface ReplenishmentInput {
    onHand: number;
    soldQty: number;
    previousSoldQty: number;
    periodDays: number;
    coverDays: number;
    averagePrice: number | null;
    unitCost: number | null;
}
export interface ReplenishmentPlan {
    dailyRate: number;
    trend: SalesTrend;
    trendFactor: number;
    adjustedDaily: number;
    safetyDays: number;
    minStock: number;
    maxStock: number;
    daysOfCover: number | null;
    recommendedQty: number;
    unitMargin: number | null;
    marginPercent: number | null;
    status: ReplenishmentStatus;
}
export declare function roundQtyUp(value: number): number;
export declare function roundMoney(value: number, scale?: number): number;
export declare function safetyDaysFor(coverDays: number): number;
export declare function stockDifference(onHand: number, soldQty: number): number;
export declare function trendOf(currentSold: number, previousSold: number): {
    trend: SalesTrend;
    factor: number;
};
export declare function toCostMxn(cost: number | null, currency: string | null | undefined, exchangeRate: number | null): number | null;
export declare function resolveAveragePrice(soldQty: number, soldAmount: number, listPrice: number | null): {
    price: number | null;
    source: AveragePriceSource;
};
export declare function buildReplenishmentPlan(input: ReplenishmentInput): ReplenishmentPlan;
export declare function needsTransferHint(branchSoldExceedsStock: boolean, recommendedQty: number, onHand: number, soldQty: number): boolean;
