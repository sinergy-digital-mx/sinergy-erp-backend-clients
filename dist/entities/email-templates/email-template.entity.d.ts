import { RBACTenant } from '../rbac/tenant.entity';
export type EmailTemplateVariableType = 'string' | 'number' | 'date' | 'currency' | 'boolean';
export interface EmailTemplateCustomVariable {
    key: string;
    label: string;
    type: EmailTemplateVariableType;
    required?: boolean;
    defaultValue?: string | number | boolean | null;
}
export declare class EmailTemplate {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    name: string;
    subject: string;
    body_html: string;
    variables: string[] | null;
    custom_variables: EmailTemplateCustomVariable[] | null;
    is_active: boolean;
    created_by: string | null;
    updated_by: string | null;
    deleted_at: Date | null;
    deleted_by: string | null;
    created_at: Date;
    updated_at: Date;
}
