export declare class PropertyPricingError extends Error {
    constructor(message: string);
}
export declare function roundMoney(value: number): number;
export declare function derivePricePerM2(totalPrice: number | null | undefined, totalArea: number | null | undefined): number | null;
export declare function resolvePropertyPricing(params: {
    totalArea?: number | null;
    totalPrice?: number | null;
    pricePerM2?: number | null;
    existingTotalPrice?: number | null;
    existingPricePerM2?: number | null;
    isCreate?: boolean;
}): {
    total_price: number;
    price_per_m2: number | null;
};
