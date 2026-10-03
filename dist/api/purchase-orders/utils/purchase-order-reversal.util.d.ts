export declare const PURCHASE_REVERSAL_QTY_EPSILON = 0.001;
export declare function roundPurchaseQty(value: unknown): number;
export type PurchaseLotStock = {
    batch_id: string;
    batch_number: string;
    product_label: string;
    initial_quantity: number;
    available_quantity: number;
    missing_quantity: number;
    transferred_from_batch_id?: string | null;
};
export declare function lotsBlockingFullExit(lots: PurchaseLotStock[]): PurchaseLotStock[];
export declare function formatBlockedLotsMessage(folio: string, lots: PurchaseLotStock[]): string;
export declare function isPurchaseLotAlreadyExited(available: number, purchaseNet: number): boolean;
