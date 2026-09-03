import { EntityManager, Repository } from 'typeorm';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import { PurchaseOrderLandedCostLine } from '../../../entities/purchase-orders/purchase-order-landed-cost-line.entity';
import { UpdatePurchaseOrderRealCostDto } from '../dto/update-purchase-order-real-cost.dto';
import { PurchaseOrderActivityService } from './purchase-order-activity.service';
import { ComputeRealCostResult } from '../utils/purchase-order-real-cost.util';
export declare class PurchaseOrderRealCostService {
    private readonly purchaseOrderRepo;
    private readonly lineRepo;
    private readonly extraRepo;
    private readonly activityService;
    constructor(purchaseOrderRepo: Repository<PurchaseOrderBatch>, lineRepo: Repository<PurchaseOrderBatchDetail>, extraRepo: Repository<PurchaseOrderLandedCostLine>, activityService: PurchaseOrderActivityService);
    updateRealCost(id: string, dto: UpdatePurchaseOrderRealCostDto, tenantId: string, userId: string): Promise<void>;
    recalculateIfEnabled(tenantId: string, purchaseOrderId: string, manager?: EntityManager): Promise<ComputeRealCostResult | null>;
    private recordActivity;
}
