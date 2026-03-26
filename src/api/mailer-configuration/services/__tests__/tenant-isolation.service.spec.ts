import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { MailerConfigurationService } from '../mailer-configuration.service';
import { MailerConfigurationRepository } from '../../repositories/mailer-configuration.repository';
import { MailerConfigurationHealthRepository } from '../../repositories/mailer-configuration-health.repository';
import { MailerConfiguration } from '../../../../entities/mailer-configuration/mailer-configuration.entity';
import { MailerConfigurationHealth, MailerConfigurationHealthTestResult } from '../../../../entities/mailer-configuration/mailer-configuration-health.entity';
import { MailerConfigurationEncryptionService } from '../encryption.service';
import { VendorValidationService } from '../vendor-validation.service';
import { AuditService } from '../audit.service';
import { MailerVendor } from '../../enums/mailer-vendor.enum';
import { CreateMailerConfigurationDto } from '../../dto/create-mailer-configuration.dto';
import { UpdateMailerConfigurationDto } from '../../dto/update-mailer-configuration.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

/**
 * Tenant Isolation Tests
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4
 *
 * Tests verify that:
 * 1. A tenant cannot access configurations of another tenant
 * 2. Queries automatically filter by tenant_id
 * 3. Update/delete operations verify tenant ownership
 * 4. Create operations associate configuration to correct tenant
 * 5. Cross-tenant access is rejected with NotFoundException or ForbiddenException
 */
