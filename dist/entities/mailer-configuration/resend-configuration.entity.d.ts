import { RBACTenant } from '../rbac/tenant.entity';
export declare class ResendConfiguration {
    id: string;
    tenant_id: string;
    tenant: RBACTenant;
    name: string;
    api_key_encrypted: string;
    api_key_iv: string;
    is_active: boolean;
    is_valid: boolean;
    created_at: Date;
    created_by: string;
    updated_at: Date;
    updated_by: string;
    deleted_at: Date | null;
    deleted_by: string | null;
    last_used_timestamp: Date | null;
}
