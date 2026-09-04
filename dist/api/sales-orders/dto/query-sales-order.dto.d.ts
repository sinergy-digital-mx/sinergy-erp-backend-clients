export declare class QuerySalesOrderDto {
    search?: string;
    general_status?: string[];
    payment_status?: string;
    is_credit?: boolean;
    sales_order_type?: 'POS' | 'MANUAL';
    sale_scope?: 'inventory' | 'services' | 'combined';
    collection_channel?: 'pos_cobranza' | 'manual' | 'mixed';
    fiscal_configuration_id?: string;
    billing_branch_id?: string;
    customer_id?: number;
    created_from?: string;
    created_to?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
}
