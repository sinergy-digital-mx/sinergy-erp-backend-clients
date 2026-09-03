import { TenantContextService } from '../../../api/rbac/services/tenant-context.service';
import { EmailThreadService } from '../services/email-thread.service';
import { EmailMessageService } from '../services/email-message.service';
import { GmailSendService } from '../services/gmail-send.service';
export declare class EmailThreadController {
    private threadService;
    private messageService;
    private gmailSendService;
    private tenantContext;
    constructor(threadService: EmailThreadService, messageService: EmailMessageService, gmailSendService: GmailSendService, tenantContext: TenantContextService);
    createThread(req: any, body: {
        entityTypeId: number;
        entityId: string;
        emailTo: string;
        subject: string;
        body: string;
    }): Promise<{
        success: boolean;
        data: {
            thread: import("../../../entities/email/email-thread.entity").EmailThread;
            message: import("../../../entities/email/email-message.entity").EmailMessage;
        };
    }>;
    getGmailStatus(): Promise<{
        success: boolean;
        gmailConfigured: boolean;
    }>;
    testGmailConfig(): Promise<{
        success: boolean;
        message: string;
    }>;
    getThreadsByEntity(entityTypeId?: string, entityId?: string, status?: string, archived?: string): Promise<{
        success: boolean;
        data: import("../../../entities/email/email-thread.entity").EmailThread[];
    }>;
    getThreadDetails(threadId: string): Promise<{
        success: boolean;
        data: import("../../../entities/email/email-thread.entity").EmailThread;
    }>;
    updateThreadStatus(threadId: string, body: {
        status: 'draft' | 'sent' | 'replied' | 'closed' | 'archived';
    }): Promise<{
        success: boolean;
        data: import("../../../entities/email/email-thread.entity").EmailThread;
    }>;
    markThreadAsRead(threadId: string): Promise<{
        success: boolean;
        data: import("../../../entities/email/email-thread.entity").EmailThread;
    }>;
    sendMessage(threadId: string, body: {
        fromEmail: string;
        toEmail: string;
        subject: string;
        body: string;
        bodyHtml?: string;
        cc?: string;
        bcc?: string;
    }): Promise<{
        success: boolean;
        data: import("../../../entities/email/email-message.entity").EmailMessage;
    }>;
    getThreadMessages(threadId: string): Promise<{
        success: boolean;
        data: import("../../../entities/email/email-message.entity").EmailMessage[];
    }>;
    markMessageAsRead(threadId: string, messageId: string): Promise<{
        success: boolean;
        data: import("../../../entities/email/email-message.entity").EmailMessage;
    }>;
    markAllMessagesAsRead(threadId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    sendMessageViaGmail(threadId: string, body: {
        fromEmail: string;
        toEmail: string;
        subject: string;
        body: string;
        bodyHtml?: string;
        cc?: string;
        bcc?: string;
    }): Promise<{
        success: boolean;
        message: string;
        gmailMessageId: string;
    }>;
}
