import { Repository } from 'typeorm';
import { EmailMessage } from '../../../entities/email/email-message.entity';
import { EmailThread } from '../../../entities/email/email-thread.entity';
export declare class EmailMessageService {
    private messageRepo;
    private threadRepo;
    constructor(messageRepo: Repository<EmailMessage>, threadRepo: Repository<EmailThread>);
    sendMessage(tenantId: string, threadId: string, fromEmail: string, toEmail: string, subject: string, body: string, bodyHtml?: string, cc?: string, bcc?: string): Promise<EmailMessage>;
    receiveMessage(tenantId: string, threadId: string, externalId: string, fromEmail: string, toEmail: string, subject: string, body: string, bodyHtml?: string, cc?: string, bcc?: string, inReplyTo?: string): Promise<EmailMessage>;
    getThreadMessages(tenantId: string, threadId: string): Promise<EmailMessage[]>;
    markAsRead(tenantId: string, messageId: string): Promise<EmailMessage>;
    markThreadMessagesAsRead(tenantId: string, threadId: string): Promise<void>;
    getMessageById(tenantId: string, messageId: string): Promise<EmailMessage>;
}
