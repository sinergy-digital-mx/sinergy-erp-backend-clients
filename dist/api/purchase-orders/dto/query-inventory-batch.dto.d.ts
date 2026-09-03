export declare class QueryInventoryBatchDto {
    batch_number?: string;
    product_id?: string;
    warehouse_id?: string;
    purchase_order_batch_id?: string;
    created_from?: string;
    created_to?: string;
    page?: number;
    limit?: number;
    sort_by?: 'batch_number' | 'created_at' | 'quantity';
    sort_order?: 'ASC' | 'DESC';
}
