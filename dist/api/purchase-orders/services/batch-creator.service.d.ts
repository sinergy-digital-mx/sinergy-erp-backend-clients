import { EntityManager, Repository } from 'typeorm';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { ReceivedItemDto } from '../dto/receive-purchase-order.dto';
import { BatchNumberGeneratorService } from './batch-number-generator.service';
export declare class BatchCreatorService {
    private readonly inventoryBatchRepository;
    private readonly batchNumberGeneratorService;
    private readonly logger;
    constructor(inventoryBatchRepository: Repository<InventoryBatch>, batchNumberGeneratorService: BatchNumberGeneratorService);
    createBatchForReceivedItem(receivedItem: ReceivedItemDto, purchaseOrder: PurchaseOrderBatch, purchaseOrderDetailId: string, userId: string, productUoms?: any[], sourceTagIdentifier?: string, manager?: EntityManager): Promise<InventoryBatch>;
}
