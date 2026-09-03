import { Repository } from 'typeorm';
import { PurchaseOrderActivity, PurchaseOrderActivityChange } from '../../../entities/purchase-orders/purchase-order-activity.entity';
import { PurchaseOrderMovementType } from '../constants/purchase-order-movements';
export type RecordPurchaseOrderActivityInput = {
    tenantId: string;
    purchaseOrderId: string;
    type: PurchaseOrderMovementType;
    actorId: string | null;
    description?: string | null;
    occurredAt?: Date;
    changes?: PurchaseOrderActivityChange[] | null;
    metadata?: Record<string, unknown> | null;
    title?: string;
};
export declare class PurchaseOrderActivityService {
    private readonly activityRepository;
    constructor(activityRepository: Repository<PurchaseOrderActivity>);
    record(input: RecordPurchaseOrderActivityInput): Promise<void>;
    listForOrder(purchaseOrderId: string, tenantId: string): Promise<PurchaseOrderActivity[]>;
}
