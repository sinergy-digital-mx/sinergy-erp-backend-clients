import { RBACTenant } from '../rbac/tenant.entity';
import { User } from '../users/user.entity';
export declare class InventoryBranchReportSetting {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    visible_branch_ids: string[];
    updater: User | null;
    updated_by: string | null;
    created_at: Date;
    updated_at: Date;
}
