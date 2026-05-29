import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { MailerConfiguration } from '../../../entities/mailer-configuration/mailer-configuration.entity';
import { MailerConfigurationRepository } from '../repositories/mailer-configuration.repository';
import { MailerConfigurationEncryptionService } from './encryption.service';
import { CreateMailerConfigurationDto } from '../dto/create-mailer-configuration.dto';
import { UpdateMailerConfigurationDto } from '../dto/update-mailer-configuration.dto';
import { QueryMailerConfigurationDto } from '../dto/query-mailer-configuration.dto';
import { MailerVendor } from '../enums/mailer-vendor.enum';
import type { ResendConfig, VendorConfig } from '../interfaces/vendor-config.interface';

/**
 * MailerConfigurationService
 * Manages tenant-scoped mailer provider configurations.
 * Currently supports Resend and stores credentials encrypted in vendor_config.
 */
@Injectable()
export class MailerConfigurationService {
  constructor(
    private configRepository: MailerConfigurationRepository,
    private encryptionService: MailerConfigurationEncryptionService,
  ) {}

  /**
   * Create a new Resend configuration with encryption
   * Encrypts the API key and stores the configuration
   *
   * @param tenantId - The tenant ID
   * @param dto - Configuration creation data
   * @param userId - User ID performing the action
   * @returns Created configuration
   */
  async create(
    tenantId: string,
    dto: CreateMailerConfigurationDto,
    userId: string,
  ): Promise<MailerConfiguration> {
    const existing = await this.configRepository.findByTenantAndName(tenantId, dto.name);
    if (existing) {
      throw new BadRequestException(`Configuration with name "${dto.name}" already exists for this tenant`);
    }

    const vendor = dto.vendor || MailerVendor.RESEND;
    const vendorConfig = this.prepareVendorConfig(vendor, dto.vendorConfig, dto.apiKey);

    const config = this.configRepository.create({
      tenant_id: tenantId,
      name: dto.name,
      vendor,
      vendor_config: vendorConfig,
      is_active: false,
      is_fallback: dto.isFallback ?? false,
      is_valid: true,
      created_by: userId,
      updated_by: userId,
    });

    const saved = await this.configRepository.save(config);

    if (dto.isActive) {
      return this.activate(tenantId, saved.id, userId);
    }

    return this.toSafeConfiguration(saved);
  }

  /**
   * Find configuration by ID with tenant verification
   * Ensures the configuration belongs to the requesting tenant
   *
   * @param tenantId - The tenant ID
   * @param configId - The configuration ID
   * @returns Configuration if found and belongs to tenant
   */
  async findById(tenantId: string, configId: string): Promise<MailerConfiguration> {
    const config = await this.findByIdInternal(tenantId, configId);
    return this.toSafeConfiguration(config);
  }

  async findByIdInternal(tenantId: string, configId: string): Promise<MailerConfiguration> {
    const config = await this.configRepository.findByTenantAndId(tenantId, configId);
    if (!config) {
      throw new NotFoundException(`Configuration not found`);
    }
    return config;
  }

