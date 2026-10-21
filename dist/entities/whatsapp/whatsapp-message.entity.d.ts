import { RBACTenant } from '../rbac/tenant.entity';
export declare class WhatsappMessage {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    session_name: string;
    to_phone: string;
    chat_id: string | null;
    type: string;
    body: string | null;
    file_name: string | null;
    file_mimetype: string | null;
    status: string;
    error_message: string | null;
    waha_message_id: string | null;
    reference_type: string | null;
    reference_id: string | null;
    sent_at: Date | null;
    delivered_at: Date | null;
    read_at: Date | null;
    created_by: string;
    created_at: Date;
    updated_at: Date;
}
