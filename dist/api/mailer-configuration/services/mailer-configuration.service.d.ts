import { MailerConfiguration } from '../../../entities/mailer-configuration/mailer-configuration.entity';
import { MailerConfigurationRepository } from '../repositories/mailer-configuration.repository';
import { MailerConfigurationEncryptionService } from './encryption.service';
import { CreateMailerConfigurationDto } from '../dto/create-mailer-configuration.dto';
import { UpdateMailerConfigurationDto } from '../dto/update-mailer-configuration.dto';
import { QueryMailerConfigurationDto } from '../dto/query-mailer-configuration.dto';
import type { VendorConfig } from '../interfaces/vendor-config.interface';
export declare class MailerConfigurationService {
    private configRepository;
    private encryptionService;
    constructor(configRepository: MailerConfigurationRepository, encryptionService: MailerConfigurationEncryptionService);
    create(tenantId: string, dto: CreateMailerConfigurationDto, userId: string): Promise<MailerConfiguration>;
    findById(tenantId: string, configId: string): Promise<MailerConfiguration>;
    findByIdInternal(tenantId: string, configId: string): Promise<MailerConfiguration>;
    list(tenantId: string, query: QueryMailerConfigurationDto): Promise<{
        data: MailerConfiguration[];
        total: number;
        page: number;
        limit: number;
    }>;
    findActive(tenantId: string): Promise<MailerConfiguration>;
    findActiveInternal(tenantId: string): Promise<MailerConfiguration>;
    update(tenantId: string, configId: string, dto: UpdateMailerConfigurationDto, userId: string): Promise<MailerConfiguration>;
    delete(tenantId: string, configId: string, userId: string): Promise<void>;
    activate(tenantId: string, configId: string, userId: string): Promise<MailerConfiguration>;
    decryptVendorConfig(config: MailerConfiguration): VendorConfig;
    private prepareVendorConfig;
    private toSafeConfiguration;
    private maskVendorConfig;
    private validateStoredVendorConfig;
    private isValidEmail;
}
