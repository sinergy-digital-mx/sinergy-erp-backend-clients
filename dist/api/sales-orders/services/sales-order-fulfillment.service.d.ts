import { EntityManager, Repository } from 'typeorm';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { SalesOrderDetail } from '../../../entities/sales-orders/sales-order-detail.entity';
import { SalesOrderBatchAllocation } from '../../../entities/sales-orders/sales-order-batch-allocation.entity';
export declare class SalesOrderFulfillmentService {
    private readonly batchRepo;
    private readonly logger;
    constructor(batchRepo: Repository<InventoryBatch>);
    allocateFifo(detail: SalesOrderDetail, userId: string, manager: EntityManager, scope: {
        warehouseId?: string | null;
        billingBranchId?: string | null;
    }, quantityBase?: number): Promise<SalesOrderBatchAllocation[]>;
    releaseAllocations(allocations: SalesOrderBatchAllocation[], manager: EntityManager): Promise<void>;
}
