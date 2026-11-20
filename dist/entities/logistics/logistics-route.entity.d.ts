import { RBACTenant } from '../rbac/tenant.entity';
export declare class LogisticsRoute {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
