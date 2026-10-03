import { DataSource, Repository } from 'typeorm';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import { InventoryStockLedgerService } from '../../inventory/services/inventory-stock-ledger.service';
import { InventoryStockLedgerValuationService } from '../../inventory/services/inventory-stock-ledger-valuation.service';
import { CorrectPurchaseReceiptDto } from '../dto/correct-purchase-receipt.dto';
import { PurchaseOrderActivityService } from './purchase-order-activity.service';
export declare class PurchaseOrderReversalService {
    private readonly orderRepo;
    private readonly detailRepo;
    private readonly dataSource;
    private readonly stockLedger;
    private readonly stockLedgerValuation;
    private readonly activityService;
    constructor(orderRepo: Repository<PurchaseOrderBatch>, detailRepo: Repository<PurchaseOrderBatchDetail>, dataSource: DataSource, stockLedger: InventoryStockLedgerService, stockLedgerValuation: InventoryStockLedgerValuationService, activityService: PurchaseOrderActivityService);
    cancel(id: string, tenantId: string, userId: string, reason?: string | null): Promise<void>;
    reopen(id: string, tenantId: string, userId: string): Promise<void>;
    correctReceipt(id: string, dto: CorrectPurchaseReceiptDto, tenantId: string, userId: string): Promise<void>;
    private exitReceivedInventory;
    private applyQuantityCorrection;
    private refreshReceivedTotals;
    private toLotStock;
    private lockPurchaseOrder;
    private lockPurchaseBatches;
    private purchaseNetByBatch;
    private fillProductLabels;
    private loadOrder;
}
