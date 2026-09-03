export declare class CreateInventoryTransferLineDto {
    inventory_batch_id: string;
    quantity: number;
}
export declare class CreateInventoryTransferDto {
    product_id: string;
    uom_id: string;
    source_warehouse_id: string;
    destination_warehouse_id: string;
    notes?: string;
    lines: CreateInventoryTransferLineDto[];
}
