import { RBACTenant } from '../rbac/tenant.entity';
import { SalesOrder } from '../sales-orders/sales-order.entity';
import { BillingBranch } from '../billing/billing-branch.entity';
import { ControlDeskPosition } from './control-desk-position.entity';
import { ControlDeskPickTask } from './control-desk-pick-task.entity';
import type { ControlDeskJobStatus } from './control-desk.constants';
export declare class ControlDeskJob {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    sales_order: SalesOrder;
    sales_order_id: string;
    billing_branch: BillingBranch;
    billing_branch_id: string;
    position: ControlDeskPosition | null;
    position_id: string | null;
    status: ControlDeskJobStatus;
    has_shortage: boolean;
    created_by: string;
    created_at: Date;
    updated_by: string;
    updated_at: Date;
    tasks: ControlDeskPickTask[];
}
