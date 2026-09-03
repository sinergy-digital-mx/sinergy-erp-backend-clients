import { RBACTenant } from '../rbac/tenant.entity';
import { PurchaseOrderBatch } from './purchase-order-batch.entity';
import { User } from '../users/user.entity';
export declare class PurchaseOrderPayment {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    purchase_order_batch: PurchaseOrderBatch;
    purchase_order_batch_id: string;
    payment_date: Date;
    amount: number;
    currency: string;
    payment_method: string;
    reference_number: string;
    notes: string;
    creator: User;
    created_by: string;
    created_at: Date;
}
