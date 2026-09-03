import { SelectQueryBuilder } from 'typeorm';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
export type InventoryLocationQuery = {
    fiscal_configuration_id?: string;
    billing_branch_id?: string;
    warehouse_id?: string;
};
export declare function assertInventoryLocationCascade(filters: InventoryLocationQuery): void;
export declare function joinInventoryLocation(qb: SelectQueryBuilder<InventoryBatch>, warehouseAlias?: string, options?: {
    select?: boolean;
}): SelectQueryBuilder<InventoryBatch>;
export declare function applyInventoryLocationFilters(qb: SelectQueryBuilder<InventoryBatch>, filters: InventoryLocationQuery, warehouseAlias?: string): void;
