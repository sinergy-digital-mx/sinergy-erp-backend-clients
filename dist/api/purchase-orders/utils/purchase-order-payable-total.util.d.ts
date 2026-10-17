export type PurchaseOrderPayableSource = {
    general_status?: string | null;
    payment_currency?: string | null;
    requested_total?: number | string | null;
    received_total?: number | string | null;
    customs_exchange_rate?: number | string | null;
    landed_merchandise_mxn?: number | string | null;
    landed_extras_mxn?: number | string | null;
    landed_invoice_extras_mxn?: number | string | null;
};
export declare function purchaseOrderHasPersistedRealCost(order: PurchaseOrderPayableSource): boolean;
export declare function catalogPurchaseOrderTotal(order: PurchaseOrderPayableSource): number;
export declare function resolvePurchaseOrderPayableTotal(order: PurchaseOrderPayableSource): number;
