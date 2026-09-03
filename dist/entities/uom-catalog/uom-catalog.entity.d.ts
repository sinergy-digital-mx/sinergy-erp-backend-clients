import { RBACTenant } from '../rbac/tenant.entity';
export declare class UoMCatalog {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    name: string;
    description: string;
    created_at: Date;
    updated_at: Date;
}
