export declare const INVENTORY_BATCH_MOVEMENT_TYPES: {
    readonly CREATED: "created";
    readonly PURCHASE_RECEIVED: "purchase_received";
    readonly IMPORTED: "imported";
    readonly TRANSFER_IN: "transfer_in";
    readonly TRANSFER_OUT: "transfer_out";
    readonly STOCK_SOLD: "stock_sold";
    readonly INVENTORY_ADJUSTED: "inventory_adjusted";
};
export type InventoryBatchMovementType = (typeof INVENTORY_BATCH_MOVEMENT_TYPES)[keyof typeof INVENTORY_BATCH_MOVEMENT_TYPES];
export declare const INVENTORY_BATCH_MOVEMENT_TYPE_LABELS: Record<InventoryBatchMovementType, string>;
