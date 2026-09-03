export declare class QueryQuotationDto {
    search?: string;
    general_status?: string[];
    quotation_type?: 'POS' | 'MANUAL';
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