  /**
   * List configurations for a tenant with pagination
   * Supports filtering and sorting
   *
   * @param tenantId - The tenant ID
   * @param query - Query parameters for pagination
   * @returns Paginated list of configurations
   */
  async list(
    tenantId: string,
    query: QueryMailerConfigurationDto,
  ): Promise<{ data: MailerConfiguration[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.configRepository.findAndCount({
      where: { tenant_id: tenantId, deleted_at: IsNull() },
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: data.map((config) => this.toSafeConfiguration(config)),
      total,
      page,
      limit,
    };
  }

  /**
   * Find the active configuration for a tenant
   * Returns the configuration currently marked as active
   *
   * @param tenantId - The tenant ID
   * @returns Active configuration if exists
   */
  async findActive(tenantId: string): Promise<MailerConfiguration> {
    const config = await this.findActiveInternal(tenantId);
    return this.toSafeConfiguration(config);
  }

  async findActiveInternal(tenantId: string): Promise<MailerConfiguration> {
    const config = await this.configRepository.findActiveByTenant(tenantId);
    if (!config) {
      throw new NotFoundException(`No active mailer configuration found for this tenant`);
    }
    return config;
  }

  /**
   * Update a Resend configuration
   * Validates and encrypts the API key if provided
   *
   * @param tenantId - The tenant ID
   * @param configId - The configuration ID
   * @param dto - Update data
   * @param userId - User ID performing the action
   * @returns Updated configuration
   */
  async update(
    tenantId: string,
    configId: string,
    dto: UpdateMailerConfigurationDto,
    userId: string,
  ): Promise<MailerConfiguration> {
    const config = await this.findByIdInternal(tenantId, configId);

    // Update name if provided
    if (dto.name !== undefined && dto.name !== config.name) {
      const existing = await this.configRepository.findByTenantAndName(tenantId, dto.name);
      if (existing && existing.id !== configId) {
        throw new BadRequestException(`Configuration with name "${dto.name}" already exists for this tenant`);
      }
      config.name = dto.name;
    }

    if (dto.vendorConfig !== undefined || dto.apiKey !== undefined) {
      config.vendor_config = this.prepareVendorConfig(
        config.vendor as MailerVendor,
        dto.vendorConfig,
        dto.apiKey,
        config.vendor_config,
      );
      config.is_valid = true;
    }

    if (dto.isFallback !== undefined) {
      config.is_fallback = dto.isFallback;
    }

    // Update metadata
    config.updated_by = userId;
    config.updated_at = new Date();

    const saved = await this.configRepository.save(config);
    return this.toSafeConfiguration(saved);
  }

  /**
   * Soft delete a Resend configuration
   * Marks the configuration as deleted without removing it from the database
   *
   * @param tenantId - The tenant ID
   * @param configId - The configuration ID
   * @param userId - User ID performing the action
   */
  async delete(tenantId: string, configId: string, userId: string): Promise<void> {
    const config = await this.findByIdInternal(tenantId, configId);

    // Soft delete
    config.deleted_at = new Date();
    config.deleted_by = userId;
    await this.configRepository.save(config);
  }

  /**
   * Activate a Resend configuration
   * Deactivates all other configurations for the tenant and activates this one
   *
   * @param tenantId - The tenant ID
   * @param configId - The configuration ID to activate
   * @param userId - User ID performing the action
   * @returns Updated configuration
   */
  async activate(tenantId: string, configId: string, userId: string): Promise<MailerConfiguration> {
    const config = await this.findByIdInternal(tenantId, configId);

    // Verify configuration is valid
    if (!config.is_valid) {
      throw new BadRequestException(`Cannot activate invalid configuration`);
    }

    this.validateStoredVendorConfig(config);

    // Deactivate all other configurations for this tenant
    await this.configRepository.deactivateAllByTenant(tenantId);

    // Activate this configuration
    config.is_active = true;
    config.updated_by = userId;
    config.updated_at = new Date();

    const saved = await this.configRepository.save(config);
    return this.toSafeConfiguration(saved);
  }

  decryptVendorConfig(config: MailerConfiguration): VendorConfig {
    if (config.vendor === MailerVendor.RESEND) {
      const stored = config.vendor_config as {
        apiKeyEncrypted?: string;
        apiKeyIv?: string;
        fromEmail?: string;
        fromName?: string;
        replyTo?: string;
        publicKey?: string;
      };

      if (!stored.apiKeyEncrypted || !stored.apiKeyIv) {
        throw new BadRequestException('Resend configuration is missing encrypted api key');
      }

      return {
        apiKey: this.encryptionService.decryptSecret(stored.apiKeyEncrypted, stored.apiKeyIv),
        fromEmail: stored.fromEmail as string,
        fromName: stored.fromName as string | undefined,
        replyTo: stored.replyTo as string | undefined,
        publicKey: stored.publicKey as string | undefined,
      };
    }

    throw new BadRequestException(`Mailer vendor "${config.vendor}" is not supported yet`);
  }

  private prepareVendorConfig(
    vendor: MailerVendor,
    vendorConfig?: VendorConfig,
    legacyApiKey?: string,
    existingConfig: Record<string, unknown> = {},
  ): Record<string, unknown> {
    if (vendor !== MailerVendor.RESEND) {
      throw new BadRequestException(`Mailer vendor "${vendor}" is not supported yet`);
    }

    const resendConfig = (vendorConfig || {}) as Partial<ResendConfig>;
    const apiKey = legacyApiKey || resendConfig.apiKey;
    const fromEmail = resendConfig.fromEmail || (existingConfig.fromEmail as string | undefined);
    const fromName = resendConfig.fromName ?? (existingConfig.fromName as string | undefined);
    const replyTo = resendConfig.replyTo ?? (existingConfig.replyTo as string | undefined);
    const publicKey = resendConfig.publicKey ?? (existingConfig.publicKey as string | undefined);

    if (!apiKey && !existingConfig.apiKeyEncrypted) {
      throw new BadRequestException('Valid Resend apiKey is required');
    }

    if (apiKey && (typeof apiKey !== 'string' || apiKey.trim().length < 10)) {
      throw new BadRequestException('Valid Resend apiKey is required');
    }

    if (!fromEmail || typeof fromEmail !== 'string' || !this.isValidEmail(fromEmail)) {
      throw new BadRequestException('Valid Resend fromEmail is required');
    }

    if (replyTo && !this.isValidEmail(replyTo)) {
      throw new BadRequestException('Valid Resend replyTo is required');
    }

    const encrypted = apiKey
      ? this.encryptionService.encryptSecret(apiKey.trim())
      : {
          encryptedValue: existingConfig.apiKeyEncrypted as string,
          iv: existingConfig.apiKeyIv as string,
        };

    return {
      apiKeyEncrypted: encrypted.encryptedValue,
      apiKeyIv: encrypted.iv,
      fromEmail: fromEmail.trim(),
      fromName: fromName?.trim(),
      replyTo: replyTo?.trim(),
      publicKey,
    };
  }

  private toSafeConfiguration(config: MailerConfiguration): MailerConfiguration {
    return {
      ...config,
      vendor_config: this.maskVendorConfig(config),
    } as MailerConfiguration;
  }

  private maskVendorConfig(config: MailerConfiguration): Record<string, unknown> {
    if (config.vendor === MailerVendor.RESEND) {
      return {
        apiKey: '********',
        fromEmail: (config.vendor_config as Record<string, unknown>)?.fromEmail,
        fromName: (config.vendor_config as Record<string, unknown>)?.fromName,
        replyTo: (config.vendor_config as Record<string, unknown>)?.replyTo,
        publicKey: (config.vendor_config as Record<string, unknown>)?.publicKey,
      };
    }

    return {};
  }

  private validateStoredVendorConfig(config: MailerConfiguration): void {
    if (config.vendor === MailerVendor.RESEND) {
      const stored = config.vendor_config as Record<string, unknown>;

      if (!stored.apiKeyEncrypted || !stored.apiKeyIv) {
        throw new BadRequestException('Resend configuration is missing apiKey');
      }

      if (!stored.fromEmail || typeof stored.fromEmail !== 'string' || !this.isValidEmail(stored.fromEmail)) {
        throw new BadRequestException('Resend configuration is missing a valid fromEmail');
      }

      return;
    }

    throw new BadRequestException(`Mailer vendor "${config.vendor}" is not supported yet`);
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

}
