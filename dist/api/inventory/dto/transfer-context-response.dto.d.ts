import { InventoryLocationFiscalDto } from './inventory-location-tree-response.dto';
export declare class TransferContextBatchDto {
    batch_id: string;
    batch_number: string;
    source_tag_identifier: string | null;
    measure: string | null;
    measure_uom_id: string | null;
    measure_uom_name: string | null;
    measure_label: string | null;
    available_quantity: string;
    initial_quantity: string;
    purchase_order_folio: string | null;
    created_at: Date;
}
export declare class TransferContextFiscalDto {
    id: string;
    razon_social: string;
    rfc: string;
}
export declare class TransferContextBranchDto {
    id: string;
    code: string;
    city: string;
    state: string;
    fiscal_configuration: TransferContextFiscalDto | null;
}
export declare class TransferContextWarehouseDto {
    id: string;
    name: string;
    code: string | null;
    billing_branch_id: string | null;
    billing_branch: TransferContextBranchDto | null;
}
export declare class TransferContextResponseDto {
    product_id: string;
    product_name: string;
    product_sku: string;
    uom_id: string;
    uom_name: string;
    total_available_quantity: string;
    total_batches: number;
    source_warehouse: TransferContextWarehouseDto;
    destinations: InventoryLocationFiscalDto[];
    batches: TransferContextBatchDto[];
}
