import { EntityManager, Repository } from 'typeorm';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { ReceivedItemDto } from '../dto/receive-purchase-order.dto';
import { BatchNumberGeneratorService } from './batch-number-generator.service';
import { InventoryStockLedgerService } from '../../inventory/services/inventory-stock-ledger.service';
import { InventoryStockLedgerValuationService } from '../../inventory/services/inventory-stock-ledger-valuation.service';
export declare class BatchCreatorService {
    private readonly inventoryBatchRepository;
    private readonly batchNumberGeneratorService;
    private readonly stockLedger;
    private readonly stockLedgerValuation;
    private readonly logger;
    constructor(inventoryBatchRepository: Repository<InventoryBatch>, batchNumberGeneratorService: BatchNumberGeneratorService, stockLedger: InventoryStockLedgerService, stockLedgerValuation: InventoryStockLedgerValuationService);
    createBatchForReceivedItem(receivedItem: ReceivedItemDto, purchaseOrder: PurchaseOrderBatch, purchaseOrderDetailId: string, userId: string, productUoms?: any[], sourceTagIdentifier?: string, manager?: EntityManager): Promise<InventoryBatch>;
}
