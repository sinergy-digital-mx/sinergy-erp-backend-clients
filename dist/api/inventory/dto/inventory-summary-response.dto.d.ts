export declare class BatchBreakdownDto {
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
export declare class MeasureTotalDto {
    measure: string | null;
    measure_uom_id: string | null;
    measure_uom_name: string | null;
    measure_label: string | null;
    total_available_quantity: string;
    total_initial_quantity: string;
    total_batches: number;
}
export declare class ProductInventorySummaryDto {
    product_id: string;
    product_name: string;
    product_sku: string;
    product_photo: string | null;
    warehouse_id: string;
    warehouse_name: string;
    fiscal_configuration_id: string | null;
    razon_social: string | null;
    billing_branch_id: string | null;
    sucursal: string | null;
    uom_id: string;
    uom_name: string;
    suggested_unit_price: string | null;
    suggested_iva_percentage: string | null;
    suggested_ieps_percentage: string | null;
    pricing_options: Array<{
        price_list_id: string;
        price_list_name: string;
        price: string;
        iva_percentage: string;
        ieps_percentage: string;
        total: string;
    }>;
    total_available_quantity: string;
    total_initial_quantity: string;
    total_batches: number;
    measure_totals: MeasureTotalDto[];
    batches: BatchBreakdownDto[];
}
export declare class InventorySummaryResponseDto {
    data: ProductInventorySummaryDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
