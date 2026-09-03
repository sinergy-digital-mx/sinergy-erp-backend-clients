import { InventoryAuditStatus } from '../../../entities/inventory/inventory-audit-status.enum';
export declare class QueryInventoryAuditDto {
    search?: string;
    warehouse_id?: string;
    billing_branch_id?: string;
    fiscal_configuration_id?: string;
    product_id?: string;
    status?: InventoryAuditStatus;
    created_from?: string;
    created_to?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
}
