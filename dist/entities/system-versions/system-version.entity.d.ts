import { RBACTenant } from '../rbac/tenant.entity';
export interface SystemVersionChange {
    scope: 'frontend' | 'backend';
    message: string;
}
export declare class SystemVersion {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    release_key: string;
    version: string;
    build_id: string | null;
    channel: 'frontend' | 'backend' | 'full';
    title: string;
    changes: SystemVersionChange[];
    released_at: Date;
    created_at: Date;
    updated_at: Date;
}
