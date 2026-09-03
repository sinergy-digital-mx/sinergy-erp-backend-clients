import { InventoryAuditStatus } from '../../../entities/inventory/inventory-audit-status.enum';
export declare class InventoryAuditUserSummaryDto {
    id: string;
    name: string;
    email: string;
}
export declare class InventoryAuditWarehouseSummaryDto {
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
export declare class InventoryAuditLineResponseDto {
    id: string;
    inventory_batch_id: string;
    batch_number: string;
    source_tag_identifier: string | null;
    measure: string | null;
    measure_uom_id: string | null;
    measure_uom_name: string | null;
    measure_label: string | null;
    product_id: string;
    product_name: string;
    product_sku: string;
    uom_id: string;
    uom_name: string;
    system_quantity: string;
    counted_quantity: string | null;
    variance: string | null;
    reason: string | null;
    is_additional: boolean;
    counted_by_user: InventoryAuditUserSummaryDto | null;
    counted_at: Date | null;
    quantity_before_post: string | null;
    quantity_after_post: string | null;
    stock_moved_during_count: boolean;
    created_at: Date;
}
export declare class InventoryAuditTotalsDto {
    total_lines: number;
    counted_lines: number;
    pending_lines: number;
    lines_with_variance: number;
    total_system_quantity: string;
    total_counted_quantity: string | null;
    total_variance: string | null;
}
export declare class InventoryAuditResponseDto {
    id: string;
    folio: string;
    status: InventoryAuditStatus;
    warehouse: InventoryAuditWarehouseSummaryDto;
    product_id: string | null;
    product_name: string | null;
    product_sku: string | null;
    include_empty_lots: boolean;
    notes: string | null;
    created_by_user: InventoryAuditUserSummaryDto;
    created_at: Date;
    submitted_by_user: InventoryAuditUserSummaryDto | null;
    submitted_at: Date | null;
    authorized_by_user: InventoryAuditUserSummaryDto | null;
    authorized_at: Date | null;
    rejected_by_user: InventoryAuditUserSummaryDto | null;
    rejected_at: Date | null;
    rejection_reason: string | null;
    cancelled_by_user: InventoryAuditUserSummaryDto | null;
    cancelled_at: Date | null;
    cancellation_reason: string | null;
    totals: InventoryAuditTotalsDto;
    lines: InventoryAuditLineResponseDto[];
}
export declare class InventoryAuditListResponseDto {
    data: InventoryAuditResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare class InventoryAuditContextBatchDto {
    batch_id: string;
    batch_number: string;
    source_tag_identifier: string | null;
    measure: string | null;
    measure_uom_id: string | null;
    measure_uom_name: string | null;
    measure_label: string | null;
    product_id: string;
    product_name: string;
    product_sku: string;
    uom_id: string;
    uom_name: string;
    available_quantity: string;
    initial_quantity: string;
    purchase_order_folio: string | null;
    created_at: Date;
}
export declare class InventoryAuditContextResponseDto {
    warehouse: InventoryAuditWarehouseSummaryDto;
    total_batches: number;
    total_available_quantity: string;
    open_audit_id: string | null;
    open_audit_folio: string | null;
    batches: InventoryAuditContextBatchDto[];
}
