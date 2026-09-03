export declare class CreateQuotationLineItemDto {
    product_id: string;
    product_uom_id: string;
    quantity: number;
    unit_price: number;
    discount_percentage?: number;
    product_discount_id?: string;
    iva_percentage?: number;
    ieps_percentage?: number;
}
export declare class CreateQuotationDto {
    fiscal_configuration_id: string;
    billing_branch_id?: string;
    warehouse_id?: string;
    customer_id?: number;
    expected_delivery_date: string;
    quotation_type?: 'POS' | 'MANUAL';
    seller_user_id?: string;
    assigned_seller_user_id?: string;
    fiscal_razon_social?: string;
    notes?: string;
    global_discount_id?: string;
    line_items: CreateQuotationLineItemDto[];
}
