export declare function meanCost(costs: Array<number | null | undefined>): number | null;
export declare function priceFromMargin(averageCost: number, marginPercent: number, uomFactor: number, baseFactor: number): number;
export declare function priceListLabel(listNumber: number | null, name: string): string;
export declare function isManualPrice(price: number | null, calculated: number | null): boolean;
