import { RBACTenant } from '../rbac/tenant.entity';
import { User } from '../users/user.entity';
export declare class CustomerListSettings {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    prefilter: string;
    updater: User | null;
    updated_by: string | null;
    created_at: Date;
    updated_at: Date;
}
