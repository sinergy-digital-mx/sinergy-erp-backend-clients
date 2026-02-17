import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThirdPartyConfig } from '../../../entities/integrations/third-party-config.entity';
import { EncryptionService } from './encryption.service';
import { CreateThirdPartyConfigDto } from '../dto/create-third-party-config.dto';
import { UpdateThirdPartyConfigDto } from '../dto/update-third-party-config.dto';

@Injectable()
export class ThirdPartyConfigService {
  constructor(
    @InjectRepository(ThirdPartyConfig)
    private configRepo: Repository<ThirdPartyConfig>,
    private encryptionService: EncryptionService,
  ) {}

  /**
   * Create a new third-party configuration
   */
  async create(
    tenantId: string,
    dto: CreateThirdPartyConfigDto,
    userId: string,
  ): Promise<ThirdPartyConfig> {
    // Check if config already exists for this provider
    const existing = await this.configRepo.findOne({
      where: { tenant_id: tenantId, provider: dto.provider },
    });

    if (existing) {
      throw new BadRequestException(
        `Configuration for provider "${dto.provider}" already exists for this tenant`,
      );
    }

    const config = this.configRepo.create({
      tenant_id: tenantId,
      provider: dto.provider,
      name: dto.name,
      encrypted_api_key: this.encryptionService.encrypt(dto.api_key),
      encrypted_api_secret: dto.api_secret
        ? this.encryptionService.encrypt(dto.api_secret)
        : null,
      encrypted_webhook_secret: dto.webhook_secret
        ? this.encryptionService.encrypt(dto.webhook_secret)
        : null,
      metadata: dto.metadata || {},
      is_enabled: dto.is_enabled ?? true,
      is_test_mode: dto.is_test_mode ?? false,
      created_by: userId,
      updated_by: userId,
    });

    return this.configRepo.save(config);
  }

  /**
   * Get configuration by ID (with decrypted secrets)
   */
  async getById(configId: string, tenantId: string): Promise<ThirdPartyConfig> {
    const config = await this.configRepo.findOne({
      where: { id: configId, tenant_id: tenantId },
    });

    if (!config) {
      throw new NotFoundException('Configuration not found');
    }

    return this.decryptConfig(config);
  }

  /**
   * Get configuration by provider (with decrypted secrets)
   */
  async getByProvider(
    tenantId: string,
    provider: string,
  ): Promise<ThirdPartyConfig> {
    const config = await this.configRepo.findOne({
      where: { tenant_id: tenantId, provider },
    });

    if (!config) {
      throw new NotFoundException(
        `Configuration for provider "${provider}" not found`,
      );
    }

    return this.decryptConfig(config);
  }

  /**
   * List all configurations for a tenant (without decrypted secrets)
   */
  async listByTenant(tenantId: string): Promise<ThirdPartyConfig[]> {
    return this.configRepo.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Update configuration
   */
  async update(
    configId: string,
    tenantId: string,
    dto: UpdateThirdPartyConfigDto,
    userId: string,
  ): Promise<ThirdPartyConfig> {
    const config = await this.configRepo.findOne({
      where: { id: configId, tenant_id: tenantId },
    });

    if (!config) {
      throw new NotFoundException('Configuration not found');
    }

    if (dto.name) config.name = dto.name;
    if (dto.api_key) {
      config.encrypted_api_key = this.encryptionService.encrypt(dto.api_key);
    }
    if (dto.api_secret !== undefined) {
      config.encrypted_api_secret = dto.api_secret
        ? this.encryptionService.encrypt(dto.api_secret)
        : null;
    }
    if (dto.webhook_secret !== undefined) {
      config.encrypted_webhook_secret = dto.webhook_secret
        ? this.encryptionService.encrypt(dto.webhook_secret)
        : null;
    }
    if (dto.metadata) config.metadata = dto.metadata;
    if (dto.is_enabled !== undefined) config.is_enabled = dto.is_enabled;
    if (dto.is_test_mode !== undefined) config.is_test_mode = dto.is_test_mode;

    config.updated_by = userId;
    config.updated_at = new Date();

    return this.configRepo.save(config);
  }

  /**
   * Delete configuration
   */
  async delete(configId: string, tenantId: string): Promise<void> {
    const result = await this.configRepo.delete({
      id: configId,
      tenant_id: tenantId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Configuration not found');
    }
  }

  /**
   * Test configuration by attempting to decrypt
   */
  async testConfig(configId: string, tenantId: string): Promise<boolean> {
    const config = await this.configRepo.findOne({
      where: { id: configId, tenant_id: tenantId },
    });

    if (!config) {
      throw new NotFoundException('Configuration not found');
    }

    try {
      this.encryptionService.decrypt(config.encrypted_api_key);
      config.last_tested_at = new Date();
      await this.configRepo.save(config);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get decrypted API key for actual use
   */
  async getDecryptedApiKey(configId: string, tenantId: string): Promise<string> {
    const config = await this.getById(configId, tenantId);
    return this.encryptionService.decrypt(config.encrypted_api_key);
  }

  /**
   * Get decrypted API secret for actual use
   */
  async getDecryptedApiSecret(
    configId: string,
    tenantId: string,
  ): Promise<string | null> {
    const config = await this.getById(configId, tenantId);
    if (!config.encrypted_api_secret) return null;
    return this.encryptionService.decrypt(config.encrypted_api_secret);
  }

  /**
   * Get decrypted webhook secret for actual use
   */
  async getDecryptedWebhookSecret(
    configId: string,
    tenantId: string,
  ): Promise<string | null> {
    const config = await this.getById(configId, tenantId);
    if (!config.encrypted_webhook_secret) return null;
    return this.encryptionService.decrypt(config.encrypted_webhook_secret);
  }

  /**
   * Decrypt config for response (internal use)
   */
  private decryptConfig(config: ThirdPartyConfig): ThirdPartyConfig {
    return {
      ...config,
      encrypted_api_key: this.encryptionService.decrypt(config.encrypted_api_key),
      encrypted_api_secret: config.encrypted_api_secret
        ? this.encryptionService.decrypt(config.encrypted_api_secret)
        : null,
      encrypted_webhook_secret: config.encrypted_webhook_secret
        ? this.encryptionService.decrypt(config.encrypted_webhook_secret)
        : null,
    };
  }
}
