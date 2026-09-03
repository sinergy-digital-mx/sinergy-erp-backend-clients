import { RBACTenant } from '../rbac/tenant.entity';
import { UserStatus } from './user-status.entity';
import { BillingBranch } from '../billing/billing-branch.entity';
import { PosUserType } from './pos-user-type.enum';
export declare class User {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    status: UserStatus;
    email: string | null;
    password: string;
    first_name: string;
    last_name: string;
    phone: string;
    language_code: string;
    last_login_at: Date | null;
    permissions_version: number;
    billing_branch_id: string | null;
    billing_branch: BillingBranch | null;
    is_pos_user: boolean;
    pos_user_code: number | null;
    pos_user_type: PosUserType | null;
    is_employee: boolean;
    is_manager: boolean;
    created_at: Date;
    updated_at: Date;
}
