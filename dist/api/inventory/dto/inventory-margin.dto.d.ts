export declare class InventoryMarginDto {
    unit_price: string | null;
    price_list_name: string | null;
    unit_cost: string | null;
    margin_amount: string | null;
    margin_percentage: string | null;
    source: 'purchase' | 'configuration' | 'mixed' | 'none';
    source_label: string;
    hint: string;
    purchase_count: number;
    configuration_count: number;
    missing_count: number;
    cost_basis: string;
    purchase_folio: string | null;
}
export declare class InventoryMarginLineDto {
    label: string;
    detail: string | null;
    amount: string | null;
    currency: 'MXN' | 'USD' | null;
    included: boolean;
}
export declare class InventoryMarginGroupDto {
    title: string;
    note: string | null;
    lines: InventoryMarginLineDto[];
}
export declare class InventoryMarginExplanationDto {
    margin: InventoryMarginDto;
    headline: string;
    formula_sentence: string;
    price_note: string;
    cost_note: string;
    groups: InventoryMarginGroupDto[];
}
export declare class ProductMarginUomDto {
    uom_id: string;
    uom_name: string;
    margin_detail: InventoryMarginExplanationDto;
}
export declare class ProductMarginResponseDto {
    product_id: string;
    product_name: string;
    product_sku: string;
    uoms: ProductMarginUomDto[];
    empty_reason: string | null;
}
