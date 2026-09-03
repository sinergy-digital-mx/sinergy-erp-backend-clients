import { Repository } from 'typeorm';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import { InventoryTransferLine } from '../../../entities/inventory/inventory-transfer-line.entity';
import { User } from '../../../entities/users/user.entity';
import { PurchaseOrderLotNode, PurchaseOrderLotsSummary } from '../utils/purchase-order-lot-tree.util';
export declare class PurchaseOrderLotsService {
    private readonly transferLineRepository;
    private readonly userRepository;
    constructor(transferLineRepository: Repository<InventoryTransferLine>, userRepository: Repository<User>);
    buildTree(batches: InventoryBatch[] | undefined, lineItems: PurchaseOrderBatchDetail[] | undefined): Promise<{
        batches: PurchaseOrderLotNode[];
        summary: PurchaseOrderLotsSummary;
    }>;
}
