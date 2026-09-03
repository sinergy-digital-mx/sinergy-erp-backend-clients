import { RBACTenant } from '../rbac/tenant.entity';
export declare class DocumentType {
    id: string;
    tenant: RBACTenant;
    tenant_id: string | null;
    code: string;
    name: string;
    description: string;
    is_active: boolean;
    is_required: boolean;
    metadata: Record<string, any>;
    created_at: Date;
}
