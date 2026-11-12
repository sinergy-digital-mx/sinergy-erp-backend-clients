import { RBACTenant } from '../rbac/tenant.entity';
import { User } from '../users/user.entity';
export declare class SalesOrderCreationSettings {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    fields: Record<string, unknown>;
    updater: User | null;
    updated_by: string | null;
    created_at: Date;
    updated_at: Date;
}
