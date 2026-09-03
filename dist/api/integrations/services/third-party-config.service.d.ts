import { Repository } from 'typeorm';
import { ThirdPartyConfig } from '../../../entities/integrations/third-party-config.entity';
import { EncryptionService } from './encryption.service';
import { CreateThirdPartyConfigDto } from '../dto/create-third-party-config.dto';
import { UpdateThirdPartyConfigDto } from '../dto/update-third-party-config.dto';
export declare class ThirdPartyConfigService {
    private configRepo;
    private encryptionService;
    constructor(configRepo: Repository<ThirdPartyConfig>, encryptionService: EncryptionService);
    create(tenantId: string, dto: CreateThirdPartyConfigDto, userId: string): Promise<ThirdPartyConfig>;
    getById(configId: string, tenantId: string): Promise<ThirdPartyConfig>;
    getByProvider(tenantId: string, provider: string): Promise<ThirdPartyConfig>;
    listByTenant(tenantId: string): Promise<ThirdPartyConfig[]>;
    update(configId: string, tenantId: string, dto: UpdateThirdPartyConfigDto, userId: string): Promise<ThirdPartyConfig>;
    delete(configId: string, tenantId: string): Promise<void>;
    testConfig(configId: string, tenantId: string): Promise<boolean>;
    getDecryptedApiKey(configId: string, tenantId: string): Promise<string>;
    getDecryptedApiSecret(configId: string, tenantId: string): Promise<string | null>;
    getDecryptedWebhookSecret(configId: string, tenantId: string): Promise<string | null>;
    private decryptConfig;
}
