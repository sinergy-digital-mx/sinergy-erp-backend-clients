import { RBACTenant } from '../rbac/tenant.entity';
import { User } from '../users/user.entity';
import { PurchaseOrderBatch } from './purchase-order-batch.entity';
export type PurchaseOrderActivityChange = {
    field: string;
    field_label: string;
    from: string | null;
    to: string | null;
};
export declare class PurchaseOrderActivity {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    purchase_order_batch: PurchaseOrderBatch;
    purchase_order_batch_id: string;
    type: string;
    title: string;
    description: string | null;
    actor: User | null;
    actor_id: string | null;
    occurred_at: Date;
    changes: PurchaseOrderActivityChange[] | null;
    metadata: Record<string, unknown> | null;
    created_at: Date;
}
