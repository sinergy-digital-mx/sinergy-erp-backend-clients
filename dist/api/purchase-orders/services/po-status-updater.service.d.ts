import { Repository } from 'typeorm';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
export declare class POStatusUpdaterService {
    private readonly purchaseOrderRepository;
    constructor(purchaseOrderRepository: Repository<PurchaseOrderBatch>);
    updatePOStatusToRecibida(purchaseOrderId: string, userId: string): Promise<void>;
}
