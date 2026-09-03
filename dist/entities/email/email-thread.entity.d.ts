import { RBACTenant } from '../rbac/tenant.entity';
import { User } from '../users/user.entity';
import { Lead } from '../leads/lead.entity';
import { EmailMessage } from './email-message.entity';
import { EntityRegistry } from '../entity-registry/entity-registry.entity';
export declare class EmailThread {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    entityType: EntityRegistry;
    entity_type_id: number;
    entity_id: string;
    get entity_type(): string | null;
    lead: Lead;
    lead_id: number;
    subject: string;
    email_from: string;
    email_to: string;
    status: 'draft' | 'sent' | 'replied' | 'closed' | 'archived';
    last_message_at: Date | null;
    message_count: number;
    is_read: boolean;
    createdByUser: User;
    created_by: string;
    created_at: Date;
    updated_at: Date;
    messages: EmailMessage[];
}
