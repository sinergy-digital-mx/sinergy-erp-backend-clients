import { InventoryBatchMovementDto } from './inventory-batch-movement.dto';
export declare class BatchTransferHistoryItemDto {
    transfer_id: string;
    transfer_folio: string;
    direction: 'out' | 'in';
    quantity: string;
    related_batch_id: string | null;
    related_batch_number: string | null;
    warehouse_name: string | null;
    created_at: Date;
}
export declare class BatchAuditHistoryItemDto {
    audit_id: string;
    audit_folio: string;
    system_quantity: string;
    counted_quantity: string | null;
    variance: string | null;
    quantity_before_post: string | null;
    quantity_after_post: string | null;
    reason: string | null;
    counted_by_name: string | null;
    authorized_by_name: string | null;
    authorized_at: Date | null;
}
export declare class MovementSummaryDto {
    total_movements: number;
    total_out: number;
    total_in: number;
    by_type: {
        orders: number;
        transfers_out: number;
        transfers_in: number;
        adjustments: number;
    };
}
export declare class BatchDetailResponseDto {
    id: string;
    batch_number: string;
    source_tag_identifier: string | null;
    measure: string | null;
    measure_uom_id: string | null;
    measure_uom_name: string | null;
    measure_label: string | null;
    product_id: string;
    product_name: string;
    product_sku: string;
    warehouse_id: string;
    warehouse_name: string;
    fiscal_configuration_id: string | null;
    razon_social: string | null;
    billing_branch_id: string | null;
    sucursal: string | null;
    purchase_order_id: string | null;
    purchase_order_batch_id: string | null;
    purchase_order_detail_id: string | null;
    purchase_order_folio: string | null;
    pedimento_number: string | null;
    payment_currency: string | null;
    unit_cost: number | null;
    real_unit_cost_usd: number | null;
    real_unit_cost_mxn: number | null;
    customs_exchange_rate: number | null;
    suggested_unit_price: number | null;
    suggested_price_currency: string | null;
    uom_id: string;
    uom_name: string;
    initial_quantity: string;
    available_quantity: string;
    quantity_consumed: string;
    availability_percentage: number;
    created_by: string;
    created_at: Date;
    transferred_from_batch_id: string | null;
    transferred_from_batch_number: string | null;
    transfer_history: BatchTransferHistoryItemDto[];
    audit_history: BatchAuditHistoryItemDto[];
    movements: InventoryBatchMovementDto[];
    movements_count: number;
    movement_summary: MovementSummaryDto;
    can_edit_tag: boolean;
    can_edit_measure: boolean;
    can_transfer: boolean;
}
