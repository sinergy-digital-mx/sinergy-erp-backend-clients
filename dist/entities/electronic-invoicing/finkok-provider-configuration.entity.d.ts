import { RBACTenant } from '../rbac/tenant.entity';
import { User } from '../users/user.entity';
export type FinkokEnvironment = 'demo' | 'production';
export declare class FinkokProviderConfiguration {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    finkok_username: string;
    finkok_username_encrypted: string;
    finkok_username_iv: string;
    finkok_password_encrypted: string;
    finkok_password_iv: string;
    environment: FinkokEnvironment;
    is_active: number;
    is_stamping_default: number;
    last_connection_test_at: Date | null;
    last_connection_test_status: string | null;
    creator: User;
    created_by: string | null;
    updater: User;
    updated_by: string | null;
    created_at: Date;
    updated_at: Date;
}
