export declare class ShippingOrderItemDto {
    sales_order_id: string;
    stop_sequence: number;
    customer_address_id?: number;
}
export declare class CreateShippingDto {
    shipping_date: string;
    driver_id: string;
    truck_id: string;
    billing_branch_id: string;
    notes?: string;
    orders: ShippingOrderItemDto[];
}
export declare class PreviewShippingDto {
    billing_branch_id: string;
    orders: ShippingOrderItemDto[];
}
export declare class AddShippingStopsDto {
    orders: ShippingOrderItemDto[];
}
export declare class UpdateShippingStatusDto {
    status: string;
}
export declare class ResolveOrdersDto {
    sales_order_ids: string[];
}
export declare class QueryShippingDto {
    page?: number;
    limit?: number;
    status?: string;
    driver_id?: string;
    truck_id?: string;
    billing_branch_id?: string;
    origin_warehouse_id?: string;
    date_from?: string;
    date_to?: string;
}
export declare class QueryAvailableShippingOrdersDto {
    billing_branch_id: string;
    fiscal_configuration_id?: string;
    search?: string;
    page?: number;
    limit?: number;
}
