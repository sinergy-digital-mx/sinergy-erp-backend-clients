export declare class CreateSalesOrderLineItemDto {
    product_id: string;
    product_uom_id: string;
    quantity: number;
    unit_price: number;
    discount_percentage?: number;
    product_discount_id?: string;
    iva_percentage?: number;
    ieps_percentage?: number;
}
export declare class CreateSalesOrderDto {
    fiscal_configuration_id: string;
    billing_branch_id?: string;
    warehouse_id?: string;
    customer_id?: number;
    expected_delivery_date: string;
    sales_order_type?: 'POS' | 'MANUAL';
    seller_user_id?: string;
    assigned_seller_user_id?: string;
    pos_daily_shift_id?: string;
    fiscal_razon_social?: string;
    payment_status?: string;
    notes?: string;
    requires_selection_assembly?: boolean;
    global_discount_id?: string;
    line_items: CreateSalesOrderLineItemDto[];
}
