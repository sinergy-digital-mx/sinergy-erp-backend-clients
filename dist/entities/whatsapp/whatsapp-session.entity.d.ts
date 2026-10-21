import { RBACTenant } from '../rbac/tenant.entity';
export declare class WhatsappSession {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    session_name: string;
    status: string;
    phone_number: string | null;
    push_name: string | null;
    connected_at: Date | null;
    last_status_at: Date | null;
    last_error: string | null;
    created_by: string;
    updated_by: string;
    created_at: Date;
    updated_at: Date;
}
