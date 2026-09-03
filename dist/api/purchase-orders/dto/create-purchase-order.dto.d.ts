export declare class CreateLineItemDto {
    product_id: string;
    uom_id: string;
    quantity: number;
    unit_total: number;
    iva_percentage?: number;
    iva_unit?: number;
    ieps_percentage?: number;
    ieps_unit?: number;
    currency?: 'MXN' | 'USD';
}
export declare class CreatePurchaseOrderDto {
    fiscal_configuration_id: string;
    billing_branch_id?: string;
    warehouse_id: string;
    vendor_id: string;
    expected_delivery_date: string;
    payment_status?: string;
    payment_currency?: string;
    notes?: string;
    pedimento_number?: string | null;
    line_items: CreateLineItemDto[];
}
