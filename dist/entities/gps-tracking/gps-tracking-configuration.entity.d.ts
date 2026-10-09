import { RBACTenant } from '../rbac/tenant.entity';
export declare class GpsTrackingConfiguration {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    name: string;
    username: string;
    encrypted_password: string;
    password_iv: string;
    is_active: boolean;
    is_valid: boolean;
    last_test_result: Record<string, unknown> | null;
    last_test_at: Date | null;
    created_by: string;
    updated_by: string;
    created_at: Date;
    updated_at: Date;
}
