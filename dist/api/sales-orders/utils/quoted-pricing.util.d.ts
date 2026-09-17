export type QuotedLineItemInput = {
    quantity: number | string;
    unit_price: number | string;
    discount_percentage?: number | string | null;
    discount_unit?: number | string | null;
    product_discount_id?: string | null;
};
export declare function quotedUnitPrice(value: number | string | null | undefined): number;
export declare function quotedLineDiscountAmounts(item: QuotedLineItemInput): {
    discount_percentage: number;
    discount_unit: number;
    line_discount: number;
    product_discount_id: string | null;
};
export declare function quotedGlobalDiscountAmount(value: number | string | null | undefined): number;
