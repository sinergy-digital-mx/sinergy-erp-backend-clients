import { EntityManager, Repository } from 'typeorm';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { SalesOrderDetail } from '../../../entities/sales-orders/sales-order-detail.entity';
import { SalesOrderBatchAllocation } from '../../../entities/sales-orders/sales-order-batch-allocation.entity';
import { InventoryStockLedgerService } from '../../inventory/services/inventory-stock-ledger.service';
import { InventoryStockLedgerValuationService } from '../../inventory/services/inventory-stock-ledger-valuation.service';
export declare class SalesOrderFulfillmentService {
    private readonly batchRepo;
    private readonly stockLedger;
    private readonly stockLedgerValuation;
    private readonly logger;
    constructor(batchRepo: Repository<InventoryBatch>, stockLedger: InventoryStockLedgerService, stockLedgerValuation: InventoryStockLedgerValuationService);
    allocateFifo(detail: SalesOrderDetail, userId: string, manager: EntityManager, scope: {
        warehouseId?: string | null;
        billingBranchId?: string | null;
    }, quantityBase?: number): Promise<SalesOrderBatchAllocation[]>;
    releaseAllocations(allocations: SalesOrderBatchAllocation[], manager: EntityManager): Promise<void>;
    private resolveSalesOrder;
    private resolveSalesMetaFromAllocation;
}
