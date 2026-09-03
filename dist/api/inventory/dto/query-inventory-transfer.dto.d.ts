export declare class QueryInventoryTransferDto {
    search?: string;
    product_id?: string;
    source_warehouse_id?: string;
    destination_warehouse_id?: string;
    source_billing_branch_id?: string;
    destination_billing_branch_id?: string;
    source_fiscal_configuration_id?: string;
    destination_fiscal_configuration_id?: string;
    created_from?: string;
    created_to?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
}
