import { RBACTenant } from '../rbac/tenant.entity';
export declare class PriceList {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    name: string;
    description: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
