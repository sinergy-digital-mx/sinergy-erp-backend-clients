import { RBACTenant } from '../rbac/tenant.entity';
import { User } from '../users/user.entity';
export declare class SalesGoalsSettings {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    commission_rate: number;
    updater: User | null;
    updated_by: string | null;
    created_at: Date;
    updated_at: Date;
}
