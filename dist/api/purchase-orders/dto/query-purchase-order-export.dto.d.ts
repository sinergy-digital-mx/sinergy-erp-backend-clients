export declare class QueryPurchaseOrderHeaderExportDto {
    search?: string;
    general_status?: string;
    payment_status?: string;
    vendor_id?: string;
    fiscal_configuration_id?: string;
    billing_branch_id?: string;
    warehouse_id?: string;
    created_from?: string;
    created_to?: string;
}
export declare class QueryPurchaseOrderDetailExportDto extends QueryPurchaseOrderHeaderExportDto {
    created_from: string;
    created_to: string;
}
