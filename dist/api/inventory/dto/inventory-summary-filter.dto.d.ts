export declare class InventorySummaryFilterDto {
    search?: string;
    fiscal_configuration_id?: string;
    billing_branch_id?: string;
    warehouse_id?: string;
    product_id?: string;
    only_available?: boolean;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
}
