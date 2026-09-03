export declare class PurchaseOrderExtraCostDto {
    concept: string;
    amount: number;
    currency: 'MXN' | 'USD';
}
export declare class PurchaseOrderRealCostLineIgiDto {
    line_item_id: string;
    igi_percentage: number;
}
export declare class UpdatePurchaseOrderRealCostDto {
    customs_date?: string | null;
    customs_exchange_rate?: number | null;
    extra_costs?: PurchaseOrderExtraCostDto[];
    line_items?: PurchaseOrderRealCostLineIgiDto[];
}
