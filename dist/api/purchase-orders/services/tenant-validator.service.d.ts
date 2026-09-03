import { Repository } from 'typeorm';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
export declare class TenantValidatorService {
    private readonly purchaseOrderRepository;
    private readonly inventoryBatchRepository;
    constructor(purchaseOrderRepository: Repository<PurchaseOrderBatch>, inventoryBatchRepository: Repository<InventoryBatch>);
    validatePOBelongsToTenant(purchaseOrderId: string, tenantId: string): Promise<void>;
    verifyBatchNumberUniquenessWithinTenant(batchNumber: string, tenantId: string): Promise<void>;
}
