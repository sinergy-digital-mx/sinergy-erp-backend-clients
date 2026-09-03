import { RBACTenant } from '../rbac/tenant.entity';
import { BillingBranch } from '../billing/billing-branch.entity';
export declare class ControlDeskPosition {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    billing_branch: BillingBranch;
    billing_branch_id: string;
    code: string;
    name: string | null;
    row: number;
    col: number;
    sort_order: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
