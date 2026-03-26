import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
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
import { MailerConfigurationAuditAction } from '../../../../entities/mailer-configuration/mailer-configuration-audit.entity';

/**
 * Active Configuration Management Tests
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4
 *
 * Tests verify that:
 * 1. Only one configuration can be active per tenant
 * 2. Changing active configuration deactivates the previous one
 * 3. Retrieving active configuration returns the correct one
 * 4. Cannot activate an invalid configuration
 * 5. Activating a configuration records an audit event
 */
describe('Active Configuration Management - MailerConfigurationService', () => {
  let service: MailerConfigurationService;
  let mockConfigRepository: jest.Mocked<MailerConfigurationRepository>;
  let mockHealthRepository: jest.Mocked<any>;
  let mockEncryptionService: jest.Mocked<MailerConfigurationEncryptionService>;
  let mockValidationService: jest.Mocked<VendorValidationService>;
  let mockAuditService: jest.Mocked<AuditService>;
  let mockDataSource: jest.Mocked<DataSource>;

  // Test data
  const tenantId = 'tenant-001';
  const userId = 'user-001';

  const createMockConfig = (
    id: string,
    name: string,
    isActive: boolean = false,
    isValid: boolean = true,
  ): MailerConfiguration => ({
    id,
    tenant_id: tenantId,
    name,
    vendor: MailerVendor.RESEND,
    vendor_config: { apiKey: 'encrypted-key' },
    is_active: isActive,
    is_fallback: false,
    is_valid: isValid,
    created_at: new Date(),
    created_by: userId,
    updated_at: new Date(),
    updated_by: userId,
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

  describe('Requirement 6.1: Only one configuration can be active per tenant', () => {
    it('should allow setting a configuration as active', async () => {
      const config = createMockConfig('config-1', 'Config 1', false, true);

      mockConfigRepository.findByTenantAndId.mockResolvedValue(config);
      mockConfigRepository.deactivateAllByTenant.mockResolvedValue(0);
      mockConfigRepository.save.mockResolvedValue({
        ...config,
        is_active: true,
      });

      const result = await service.setActive(tenantId, 'config-1', userId);

      expect(result.is_active).toBe(true);
    });

    it('should prevent multiple active configurations by deactivating others', async () => {
      const config1 = createMockConfig('config-1', 'Config 1', true, true);
      const config2 = createMockConfig('config-2', 'Config 2', false, true);

      mockConfigRepository.findByTenantAndId.mockResolvedValue(config2);
      mockConfigRepository.deactivateAllByTenant.mockResolvedValue(1);
      mockConfigRepository.save.mockResolvedValue({
        ...config2,
        is_active: true,
      });

      await service.setActive(tenantId, 'config-2', userId);

      expect(mockConfigRepository.deactivateAllByTenant).toHaveBeenCalledWith(tenantId);
    });

    it('should ensure only one active configuration exists after setActive', async () => {
      const config = createMockConfig('config-1', 'Config 1', false, true);

      mockConfigRepository.findByTenantAndId.mockResolvedValue(config);
      mockConfigRepository.deactivateAllByTenant.mockResolvedValue(1);
      mockConfigRepository.save.mockResolvedValue({
        ...config,
        is_active: true,
      });

      await service.setActive(tenantId, 'config-1', userId);

      // Verify deactivateAllByTenant was called to ensure only one active
      expect(mockConfigRepository.deactivateAllByTenant).toHaveBeenCalledWith(tenantId);
    });

    it('should handle tenant with no previous active configuration', async () => {
      const config = createMockConfig('config-1', 'Config 1', false, true);

      mockConfigRepository.findByTenantAndId.mockResolvedValue(config);
      mockConfigRepository.deactivateAllByTenant.mockResolvedValue(0);
      mockConfigRepository.save.mockResolvedValue({
        ...config,
        is_active: true,
      });

      const result = await service.setActive(tenantId, 'config-1', userId);

      expect(result.is_active).toBe(true);
      expect(mockConfigRepository.deactivateAllByTenant).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('Requirement 6.2: Changing active configuration deactivates the previous one', () => {
    it('should deactivate previous active configuration when setting new one', async () => {
      const previousActive = createMockConfig('config-1', 'Previous Active', true, true);
      const newActive = createMockConfig('config-2', 'New Active', false, true);

      mockConfigRepository.findByTenantAndId.mockResolvedValue(newActive);
      mockConfigRepository.deactivateAllByTenant.mockResolvedValue(1);
      mockConfigRepository.save.mockResolvedValue({
        ...newActive,
        is_active: true,
      });

      await service.setActive(tenantId, 'config-2', userId);

      expect(mockConfigRepository.deactivateAllByTenant).toHaveBeenCalledWith(tenantId);
    });

    it('should update timestamp when changing active configuration', async () => {
      const config = createMockConfig('config-1', 'Config 1', false, true);
      const beforeTime = new Date();

      mockConfigRepository.findByTenantAndId.mockResolvedValue(config);
      mockConfigRepository.deactivateAllByTenant.mockResolvedValue(1);
      mockConfigRepository.save.mockImplementation((cfg) => {
        return Promise.resolve({
          ...cfg,
          is_active: true,
          updated_at: new Date(),
        });
      });

      const result = await service.setActive(tenantId, 'config-1', userId);

      expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });

    it('should record updated_by user when changing active configuration', async () => {
      const config = createMockConfig('config-1', 'Config 1', false, true);
      const newUserId = 'user-002';

      mockConfigRepository.findByTenantAndId.mockResolvedValue(config);
      mockConfigRepository.deactivateAllByTenant.mockResolvedValue(1);
      mockConfigRepository.save.mockImplementation((cfg) => {
        return Promise.resolve({
          ...cfg,
          is_active: true,
          updated_by: newUserId,
        });
      });

      const result = await service.setActive(tenantId, 'config-1', newUserId);

      expect(result.updated_by).toBe(newUserId);
    });

    it('should handle switching between multiple configurations', async () => {
      const config1 = createMockConfig('config-1', 'Config 1', true, true);
      const config2 = createMockConfig('config-2', 'Config 2', false, true);
      const config3 = createMockConfig('config-3', 'Config 3', false, true);

      // First switch: config-1 to config-2
      mockConfigRepository.findByTenantAndId.mockResolvedValue(config2);
      mockConfigRepository.deactivateAllByTenant.mockResolvedValue(1);
      mockConfigRepository.save.mockResolvedValue({
        ...config2,
        is_active: true,
      });

      await service.setActive(tenantId, 'config-2', userId);

      // Second switch: config-2 to config-3
      mockConfigRepository.findByTenantAndId.mockResolvedValue(config3);
      mockConfigRepository.deactivateAllByTenant.mockResolvedValue(1);
      mockConfigRepository.save.mockResolvedValue({
        ...config3,
        is_active: true,
      });

      await service.setActive(tenantId, 'config-3', userId);

      expect(mockConfigRepository.deactivateAllByTenant).toHaveBeenCalledTimes(2);
    });
  });

  describe('Requirement 6.3: Retrieving active configuration returns the correct one', () => {
    it('should return the active configuration for a tenant', async () => {
      const activeConfig = createMockConfig('config-1', 'Active Config', true, true);

      mockConfigRepository.findActiveByTenant.mockResolvedValue(activeConfig);

      const result = await service.findActive(tenantId);

      expect(result.id).toBe('config-1');
      expect(result.is_active).toBe(true);
      expect(result.tenant_id).toBe(tenantId);
    });

    it('should throw NotFoundException when no active configuration exists', async () => {
      mockConfigRepository.findActiveByTenant.mockResolvedValue(null);

      await expect(service.findActive(tenantId)).rejects.toThrow(NotFoundException);
    });

    it('should return only the active configuration, not inactive ones', async () => {
      const activeConfig = createMockConfig('config-1', 'Active Config', true, true);

      mockConfigRepository.findActiveByTenant.mockResolvedValue(activeConfig);

      const result = await service.findActive(tenantId);

      expect(result.is_active).toBe(true);
      expect(mockConfigRepository.findActiveByTenant).toHaveBeenCalledWith(tenantId);
    });

    it('should return correct active configuration when multiple exist', async () => {
      const activeConfig = createMockConfig('config-2', 'Active Config', true, true);

      mockConfigRepository.findActiveByTenant.mockResolvedValue(activeConfig);

      const result = await service.findActive(tenantId);

      expect(result.id).toBe('config-2');
      expect(result.is_active).toBe(true);
    });

    it('should include all necessary fields in active configuration response', async () => {
      const activeConfig = createMockConfig('config-1', 'Active Config', true, true);

      mockConfigRepository.findActiveByTenant.mockResolvedValue(activeConfig);

      const result = await service.findActive(tenantId);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('tenant_id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('vendor');
      expect(result).toHaveProperty('is_active');
      expect(result).toHaveProperty('created_at');
      expect(result).toHaveProperty('updated_at');
    });
  });

  describe('Requirement 6.4: Cannot activate an invalid configuration', () => {
    it('should throw BadRequestException when activating invalid configuration', async () => {
      const invalidConfig = createMockConfig('config-1', 'Invalid Config', false, false);

      mockConfigRepository.findByTenantAndId.mockResolvedValue(invalidConfig);

      await expect(service.setActive(tenantId, 'config-1', userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should not deactivate other configurations when activation fails', async () => {
      const invalidConfig = createMockConfig('config-1', 'Invalid Config', false, false);

      mockConfigRepository.findByTenantAndId.mockResolvedValue(invalidConfig);

      try {
        await service.setActive(tenantId, 'config-1', userId);
      } catch (error) {
        // Expected to throw
      }

      expect(mockConfigRepository.deactivateAllByTenant).not.toHaveBeenCalled();
    });

    it('should not save configuration when it is invalid', async () => {
      const invalidConfig = createMockConfig('config-1', 'Invalid Config', false, false);

      mockConfigRepository.findByTenantAndId.mockResolvedValue(invalidConfig);

      try {
        await service.setActive(tenantId, 'config-1', userId);
      } catch (error) {
        // Expected to throw
      }

      expect(mockConfigRepository.save).not.toHaveBeenCalled();
    });

    it('should provide descriptive error message for invalid configuration', async () => {
      const invalidConfig = createMockConfig('config-1', 'Invalid Config', false, false);

      mockConfigRepository.findByTenantAndId.mockResolvedValue(invalidConfig);

      try {
        await service.setActive(tenantId, 'config-1', userId);
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('invalid');
      }
    });

    it('should allow activating a valid configuration', async () => {
      const validConfig = createMockConfig('config-1', 'Valid Config', false, true);

      mockConfigRepository.findByTenantAndId.mockResolvedValue(validConfig);
      mockConfigRepository.deactivateAllByTenant.mockResolvedValue(0);
      mockConfigRepository.save.mockResolvedValue({
        ...validConfig,
        is_active: true,
      });

      const result = await service.setActive(tenantId, 'config-1', userId);

      expect(result.is_active).toBe(true);
    });
  });

  describe('Requirement 6.5: Activating a configuration records audit event', () => {
    it('should record audit event when activating configuration', async () => {
      const config = createMockConfig('config-1', 'Config 1', false, true);

      mockConfigRepository.findByTenantAndId.mockResolvedValue(config);
      mockConfigRepository.deactivateAllByTenant.mockResolvedValue(0);
      mockConfigRepository.save.mockResolvedValue({
        ...config,
        is_active: true,
      });

      await service.setActive(tenantId, 'config-1', userId);

      expect(mockAuditService.recordAuditEvent).toHaveBeenCalled();
    });

    it('should record audit event with correct configuration ID', async () => {
      const config = createMockConfig('config-1', 'Config 1', false, true);

      mockConfigRepository.findByTenantAndId.mockResolvedValue(config);
      mockConfigRepository.deactivateAllByTenant.mockResolvedValue(0);
      mockConfigRepository.save.mockResolvedValue({
        ...config,
        is_active: true,
      });

      await service.setActive(tenantId, 'config-1', userId);

      expect(mockAuditService.recordAuditEvent).toHaveBeenCalledWith(
        'config-1',
        tenantId,
        MailerConfigurationAuditAction.ACTIVATE,
        userId,
        expect.any(String),
      );
    });

    it('should record audit event with correct tenant ID', async () => {
      const config = createMockConfig('config-1', 'Config 1', false, true);

      mockConfigRepository.findByTenantAndId.mockResolvedValue(config);
      mockConfigRepository.deactivateAllByTenant.mockResolvedValue(0);
      mockConfigRepository.save.mockResolvedValue({
        ...config,
        is_active: true,
      });

      await service.setActive(tenantId, 'config-1', userId);

      expect(mockAuditService.recordAuditEvent).toHaveBeenCalledWith(
        expect.any(String),
        tenantId,
        expect.any(String),
        expect.any(String),
        expect.any(String),
      );
    });

    it('should record audit event with correct user ID', async () => {
      const config = createMockConfig('config-1', 'Config 1', false, true);
      const newUserId = 'user-002';

      mockConfigRepository.findByTenantAndId.mockResolvedValue(config);
      mockConfigRepository.deactivateAllByTenant.mockResolvedValue(0);
      mockConfigRepository.save.mockResolvedValue({
        ...config,
        is_active: true,
      });

      await service.setActive(tenantId, 'config-1', newUserId);

      expect(mockAuditService.recordAuditEvent).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        newUserId,
        expect.any(String),
      );
    });

    it('should record audit event with ACTIVATE action', async () => {
      const config = createMockConfig('config-1', 'Config 1', false, true);

      mockConfigRepository.findByTenantAndId.mockResolvedValue(config);
      mockConfigRepository.deactivateAllByTenant.mockResolvedValue(0);
      mockConfigRepository.save.mockResolvedValue({
        ...config,
        is_active: true,
      });

      await service.setActive(tenantId, 'config-1', userId);

      expect(mockAuditService.recordAuditEvent).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        MailerConfigurationAuditAction.ACTIVATE,
        expect.any(String),
        expect.any(String),
      );
    });

    it('should include configuration name in audit event message', async () => {
      const config = createMockConfig('config-1', 'My Config Name', false, true);

      mockConfigRepository.findByTenantAndId.mockResolvedValue(config);
      mockConfigRepository.deactivateAllByTenant.mockResolvedValue(0);
      mockConfigRepository.save.mockResolvedValue({
        ...config,
        is_active: true,
      });

      await service.setActive(tenantId, 'config-1', userId);

      expect(mockAuditService.recordAuditEvent).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.stringContaining('My Config Name'),
      );
    });

    it('should not record audit event if activation fails', async () => {
      const invalidConfig = createMockConfig('config-1', 'Invalid Config', false, false);

      mockConfigRepository.findByTenantAndId.mockResolvedValue(invalidConfig);

      try {
        await service.setActive(tenantId, 'config-1', userId);
      } catch (error) {
        // Expected to throw
      }

      expect(mockAuditService.recordAuditEvent).not.toHaveBeenCalled();
    });
  });

  describe('Active configuration edge cases', () => {
    it('should handle activating the same configuration twice', async () => {
      const config = createMockConfig('config-1', 'Config 1', true, true);

      mockConfigRepository.findByTenantAndId.mockResolvedValue(config);
      mockConfigRepository.deactivateAllByTenant.mockResolvedValue(1);
      mockConfigRepository.save.mockResolvedValue({
        ...config,
        is_active: true,
      });

      const result = await service.setActive(tenantId, 'config-1', userId);

      expect(result.is_active).toBe(true);
    });

    it('should handle rapid configuration switches', async () => {
      const config1 = createMockConfig('config-1', 'Config 1', false, true);
      const config2 = createMockConfig('config-2', 'Config 2', false, true);

      mockConfigRepository.findByTenantAndId.mockResolvedValue(config1);
      mockConfigRepository.deactivateAllByTenant.mockResolvedValue(0);
      mockConfigRepository.save.mockResolvedValue({
        ...config1,
        is_active: true,
      });

      await service.setActive(tenantId, 'config-1', userId);

      mockConfigRepository.findByTenantAndId.mockResolvedValue(config2);
      mockConfigRepository.deactivateAllByTenant.mockResolvedValue(1);
      mockConfigRepository.save.mockResolvedValue({
        ...config2,
        is_active: true,
      });

      await service.setActive(tenantId, 'config-2', userId);

      expect(mockConfigRepository.deactivateAllByTenant).toHaveBeenCalledTimes(2);
    });

    it('should handle configuration not found error', async () => {
      mockConfigRepository.findByTenantAndId.mockResolvedValue(null);

      await expect(service.setActive(tenantId, 'non-existent', userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should preserve other configuration properties when activating', async () => {
      const config = createMockConfig('config-1', 'Config 1', false, true);

      mockConfigRepository.findByTenantAndId.mockResolvedValue(config);
      mockConfigRepository.deactivateAllByTenant.mockResolvedValue(0);
      mockConfigRepository.save.mockResolvedValue({
        ...config,
        is_active: true,
      });

      const result = await service.setActive(tenantId, 'config-1', userId);

      expect(result.name).toBe('Config 1');
      expect(result.vendor).toBe(MailerVendor.RESEND);
      expect(result.tenant_id).toBe(tenantId);
    });
  });
});
