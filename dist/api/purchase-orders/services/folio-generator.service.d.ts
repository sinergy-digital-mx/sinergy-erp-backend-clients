import { Repository } from 'typeorm';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
export declare class FolioGeneratorService {
    private readonly purchaseOrderBatchRepository;
    constructor(purchaseOrderBatchRepository: Repository<PurchaseOrderBatch>);
    generateFolio(tenantId: string): Promise<string>;
}
