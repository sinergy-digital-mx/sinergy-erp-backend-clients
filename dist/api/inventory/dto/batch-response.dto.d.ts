export declare class BatchResponseDto {
    id: string;
    batch_number: string;
    source_tag_identifier: string | null;
    measure: string | null;
    measure_uom_id: string | null;
    measure_uom_name: string | null;
    measure_label: string | null;
    warehouse_id: string;
    warehouse_name?: string;
    fiscal_configuration_id?: string | null;
    razon_social?: string | null;
    billing_branch_id?: string | null;
    sucursal?: string | null;
    product_id: string;
    product_name?: string;
    product_sku?: string;
    uom_id: string;
    uom_name?: string;
    quantity: string;
    purchase_order_batch_id?: string;
    purchase_order_id?: string;
    purchase_order_detail_id?: string;
    purchase_order_folio?: string;
    created_by: string;
    created_at: Date;
}
