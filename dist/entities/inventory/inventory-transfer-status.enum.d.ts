export declare enum InventoryTransferStatus {
    PENDING = "pending",
    IN_TRANSIT = "in_transit",
    RECEIVED = "received",
    RECEIVED_WITH_DIFFERENCE = "received_with_difference",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare const OPEN_TRANSFER_STATUSES: InventoryTransferStatus[];
export declare const RECEIVED_TRANSFER_STATUSES: InventoryTransferStatus[];
