import { EntityManager, Repository } from 'typeorm';
import { InventoryStockLedger } from '../../../entities/inventory/inventory-stock-ledger.entity';
import { InventoryStockLedgerMovementType } from '../../../entities/inventory/inventory-stock-ledger-movement-type.enum';
export declare const STOCK_LEDGER_REFERENCE: {
    readonly PURCHASE_ORDER: "purchase_order";
    readonly SALES_ORDER: "sales_order";
    readonly INVENTORY_TRANSFER: "inventory_transfer";
    readonly INVENTORY_AUDIT: "inventory_audit";
    readonly INVENTORY_BATCH: "inventory_batch";
};
export type AppendStockLedgerParams = {
    tenantId: string;
    productId: string;
    warehouseId: string;
    uomId: string;
    inventoryBatchId?: string | null;
    movementType: InventoryStockLedgerMovementType;
    quantityDelta: number;
    occurredAt?: Date;
    referenceType?: string | null;
    referenceId?: string | null;
    referenceFolio?: string | null;
    createdBy?: string | null;
    notes?: string | null;
};
export declare class InventoryStockLedgerService {
    private readonly ledgerRepo;
    constructor(ledgerRepo: Repository<InventoryStockLedger>);
    append(params: AppendStockLedgerParams, manager?: EntityManager): Promise<InventoryStockLedger | null>;
    getLastBalance(key: {
        tenantId: string;
        productId: string;
        warehouseId: string;
        uomId: string;
    }, manager?: EntityManager): Promise<number>;
    countForTenant(tenantId: string, manager?: EntityManager): Promise<number>;
}
