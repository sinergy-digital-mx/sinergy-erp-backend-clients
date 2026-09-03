import { RBACTenant } from '../rbac/tenant.entity';
import { PurchaseOrderBatch } from './purchase-order-batch.entity';
import { User } from '../users/user.entity';
export declare class PurchaseOrderLandedCostLine {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    purchase_order_batch: PurchaseOrderBatch;
    purchase_order_batch_id: string;
    concept: string;
    amount: number;
    currency: 'MXN' | 'USD';
    sort_order: number;
    creator: User;
    created_by: string;
    updated_by: string | null;
    created_at: Date;
    updated_at: Date;
}
