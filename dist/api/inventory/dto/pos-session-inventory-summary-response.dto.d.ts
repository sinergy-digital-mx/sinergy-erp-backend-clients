import { ProductDiscountType } from '../../../entities/products/product-discount.entity';
export declare class PosSessionApplicableDiscountDto {
    id: string;
    name: string;
    discount_type: ProductDiscountType;
    value: number;
    product_uom_id: string | null;
}
export declare class PosSessionBatchBreakdownDto {
    batch_id: string;
    batch_number: string;
    source_tag_identifier: string | null;
    measure: string | null;
    measure_uom_id: string | null;
    measure_uom_name: string | null;
    measure_label: string | null;
    warehouse_id: string;
    warehouse_name: string;
    available_quantity: string;
    initial_quantity: string;
    purchase_order_folio: string | null;
    created_at: Date;
}
export declare class PosSessionProductInventorySummaryDto {
    product_id: string;
    product_name: string;
    product_sku: string;
    product_description?: string | null;
    sat_clave?: string | null;
    item_kind?: 'goods' | 'service';
    product_photo: string | null;
    uom_id: string;
    uom_name: string;
    warehouse_ids: string[];
    warehouse_names: string[];
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
    product_uom_id: string;
    has_applicable_discounts: boolean;
    applicable_discounts: PosSessionApplicableDiscountDto[];
    total_available_quantity: string | null;
    total_initial_quantity: string | null;
    total_batches: number;
    measure_totals: Array<{
        measure: string | null;
        measure_uom_id: string | null;
        measure_uom_name: string | null;
        measure_label: string | null;
        total_available_quantity: string;
        total_initial_quantity: string;
        total_batches: number;
    }>;
    batches: PosSessionBatchBreakdownDto[];
}
export declare class PosSessionWarehouseDto {
    id: string;
    name: string;
    status: string;
}
export declare class PosSessionInventorySummaryResponseDto {
    billing_branch_id: string;
    fiscal_configuration_id: string | null;
    warehouses: PosSessionWarehouseDto[];
    applied_warehouse_id: string | null;
    data: PosSessionProductInventorySummaryDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
