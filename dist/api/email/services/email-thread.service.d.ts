import { Repository } from 'typeorm';
import { EmailThread } from '../../../entities/email/email-thread.entity';
import { EmailMessage } from '../../../entities/email/email-message.entity';
import { Lead } from '../../../entities/leads/lead.entity';
import { EntityRegistry } from '../../../entities/entity-registry/entity-registry.entity';
export declare class EmailThreadService {
    private threadRepo;
    private messageRepo;
    private leadRepo;
    private entityRegistryRepo;
    constructor(threadRepo: Repository<EmailThread>, messageRepo: Repository<EmailMessage>, leadRepo: Repository<Lead>, entityRegistryRepo: Repository<EntityRegistry>);
    private resolveEntityTypeId;
    createThread(tenantId: string, entityTypeId: number, entityId: string, emailTo: string, subject: string, body: string, userId: string): Promise<{
        thread: EmailThread;
        message: EmailMessage;
    }>;
    getThreadsByEntity(tenantId: string, entityTypeId: number, entityId: string): Promise<EmailThread[]>;
    getThreadDetails(tenantId: string, threadId: string): Promise<EmailThread>;
    updateThreadStatus(tenantId: string, threadId: string, status: 'draft' | 'sent' | 'replied' | 'closed' | 'archived'): Promise<EmailThread>;
    markThreadAsRead(tenantId: string, threadId: string): Promise<EmailThread>;
    getAllThreads(tenantId: string, filters?: {
        entityTypeId?: number;
        status?: string;
        archived?: boolean;
    }): Promise<EmailThread[]>;
}
