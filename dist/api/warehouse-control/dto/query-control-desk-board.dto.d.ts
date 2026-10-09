export declare class QueryControlDeskBoardDto {
    search?: string;
    billing_branch_id?: string;
    warehouse_id?: string;
    status?: string;
    stage?: 'queue' | 'picking' | 'assembling' | 'assembled' | 'today';
    view?: 'admin' | 'warehouse';
    page?: number;
    limit?: number;
}
