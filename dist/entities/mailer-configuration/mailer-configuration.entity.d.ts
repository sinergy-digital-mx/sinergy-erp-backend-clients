import { RBACTenant } from '../rbac/tenant.entity';
export type MailerConfigurationVendor = 'resend' | 'sendgrid' | 'aws_ses' | 'smtp';
export interface StoredMailerVendorConfig {
    [key: string]: unknown;
}
export declare class MailerConfiguration {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    name: string;
    vendor: MailerConfigurationVendor;
    vendor_config: StoredMailerVendorConfig;
    is_active: boolean;
    is_fallback: boolean;
    is_valid: boolean;
    created_at: Date;
    created_by: string;
    updated_at: Date;
    updated_by: string;
    deleted_at: Date | null;
    deleted_by: string | null;
    last_test_result: Record<string, unknown> | null;
    last_test_timestamp: Date | null;
    last_used_timestamp: Date | null;
}
