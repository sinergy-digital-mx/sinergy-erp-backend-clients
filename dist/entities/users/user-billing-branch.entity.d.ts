import { RBACTenant } from '../rbac/tenant.entity';
import { User } from './user.entity';
import { BillingBranch } from '../billing/billing-branch.entity';
export declare class UserBillingBranch {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    user: User;
    user_id: string;
    billing_branch: BillingBranch;
    billing_branch_id: string;
    is_primary: boolean;
    created_at: Date;
}
