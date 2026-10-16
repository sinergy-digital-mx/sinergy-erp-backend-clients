export declare class ReceiveInventoryTransferLineDto {
    id: string;
    quantity_received: number;
}
export declare class ReceiveInventoryTransferDto {
    lines: ReceiveInventoryTransferLineDto[];
    notes?: string;
}
