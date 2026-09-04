import { EntityManager } from 'typeorm';
export declare class InventoryStockLedgerValuationService {
    resolveFromBatchId(tenantId: string, batchId: string, manager: EntityManager): Promise<{
        unitCostMxn: number | null;
        unitSalePriceMxn: number | null;
    }>;
    mapFromImport(cost: number | null | undefined, price: number | null | undefined): {
        unitCostMxn: number | null;
        unitSalePriceMxn: number | null;
    };
    private mapRow;
}