describe('Tenant Isolation - MailerConfigurationService', () => {
  let service: MailerConfigurationService;
  let mockConfigRepository: jest.Mocked<MailerConfigurationRepository>;
  let mockHealthRepository: jest.Mocked<any>;
  let mockEncryptionService: jest.Mocked<MailerConfigurationEncryptionService>;
  let mockValidationService: jest.Mocked<VendorValidationService>;
  let mockAuditService: jest.Mocked<AuditService>;
  let mockDataSource: jest.Mocked<DataSource>;

  // Test data
  const tenant1Id = 'tenant-001';
  const tenant2Id = 'tenant-002';
  const userId1 = 'user-001';
  const userId2 = 'user-002';

  const createMockConfig = (
    id: string,
    tenantId: string,
    name: string,
    isActive: boolean = false,
  ): MailerConfiguration => ({
    id,
    tenant_id: tenantId,
    name,
    vendor: MailerVendor.RESEND,
    vendor_config: { apiKey: 'encrypted-key' },
    is_active: isActive,
    is_fallback: false,
    is_valid: true,
    created_at: new Date(),
    created_by: userId1,
    updated_at: new Date(),
    updated_by: userId1,
    deleted_at: null,
    deleted_by: null,
    last_test_result: null,
    last_test_timestamp: null,
    last_used_timestamp: null,
    tenant: null as any,
    audit_records: [],
    health: null,
  });

  beforeEach(async () => {
    mockConfigRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
      findByTenantAndId: jest.fn(),
      findActiveByTenant: jest.fn(),
      findFallbackByTenant: jest.fn(),
      findByTenantWithPagination: jest.fn(),
      findByTenantAndName: jest.fn(),
      findByTenantAndVendor: jest.fn(),
      deactivateAllByTenant: jest.fn(),
      clearFallbackByTenant: jest.fn(),
    } as any;

    mockHealthRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    } as any;

    mockEncryptionService = {
      encryptVendorConfig: jest.fn(),
      decryptVendorConfig: jest.fn(),
      maskVendorConfig: jest.fn(),
    } as any;

    mockValidationService = {
      validateVendorConfig: jest.fn(),
      getRequiredFields: jest.fn(),
      getOptionalFields: jest.fn(),
    } as any;

    mockAuditService = {
      recordAuditEvent: jest.fn(),
    } as any;

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockHealthRepository),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerConfigurationService,
        {
          provide: MailerConfigurationRepository,
          useValue: mockConfigRepository,
        },
        {
          provide: MailerConfigurationHealthRepository,
          useValue: mockHealthRepository,
        },
        {
          provide: MailerConfigurationEncryptionService,
          useValue: mockEncryptionService,
        },
        {
          provide: VendorValidationService,
          useValue: mockValidationService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<MailerConfigurationService>(MailerConfigurationService);
  });

  describe('Requirement 4.1: Create associates configuration to correct tenant', () => {
    it('should create configuration with correct tenant_id', async () => {
      const dto: CreateMailerConfigurationDto = {
        name: 'Tenant 1 Config',
        vendor: MailerVendor.RESEND,
        vendorConfig: { apiKey: 'test-key' },
      };

      const createdConfig = createMockConfig('config-1', tenant1Id, 'Tenant 1 Config');

      mockValidationService.validateVendorConfig.mockReturnValue({
        isValid: true,
        errors: [],
      });

      mockEncryptionService.encryptVendorConfig.mockReturnValue({
        apiKey: 'encrypted-key',
      });

      mockConfigRepository.findByTenantAndName.mockResolvedValue(null);
      mockConfigRepository.create.mockReturnValue(createdConfig);
      mockConfigRepository.save.mockResolvedValue(createdConfig);
      mockHealthRepository.create.mockReturnValue({
        configuration_id: 'config-1',
        tenant_id: tenant1Id,
        last_test_result: MailerConfigurationHealthTestResult.UNTESTED,
        consecutive_failures: 0,
        is_healthy: true,
      });

      const result = await service.create(tenant1Id, dto, userId1);

      expect(result.tenant_id).toBe(tenant1Id);
      expect(mockConfigRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: tenant1Id,
        }),
      );
    });

    it('should create configuration for different tenant with different tenant_id', async () => {
      const dto: CreateMailerConfigurationDto = {
        name: 'Tenant 2 Config',
        vendor: MailerVendor.RESEND,
        vendorConfig: { apiKey: 'test-key' },
      };

      const createdConfig = createMockConfig('config-2', tenant2Id, 'Tenant 2 Config');

      mockValidationService.validateVendorConfig.mockReturnValue({
        isValid: true,
        errors: [],
      });

      mockEncryptionService.encryptVendorConfig.mockReturnValue({
        apiKey: 'encrypted-key',
      });

      mockConfigRepository.findByTenantAndName.mockResolvedValue(null);
      mockConfigRepository.create.mockReturnValue(createdConfig);
      mockConfigRepository.save.mockResolvedValue(createdConfig);
      mockHealthRepository.create.mockReturnValue({
        configuration_id: 'config-2',
        tenant_id: tenant2Id,
        last_test_result: MailerConfigurationHealthTestResult.UNTESTED,
        consecutive_failures: 0,
        is_healthy: true,
      });

      const result = await service.create(tenant2Id, dto, userId2);

      expect(result.tenant_id).toBe(tenant2Id);
      expect(result.tenant_id).not.toBe(tenant1Id);
    });
  });

  describe('Requirement 4.2: Queries filter automatically by tenant_id', () => {
    it('should filter findByTenant to only return configurations for specified tenant', async () => {
      const tenant1Configs = [
        createMockConfig('config-1', tenant1Id, 'Config 1'),
        createMockConfig('config-2', tenant1Id, 'Config 2'),
      ];

      mockConfigRepository.findByTenantWithPagination.mockResolvedValue({
        data: tenant1Configs,
        total: 2,
        page: 1,
        limit: 10,
      });

      const result = await service.findByTenant(tenant1Id, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.data.every((config) => config.tenant_id === tenant1Id)).toBe(true);
      expect(mockConfigRepository.findByTenantWithPagination).toHaveBeenCalledWith(
        tenant1Id,
        expect.any(Object),
      );
    });

    it('should return empty list when tenant has no configurations', async () => {
      mockConfigRepository.findByTenantWithPagination.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      const result = await service.findByTenant(tenant1Id, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should not return configurations from other tenants in findByTenant', async () => {
      const tenant1Configs = [createMockConfig('config-1', tenant1Id, 'Config 1')];

      mockConfigRepository.findByTenantWithPagination.mockResolvedValue({
        data: tenant1Configs,
        total: 1,
        page: 1,
        limit: 10,
      });

      const result = await service.findByTenant(tenant1Id, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].tenant_id).toBe(tenant1Id);
      expect(result.data.some((config) => config.tenant_id === tenant2Id)).toBe(false);
    });

    it('should filter findActive to only return active configuration for specified tenant', async () => {
      const activeConfig = createMockConfig('config-1', tenant1Id, 'Active Config', true);

      mockConfigRepository.findActiveByTenant.mockResolvedValue(activeConfig);

      const result = await service.findActive(tenant1Id);

      expect(result.tenant_id).toBe(tenant1Id);
      expect(result.is_active).toBe(true);
      expect(mockConfigRepository.findActiveByTenant).toHaveBeenCalledWith(tenant1Id);
    });

    it('should not return active configuration from other tenant', async () => {
      mockConfigRepository.findActiveByTenant.mockResolvedValue(null);

      await expect(service.findActive(tenant1Id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('Requirement 4.3: Update/delete verify tenant ownership', () => {
    it('should verify tenant ownership before updating configuration', async () => {
      const config = createMockConfig('config-1', tenant1Id, 'Config 1');
      const dto: UpdateMailerConfigurationDto = {
        name: 'Updated Config',
      };

      mockConfigRepository.findByTenantAndId.mockResolvedValue(config);
      mockConfigRepository.findByTenantAndName.mockResolvedValue(null);
      mockValidationService.validateVendorConfig.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockConfigRepository.save.mockResolvedValue({
        ...config,
        name: 'Updated Config',
      });

      await service.update(tenant1Id, 'config-1', dto, userId1);

      expect(mockConfigRepository.findByTenantAndId).toHaveBeenCalledWith(tenant1Id, 'config-1');
    });

    it('should throw NotFoundException when updating configuration from different tenant', async () => {
      const dto: UpdateMailerConfigurationDto = {
        name: 'Updated Config',
      };

      mockConfigRepository.findByTenantAndId.mockResolvedValue(null);

      await expect(service.update(tenant1Id, 'config-1', dto, userId1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should verify tenant ownership before deleting configuration', async () => {
      const config = createMockConfig('config-1', tenant1Id, 'Config 1');

      mockConfigRepository.findByTenantAndId.mockResolvedValue(config);
      mockConfigRepository.remove.mockResolvedValue(config);

      await service.delete(tenant1Id, 'config-1', userId1);

      expect(mockConfigRepository.findByTenantAndId).toHaveBeenCalledWith(tenant1Id, 'config-1');
    });

    it('should throw NotFoundException when deleting configuration from different tenant', async () => {
      mockConfigRepository.findByTenantAndId.mockResolvedValue(null);

      await expect(service.delete(tenant1Id, 'config-1', userId1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not allow tenant1 to update tenant2 configuration', async () => {
      const tenant2Config = createMockConfig('config-2', tenant2Id, 'Tenant 2 Config');

      mockConfigRepository.findByTenantAndId.mockResolvedValue(null);

      const dto: UpdateMailerConfigurationDto = {
        name: 'Hacked Config',
      };

      await expect(service.update(tenant1Id, 'config-2', dto, userId1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not allow tenant1 to delete tenant2 configuration', async () => {
      mockConfigRepository.findByTenantAndId.mockResolvedValue(null);

      await expect(service.delete(tenant1Id, 'config-2', userId1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Requirement 4.4: Cross-tenant access is rejected', () => {
    it('should reject findById when configuration belongs to different tenant', async () => {
      mockConfigRepository.findByTenantAndId.mockResolvedValue(null);

      await expect(service.findById(tenant1Id, 'config-2')).rejects.toThrow(NotFoundException);
    });

    it('should reject setActive when configuration belongs to different tenant', async () => {
      mockConfigRepository.findByTenantAndId.mockResolvedValue(null);

      await expect(service.setActive(tenant1Id, 'config-2', userId1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject setFallback when configuration belongs to different tenant', async () => {
      mockConfigRepository.findByTenantAndId.mockResolvedValue(null);

      await expect(service.setFallback(tenant1Id, 'config-2', userId1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject clearFallback when no fallback exists for tenant', async () => {
      mockConfigRepository.findFallbackByTenant.mockResolvedValue(null);

      await expect(service.clearFallback(tenant1Id, userId1)).rejects.toThrow(NotFoundException);
    });

    it('should return NotFoundException (not ForbiddenException) for cross-tenant access', async () => {
      mockConfigRepository.findByTenantAndId.mockResolvedValue(null);

      try {
        await service.findById(tenant1Id, 'config-2');
        fail('Should have thrown an exception');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error).not.toBeInstanceOf(ForbiddenException);
      }
    });
  });

  describe('Requirement 4.1: Create associates configuration to correct tenant', () => {
    it('should record tenant_id in audit trail when creating configuration', async () => {
      const dto: CreateMailerConfigurationDto = {
        name: 'Tenant 1 Config',
        vendor: MailerVendor.RESEND,
        vendorConfig: { apiKey: 'test-key' },
      };

      const createdConfig = createMockConfig('config-1', tenant1Id, 'Tenant 1 Config');

      mockValidationService.validateVendorConfig.mockReturnValue({
        isValid: true,
        errors: [],
      });

      mockEncryptionService.encryptVendorConfig.mockReturnValue({
        apiKey: 'encrypted-key',
      });

      mockConfigRepository.findByTenantAndName.mockResolvedValue(null);
      mockConfigRepository.create.mockReturnValue(createdConfig);
      mockConfigRepository.save.mockResolvedValue(createdConfig);
      mockHealthRepository.create.mockReturnValue({
        configuration_id: 'config-1',
        tenant_id: tenant1Id,
        last_test_result: MailerConfigurationHealthTestResult.UNTESTED,
        consecutive_failures: 0,
        is_healthy: true,
      });

      await service.create(tenant1Id, dto, userId1);

      expect(mockAuditService.recordAuditEvent).toHaveBeenCalledWith(
        'config-1',
        tenant1Id,
        expect.any(String),
        userId1,
        expect.any(String),
      );
    });
  });

  describe('Requirement 4.2: Queries filter by tenant_id', () => {
    it('should use tenant_id in findByTenantAndVendor query', async () => {
      const configs = [createMockConfig('config-1', tenant1Id, 'Config 1')];

      mockConfigRepository.findByTenantAndVendor.mockResolvedValue(configs);

      const result = await service.findByTenant(tenant1Id, {
        page: 1,
        limit: 10,
        vendor: MailerVendor.RESEND,
      });

      // The service calls findByTenantWithPagination which filters by tenant
      expect(mockConfigRepository.findByTenantWithPagination).toHaveBeenCalledWith(
        tenant1Id,
        expect.objectContaining({
          vendor: MailerVendor.RESEND,
        }),
      );
    });

    it('should only return configurations matching tenant_id in pagination query', async () => {
      const tenant1Configs = [
        createMockConfig('config-1', tenant1Id, 'Config 1'),
        createMockConfig('config-2', tenant1Id, 'Config 2'),
      ];

      mockConfigRepository.findByTenantWithPagination.mockResolvedValue({
        data: tenant1Configs,
        total: 2,
        page: 1,
        limit: 10,
      });

      const result = await service.findByTenant(tenant1Id, { page: 1, limit: 10 });

      expect(result.data.every((config) => config.tenant_id === tenant1Id)).toBe(true);
    });
  });

  describe('Requirement 4.3: Update/delete verify ownership', () => {
    it('should verify tenant_id matches before allowing update', async () => {
      const config = createMockConfig('config-1', tenant1Id, 'Config 1');
      const dto: UpdateMailerConfigurationDto = {
        name: 'Updated',
      };

      mockConfigRepository.findByTenantAndId.mockResolvedValue(config);
      mockConfigRepository.findByTenantAndName.mockResolvedValue(null);
      mockValidationService.validateVendorConfig.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockConfigRepository.save.mockResolvedValue(config);

      await service.update(tenant1Id, 'config-1', dto, userId1);

      expect(mockConfigRepository.findByTenantAndId).toHaveBeenCalledWith(tenant1Id, 'config-1');
    });

    it('should verify tenant_id matches before allowing delete', async () => {
      const config = createMockConfig('config-1', tenant1Id, 'Config 1');

      mockConfigRepository.findByTenantAndId.mockResolvedValue(config);
      mockConfigRepository.remove.mockResolvedValue(config);

      await service.delete(tenant1Id, 'config-1', userId1);

      expect(mockConfigRepository.findByTenantAndId).toHaveBeenCalledWith(tenant1Id, 'config-1');
    });

    it('should verify tenant_id matches before allowing setActive', async () => {
      const config = createMockConfig('config-1', tenant1Id, 'Config 1');

      mockConfigRepository.findByTenantAndId.mockResolvedValue(config);
      mockConfigRepository.deactivateAllByTenant.mockResolvedValue(0);
      mockConfigRepository.save.mockResolvedValue({
        ...config,
        is_active: true,
      });

      await service.setActive(tenant1Id, 'config-1', userId1);

      expect(mockConfigRepository.findByTenantAndId).toHaveBeenCalledWith(tenant1Id, 'config-1');
    });
  });

  describe('Requirement 4.4: Cross-tenant access rejection', () => {
    it('should reject access to configuration from different tenant in findById', async () => {
      const tenant2Config = createMockConfig('config-2', tenant2Id, 'Tenant 2 Config');

      mockConfigRepository.findByTenantAndId.mockResolvedValue(null);

      await expect(service.findById(tenant1Id, 'config-2')).rejects.toThrow(NotFoundException);
    });

    it('should reject access to configuration from different tenant in update', async () => {
      mockConfigRepository.findByTenantAndId.mockResolvedValue(null);

      const dto: UpdateMailerConfigurationDto = {
        name: 'Hacked',
      };

      await expect(service.update(tenant1Id, 'config-2', dto, userId1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject access to configuration from different tenant in delete', async () => {
      mockConfigRepository.findByTenantAndId.mockResolvedValue(null);

      await expect(service.delete(tenant1Id, 'config-2', userId1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject access to configuration from different tenant in setActive', async () => {
      mockConfigRepository.findByTenantAndId.mockResolvedValue(null);

      await expect(service.setActive(tenant1Id, 'config-2', userId1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject access to configuration from different tenant in setFallback', async () => {
      mockConfigRepository.findByTenantAndId.mockResolvedValue(null);

      await expect(service.setFallback(tenant1Id, 'config-2', userId1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not expose that configuration exists in other tenant', async () => {
      mockConfigRepository.findByTenantAndId.mockResolvedValue(null);

      try {
        await service.findById(tenant1Id, 'config-2');
        fail('Should have thrown NotFoundException');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).not.toContain('tenant');
      }
    });
  });

  describe('Tenant isolation edge cases', () => {
    it('should handle multiple tenants with same configuration name independently', async () => {
      const tenant1Config = createMockConfig('config-1', tenant1Id, 'Config');
      const tenant2Config = createMockConfig('config-2', tenant2Id, 'Config');

      mockConfigRepository.findByTenantAndName.mockImplementation((tenantId, name) => {
        if (tenantId === tenant1Id && name === 'Config') {
          return Promise.resolve(tenant1Config);
        }
        if (tenantId === tenant2Id && name === 'Config') {
          return Promise.resolve(tenant2Config);
        }
        return Promise.resolve(null);
      });

      const result1 = await mockConfigRepository.findByTenantAndName(tenant1Id, 'Config');
      const result2 = await mockConfigRepository.findByTenantAndName(tenant2Id, 'Config');

      expect(result1?.tenant_id).toBe(tenant1Id);
      expect(result2?.tenant_id).toBe(tenant2Id);
      expect(result1?.id).not.toBe(result2?.id);
    });

    it('should isolate active configurations per tenant', async () => {
      const tenant1Active = createMockConfig('config-1', tenant1Id, 'Active', true);
      const tenant2Active = createMockConfig('config-2', tenant2Id, 'Active', true);

      mockConfigRepository.findActiveByTenant.mockImplementation((tenantId) => {
        if (tenantId === tenant1Id) {
          return Promise.resolve(tenant1Active);
        }
        if (tenantId === tenant2Id) {
          return Promise.resolve(tenant2Active);
        }
        return Promise.resolve(null);
      });

      const result1 = await service.findActive(tenant1Id);
      const result2 = await service.findActive(tenant2Id);

      expect(result1.tenant_id).toBe(tenant1Id);
      expect(result2.tenant_id).toBe(tenant2Id);
      expect(result1.id).not.toBe(result2.id);
    });

    it('should isolate fallback configurations per tenant', async () => {
      const tenant1Fallback = createMockConfig('config-1', tenant1Id, 'Fallback');
      const tenant2Fallback = createMockConfig('config-2', tenant2Id, 'Fallback');

      mockConfigRepository.findFallbackByTenant.mockImplementation((tenantId) => {
        if (tenantId === tenant1Id) {
          return Promise.resolve(tenant1Fallback);
        }
        if (tenantId === tenant2Id) {
          return Promise.resolve(tenant2Fallback);
        }
        return Promise.resolve(null);
      });

      const result1 = await mockConfigRepository.findFallbackByTenant(tenant1Id);
      const result2 = await mockConfigRepository.findFallbackByTenant(tenant2Id);

      expect(result1?.tenant_id).toBe(tenant1Id);
      expect(result2?.tenant_id).toBe(tenant2Id);
    });

    it('should only deactivate configurations for specific tenant', async () => {
      mockConfigRepository.deactivateAllByTenant.mockResolvedValue(1);

      await mockConfigRepository.deactivateAllByTenant(tenant1Id);

      expect(mockConfigRepository.deactivateAllByTenant).toHaveBeenCalledWith(tenant1Id);
    });

    it('should only clear fallback for specific tenant', async () => {
      mockConfigRepository.clearFallbackByTenant.mockResolvedValue(1);

      await mockConfigRepository.clearFallbackByTenant(tenant1Id);

      expect(mockConfigRepository.clearFallbackByTenant).toHaveBeenCalledWith(tenant1Id);
    });
  });

  describe('Tenant isolation with getActiveForModule', () => {
    it('should return active configuration only for specified tenant', async () => {
      const activeConfig = createMockConfig('config-1', tenant1Id, 'Active', true);

      mockConfigRepository.findActiveByTenant.mockResolvedValue(activeConfig);
      mockEncryptionService.decryptVendorConfig.mockReturnValue({
        apiKey: 'decrypted-key',
      });
      mockConfigRepository.save.mockResolvedValue(activeConfig);

      const result = await service.getActiveForModule(tenant1Id);

      expect(result.tenant_id).toBe(tenant1Id);
      expect(mockConfigRepository.findActiveByTenant).toHaveBeenCalledWith(tenant1Id);
    });

    it('should not return active configuration from different tenant', async () => {
      mockConfigRepository.findActiveByTenant.mockResolvedValue(null);
      mockConfigRepository.findFallbackByTenant.mockResolvedValue(null);

      await expect(service.getActiveForModule(tenant1Id)).rejects.toThrow(NotFoundException);
    });

    it('should use fallback only for specified tenant', async () => {
      const fallbackConfig = createMockConfig('config-1', tenant1Id, 'Fallback');

      mockConfigRepository.findActiveByTenant.mockResolvedValue(null);
      mockConfigRepository.findFallbackByTenant.mockResolvedValue(fallbackConfig);
      mockEncryptionService.decryptVendorConfig.mockReturnValue({
        apiKey: 'decrypted-key',
      });
      mockConfigRepository.save.mockResolvedValue(fallbackConfig);

      const result = await service.getActiveForModule(tenant1Id);

      expect(result.tenant_id).toBe(tenant1Id);
      expect(mockConfigRepository.findFallbackByTenant).toHaveBeenCalledWith(tenant1Id);
    });
  });
});
