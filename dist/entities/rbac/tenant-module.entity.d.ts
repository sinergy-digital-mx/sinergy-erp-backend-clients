import { RBACTenant } from './tenant.entity';
import { Module } from './module.entity';
export declare class TenantModule {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    module: Module;
    module_id: string;
    is_enabled: boolean;
    created_at: Date;
}
