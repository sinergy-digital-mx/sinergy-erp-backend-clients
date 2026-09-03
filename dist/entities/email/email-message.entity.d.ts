import { RBACTenant } from '../rbac/tenant.entity';
import { EmailThread } from './email-thread.entity';
export declare class EmailMessage {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    thread: EmailThread;
    thread_id: string;
    message_id: string;
    in_reply_to: string;
    from_email: string;
    to_email: string;
    cc: string;
    bcc: string;
    subject: string;
    body: string;
    body_html: string;
    direction: 'inbound' | 'outbound';
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'received';
    external_provider: string;
    external_id: string;
    created_at: Date;
    received_at: Date;
    read_at: Date;
}
