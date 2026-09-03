import { Repository } from 'typeorm';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { PurchaseOrderDocument } from '../../../entities/purchase-orders/purchase-order-document.entity';
import { PurchaseOrderPayment } from '../../../entities/purchase-orders/purchase-order-payment.entity';
import { InventoryTransferLine } from '../../../entities/inventory/inventory-transfer-line.entity';
import { InventoryAuditLine } from '../../../entities/inventory/inventory-audit-line.entity';
import { SalesOrderBatchAllocation } from '../../../entities/sales-orders/sales-order-batch-allocation.entity';
import { User } from '../../../entities/users/user.entity';
import { PurchaseOrderActivityService } from './purchase-order-activity.service';
import { PurchaseOrderMovementType } from '../constants/purchase-order-movements';
export type PurchaseOrderMovementChange = {
    field: string;
    field_label: string;
    from: string | null;
    to: string | null;
};
export type PurchaseOrderMovement = {
    id: string;
    occurred_at: Date;
    type: PurchaseOrderMovementType;
    type_label: string;
    title: string;
    description: string | null;
    actor_id: string | null;
    actor_name: string | null;
    changes: PurchaseOrderMovementChange[];
    metadata: Record<string, unknown>;
};
export declare class PurchaseOrderMovementsService {
    private readonly purchaseOrderRepository;
    private readonly inventoryBatchRepository;
    private readonly documentRepository;
    private readonly paymentRepository;
    private readonly transferLineRepository;
    private readonly auditLineRepository;
    private readonly allocationRepository;
    private readonly userRepository;
    private readonly activityService;
    constructor(purchaseOrderRepository: Repository<PurchaseOrderBatch>, inventoryBatchRepository: Repository<InventoryBatch>, documentRepository: Repository<PurchaseOrderDocument>, paymentRepository: Repository<PurchaseOrderPayment>, transferLineRepository: Repository<InventoryTransferLine>, auditLineRepository: Repository<InventoryAuditLine>, allocationRepository: Repository<SalesOrderBatchAllocation>, userRepository: Repository<User>, activityService: PurchaseOrderActivityService);
    list(orderId: string, tenantId: string): Promise<{
        data: PurchaseOrderMovement[];
        total: number;
    }>;
    private fromActivity;
    private movement;
}
