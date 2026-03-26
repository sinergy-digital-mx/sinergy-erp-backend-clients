import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ResendConfiguration } from '../../../entities/mailer-configuration/resend-configuration.entity';
import { MailerConfigurationRepository } from '../repositories/mailer-configuration.repository';
import { MailerConfigurationEncryptionService } from './encryption.service';
import { CreateMailerConfigurationDto } from '../dto/create-mailer-configuration.dto';
import { UpdateMailerConfigurationDto } from '../dto/update-mailer-configuration.dto';
import { QueryMailerConfigurationDto } from '../dto/query-mailer-configuration.dto';

/**
 * MailerConfigurationService
 * Simplified service for managing Resend-only email configurations
 * Handles CRUD operations, encryption, and configuration state management
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
  ): Promise<ResendConfiguration> {
    // Check if configuration name already exists for this tenant
    const existing = await this.configRepository.findByTenantAndName(tenantId, dto.name);
    if (existing) {
      throw new BadRequestException(`Configuration with name "${dto.name}" already exists for this tenant`);
    }

    // Validate API key format
    if (!dto.apiKey || typeof dto.apiKey !== 'string' || dto.apiKey.trim().length === 0) {
      throw new BadRequestException('Valid API key is required');
    }

    // Encrypt API key
    const encrypted = this.encryptionService.encryptResendApiKey(dto.apiKey);

    // Create configuration entity
    const config = this.configRepository.create({
      tenant_id: tenantId,
      name: dto.name,
      api_key_encrypted: encrypted.encryptedKey,
      api_key_iv: encrypted.iv,
      is_active: false,
      is_valid: true,
      created_by: userId,
      updated_by: userId,
    });

    // Save and return configuration
    return this.configRepository.save(config);
  }

  /**
   * Find configuration by ID with tenant verification
   * Ensures the configuration belongs to the requesting tenant
   *
   * @param tenantId - The tenant ID
   * @param configId - The configuration ID
   * @returns Configuration if found and belongs to tenant
   */
  async findById(tenantId: string, configId: string): Promise<ResendConfiguration> {
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
  ): Promise<{ data: ResendConfiguration[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.configRepository.findAndCount({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  /**
   * Find the active configuration for a tenant
   * Returns the configuration currently marked as active
   *
   * @param tenantId - The tenant ID
   * @returns Active configuration if exists
   */
  async findActive(tenantId: string): Promise<ResendConfiguration> {
    const config = await this.configRepository.findActiveByTenant(tenantId);
    if (!config) {
      throw new NotFoundException(`No active Resend configuration found for this tenant`);
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
  ): Promise<ResendConfiguration> {
    // Verify configuration exists and belongs to tenant
    const config = await this.findById(tenantId, configId);

    // Update name if provided
    if (dto.name !== undefined && dto.name !== config.name) {
      const existing = await this.configRepository.findByTenantAndName(tenantId, dto.name);
      if (existing && existing.id !== configId) {
        throw new BadRequestException(`Configuration with name "${dto.name}" already exists for this tenant`);
      }
      config.name = dto.name;
    }

    // Update API key if provided
    if (dto.apiKey !== undefined) {
      if (!dto.apiKey || typeof dto.apiKey !== 'string' || dto.apiKey.trim().length === 0) {
        throw new BadRequestException('Valid API key is required');
      }
      const encrypted = this.encryptionService.encryptResendApiKey(dto.apiKey);
      config.api_key_encrypted = encrypted.encryptedKey;
      config.api_key_iv = encrypted.iv;
    }

    // Update metadata
    config.updated_by = userId;
    config.updated_at = new Date();

    return this.configRepository.save(config);
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
    // Verify configuration exists and belongs to tenant
    const config = await this.findById(tenantId, configId);

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
  async activate(tenantId: string, configId: string, userId: string): Promise<ResendConfiguration> {
    // Verify configuration exists and belongs to tenant
    const config = await this.findById(tenantId, configId);

    // Verify configuration is valid
    if (!config.is_valid) {
      throw new BadRequestException(`Cannot activate invalid configuration`);
    }

    // Deactivate all other configurations for this tenant
    await this.configRepository.deactivateAllByTenant(tenantId);

    // Activate this configuration
    config.is_active = true;
    config.updated_by = userId;
    config.updated_at = new Date();

    return this.configRepository.save(config);
  }

}
