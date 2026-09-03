import { Repository } from 'typeorm';
import { EmailMessageService } from './email-message.service';
import { ThirdPartyConfig } from '../../../entities/integrations/third-party-config.entity';
import { EncryptionService } from '../../integrations/services/encryption.service';
export declare class GmailSendService {
    private configRepo;
    private emailMessageService;
    private encryptionService;
    private readonly logger;
    constructor(configRepo: Repository<ThirdPartyConfig>, emailMessageService: EmailMessageService, encryptionService: EncryptionService);
    sendViaGmail(tenantId: string, threadId: string, fromEmail: string, toEmail: string, subject: string, body: string, bodyHtml?: string, cc?: string, bcc?: string): Promise<string>;
    private createEmailMessage;
    refreshAccessTokenIfNeeded(config: ThirdPartyConfig): Promise<void>;
    getGmailConfig(tenantId: string): Promise<ThirdPartyConfig>;
    isGmailConfigured(tenantId: string): Promise<boolean>;
    testGmailConfig(tenantId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
