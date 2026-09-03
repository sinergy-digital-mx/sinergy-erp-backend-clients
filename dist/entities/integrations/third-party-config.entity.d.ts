import { RBACTenant } from '../rbac/tenant.entity';
export declare class ThirdPartyConfig {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    provider: string;
    name: string;
    encrypted_api_key: string;
    encrypted_api_secret: string | null;
    encrypted_webhook_secret: string | null;
    metadata: Record<string, any>;
    is_enabled: boolean;
    last_tested_at: Date;
    is_test_mode: boolean;
    created_at: Date;
    updated_at: Date;
    created_by: string;
    updated_by: string;
}
