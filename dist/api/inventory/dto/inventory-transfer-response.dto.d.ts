export declare class InventoryTransferLineResponseDto {
    id: string;
    source_inventory_batch_id: string;
    source_batch_number: string;
    destination_inventory_batch_id: string;
    destination_batch_number: string;
    quantity: string;
    created_at: Date;
}
export declare class InventoryTransferWarehouseSummaryDto {
    id: string;
    name: string;
    code: string | null;
    billing_branch_id: string | null;
    billing_branch_code: string | null;
    billing_branch_city: string | null;
    billing_branch_state: string | null;
    fiscal_configuration_id: string | null;
    fiscal_razon_social: string | null;
    fiscal_rfc: string | null;
}
export declare class InventoryTransferUserSummaryDto {
    id: string;
    name: string;
    email: string;
}
export declare class InventoryTransferResponseDto {
    id: string;
    folio: string;
    product_id: string;
    product_name: string;
    product_sku: string;
    uom_id: string;
    uom_name: string;
    source_warehouse: InventoryTransferWarehouseSummaryDto;
    destination_warehouse: InventoryTransferWarehouseSummaryDto;
    total_quantity: string;
    status: string;
    notes: string | null;
    created_by_user: InventoryTransferUserSummaryDto;
    created_at: Date;
    lines: InventoryTransferLineResponseDto[];
}
export declare class InventoryTransferListResponseDto {
    data: InventoryTransferResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
