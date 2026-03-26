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
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('MailerConfigurationService', () => {
  let service: MailerConfigurationService;
  let mockConfigRepository: jest.Mocked<MailerConfigurationRepository>;
  let mockHealthRepository: jest.Mocked<any>;
  let mockEncryptionService: jest.Mocked<MailerConfigurationEncryptionService>;
  let mockValidationService: jest.Mocked<VendorValidationService>;
  let mockAuditService: jest.Mocked<AuditService>;
  let mockDataSource: jest.Mocked<DataSource>;

  const mockConfig: MailerConfiguration = {
    id: 'config-123',
    tenant_id: 'tenant-123',
    name: 'Test Config',
    vendor: MailerVendor.RESEND,
    vendor_config: { apiKey: 'encrypted-key' },
    is_active: false,
    is_fallback: false,
    is_valid: true,
    created_at: new Date(),
    created_by: 'user-123',
    updated_at: new Date(),
    updated_by: 'user-123',
    deleted_at: null,
    deleted_by: null,
    last_test_result: null,
    last_test_timestamp: null,
    last_used_timestamp: null,
    tenant: null as any,
    audit_records: [],
    health: null,
  };

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

  describe('create', () => {
    it('should create a new mailer configuration', async () => {
      const dto: CreateMailerConfigurationDto = {
        name: 'Test Config',
        vendor: MailerVendor.RESEND,
        vendorConfig: { apiKey: 'test-key' },
      };

      mockValidationService.validateVendorConfig.mockReturnValue({
        isValid: true,
        errors: [],
      });

      mockEncryptionService.encryptVendorConfig.mockReturnValue({
        apiKey: 'encrypted-key',
      });

      mockConfigRepository.findByTenantAndName.mockResolvedValue(null);
      mockConfigRepository.create.mockReturnValue(mockConfig);
      mockConfigRepository.save.mockResolvedValue(mockConfig);
      mockHealthRepository.create.mockReturnValue({
        configuration_id: 'config-123',
        tenant_id: 'tenant-123',
        last_test_result: MailerConfigurationHealthTestResult.UNTESTED,
        consecutive_failures: 0,
        is_healthy: true,
      } as any);
      mockHealthRepository.save.mockResolvedValue({} as any);

      const result = await service.create('tenant-123', dto, 'user-123');

      expect(mockValidationService.validateVendorConfig).toHaveBeenCalledWith(
        MailerVendor.RESEND,
        dto.vendorConfig,
      );
      expect(mockEncryptionService.encryptVendorConfig).toHaveBeenCalled();
      expect(mockConfigRepository.save).toHaveBeenCalled();
      expect(mockAuditService.recordAuditEvent).toHaveBeenCalled();
      expect(result).toEqual(mockConfig);
    });

    it('should reject duplicate configuration name for tenant', async () => {
      const dto: CreateMailerConfigurationDto = {
        name: 'Test Config',
        vendor: MailerVendor.RESEND,
        vendorConfig: { apiKey: 'test-key' },
      };

      mockConfigRepository.findByTenantAndName.mockResolvedValue(mockConfig);

      await expect(service.create('tenant-123', dto, 'user-123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject invalid vendor configuration', async () => {
      const dto: CreateMailerConfigurationDto = {
        name: 'Test Config',
        vendor: MailerVendor.RESEND,
        vendorConfig: { apiKey: '' },
      };

      mockConfigRepository.findByTenantAndName.mockResolvedValue(null);
      mockValidationService.validateVendorConfig.mockReturnValue({
        isValid: false,
        errors: ['apiKey is required'],
      });

      await expect(service.create('tenant-123', dto, 'user-123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should record audit event on creation', async () => {
      const dto: CreateMailerConfigurationDto = {
        name: 'Test Config',
        vendor: MailerVendor.RESEND,
        vendorConfig: { apiKey: 'test-key' },
      };

      mockConfigRepository.findByTenantAndName.mockResolvedValue(null);
      mockValidationService.validateVendorConfig.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockEncryptionService.encryptVendorConfig.mockReturnValue({
        apiKey: 'encrypted-key',
      });
      mockConfigRepository.create.mockReturnValue(mockConfig);
      mockConfigRepository.save.mockResolvedValue(mockConfig);
      mockHealthRepository.create.mockReturnValue({} as any);
      mockHealthRepository.save.mockResolvedValue({} as any);

      await service.create('tenant-123', dto, 'user-123');

      expect(mockAuditService.recordAuditEvent).toHaveBeenCalledWith(
        'config-123',
        'tenant-123',
        expect.any(String),
        'user-123',
        expect.stringContaining('Created mailer configuration'),
      );
    });
  });

  describe('findById', () => {
    it('should find configuration by ID', async () => {
      mockConfigRepository.findByTenantAndId.mockResolvedValue(mockConfig);

      const result = await service.findById('tenant-123', 'config-123');

      expect(mockConfigRepository.findByTenantAndId).toHaveBeenCalledWith('tenant-123', 'config-123');
      expect(result).toEqual(mockConfig);
    });

    it('should throw NotFoundException if configuration not found', async () => {
      mockConfigRepository.findByTenantAndId.mockResolvedValue(null);

      await expect(service.findById('tenant-123', 'config-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should enforce tenant isolation on read', async () => {
      mockConfigRepository.findByTenantAndId.mockResolvedValue(null);

      await expect(service.findById('tenant-456', 'config-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByTenant', () => {
    it('should find configurations by tenant with pagination', async () => {
      const configs = [mockConfig];
      mockConfigRepository.findByTenantWithPagination.mockResolvedValue({
        data: configs,
        total: 1,
        page: 1,
        limit: 10,
      } as any);

      const result = await service.findByTenant('tenant-123', {
        page: 1,
        limit: 10,
      });

      expect(result.data).toEqual(configs);
      expect(result.total).toBe(1);
      expect(mockConfigRepository.findByTenantWithPagination).toHaveBeenCalledWith(
        'tenant-123',
        expect.objectContaining({ page: 1, limit: 10 }),
      );
    });

    it('should filter by vendor type', async () => {
      const configs = [mockConfig];
      mockConfigRepository.findByTenantWithPagination.mockResolvedValue({
        data: configs,
        total: 1,
        page: 1,
        limit: 10,
      } as any);

      await service.findByTenant('tenant-123', {
        page: 1,
        limit: 10,
        vendor: MailerVendor.RESEND,
      });

      expect(mockConfigRepository.findByTenantWithPagination).toHaveBeenCalledWith(
        'tenant-123',
        expect.objectContaining({ vendor: MailerVendor.RESEND }),
      );
    });

    it('should support pagination with custom page and limit', async () => {
      const configs = [mockConfig];
      mockConfigRepository.findByTenantWithPagination.mockResolvedValue({
        data: configs,
        total: 50,
        page: 2,
        limit: 25,
      } as any);

      const result = await service.findByTenant('tenant-123', {
        page: 2,
        limit: 25,
      });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(25);
    });
  });

  describe('findActive', () => {
    it('should find active configuration for tenant', async () => {
      const activeConfig = { ...mockConfig, is_active: true };
      mockConfigRepository.findActiveByTenant.mockResolvedValue(activeConfig);

      const result = await service.findActive('tenant-123');

      expect(mockConfigRepository.findActiveByTenant).toHaveBeenCalledWith('tenant-123');
      expect(result).toEqual(activeConfig);
    });

    it('should throw NotFoundException if no active configuration', async () => {
      mockConfigRepository.findActiveByTenant.mockResolvedValue(null);

      await expect(service.findActive('tenant-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update mailer configuration', async () => {
      const dto: UpdateMailerConfigurationDto = {
        name: 'Updated Config',
      };

      mockConfigRepository.findByTenantAndId.mockResolvedValue(mockConfig);
      mockConfigRepository.findByTenantAndName.mockResolvedValue(null);
      mockValidationService.validateVendorConfig.mockReturnValue({
        isValid: true,
        errors: [],
      });

      const updatedConfig = { ...mockConfig, name: 'Updated Config' };
      mockConfigRepository.save.mockResolvedValue(updatedConfig);

      const result = await service.update('tenant-123', 'config-123', dto, 'user-123');

      expect(mockConfigRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Config');
      expect(mockAuditService.recordAuditEvent).toHaveBeenCalled();
    });

    it('should reject duplicate name for tenant', async () => {
      const dto: UpdateMailerConfigurationDto = {
        name: 'Existing Config',
      };

      const existingConfig = { ...mockConfig, id: 'config-456', name: 'Existing Config' };
      mockConfigRepository.findByTenantAndId.mockResolvedValue(mockConfig);
      mockConfigRepository.findByTenantAndName.mockResolvedValue(existingConfig);

      await expect(
        service.update('tenant-123', 'config-123', dto, 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow updating vendor config with valid data', async () => {
      const dto: UpdateMailerConfigurationDto = {
        vendorConfig: { apiKey: 'new-key' },
      };

      mockConfigRepository.findByTenantAndId.mockResolvedValue(mockConfig);
      mockValidationService.validateVendorConfig.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockEncryptionService.encryptVendorConfig.mockReturnValue({
        apiKey: 'encrypted-new-key',
      });

      const updatedConfig = { ...mockConfig, vendor_config: { apiKey: 'encrypted-new-key' } };
      mockConfigRepository.save.mockResolvedValue(updatedConfig);

      const result = await service.update('tenant-123', 'config-123', dto, 'user-123');

      expect(mockEncryptionService.encryptVendorConfig).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should reject invalid vendor config on update', async () => {
      const dto: UpdateMailerConfigurationDto = {
        vendorConfig: { apiKey: '' },
      };

      mockConfigRepository.findByTenantAndId.mockResolvedValue(mockConfig);
      mockValidationService.validateVendorConfig.mockReturnValue({
        isValid: false,
        errors: ['apiKey is required'],
      });

      await expect(
        service.update('tenant-123', 'config-123', dto, 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should enforce tenant isolation on update', async () => {
      mockConfigRepository.findByTenantAndId.mockResolvedValue(null);

      await expect(
        service.update('tenant-456', 'config-123', {}, 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should record audit event with changed fields', async () => {
      const dto: UpdateMailerConfigurationDto = {
        name: 'Updated Config',
      };

      const configCopy = { ...mockConfig };
      mockConfigRepository.findByTenantAndId.mockResolvedValue(configCopy);
      mockConfigRepository.findByTenantAndName.mockResolvedValue(null);
      mockValidationService.validateVendorConfig.mockReturnValue({
        isValid: true,
        errors: [],
      });

      const updatedConfig = { ...configCopy, name: 'Updated Config' };
      mockConfigRepository.save.mockResolvedValue(updatedConfig);

      await service.update('tenant-123', 'config-123', dto, 'user-123');

      expect(mockAuditService.recordAuditEvent).toHaveBeenCalled();
      const callArgs = (mockAuditService.recordAuditEvent as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toBe('config-123');
      expect(callArgs[1]).toBe('tenant-123');
      expect(callArgs[3]).toBe('user-123');
      expect(callArgs[4]).toContain('Updated mailer configuration');
    });
  });

  describe('delete', () => {
    it('should delete mailer configuration', async () => {
      mockConfigRepository.findByTenantAndId.mockResolvedValue(mockConfig);
      mockConfigRepository.remove.mockResolvedValue(undefined);

      await service.delete('tenant-123', 'config-123', 'user-123');

      expect(mockConfigRepository.remove).toHaveBeenCalled();
      expect(mockAuditService.recordAuditEvent).toHaveBeenCalled();
    });

    it('should throw NotFoundException for cross-tenant delete', async () => {
      mockConfigRepository.findByTenantAndId.mockResolvedValue(null);

      await expect(
        service.delete('tenant-456', 'config-123', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setActive', () => {
    it('should set configuration as active', async () => {
      mockConfigRepository.findByTenantAndId.mockResolvedValue(mockConfig);
      (mockConfigRepository.deactivateAllByTenant as jest.Mock).mockResolvedValue(undefined);

      const activeConfig = { ...mockConfig, is_active: true };
      mockConfigRepository.save.mockResolvedValue(activeConfig);

      const result = await service.setActive('tenant-123', 'config-123', 'user-123');

      expect(result.is_active).toBe(true);
      expect(mockAuditService.recordAuditEvent).toHaveBeenCalled();
    });

    it('should deactivate previous active configuration', async () => {
      mockConfigRepository.findByTenantAndId.mockResolvedValue(mockConfig);
      (mockConfigRepository.deactivateAllByTenant as jest.Mock).mockResolvedValue(undefined);

      mockConfigRepository.save.mockResolvedValue({ ...mockConfig, is_active: true });

      await service.setActive('tenant-123', 'config-123', 'user-123');

      expect(mockConfigRepository.deactivateAllByTenant).toHaveBeenCalledWith('tenant-123');
      expect(mockConfigRepository.save).toHaveBeenCalled();
    });

    it('should throw error if configuration is invalid', async () => {
      const invalidConfig = { ...mockConfig, is_valid: false };
      mockConfigRepository.findByTenantAndId.mockResolvedValue(invalidConfig);

      await expect(
        service.setActive('tenant-123', 'config-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('setFallback', () => {
    it('should set configuration as fallback', async () => {
      mockConfigRepository.findByTenantAndId.mockResolvedValue(mockConfig);
      (mockConfigRepository.clearFallbackByTenant as jest.Mock).mockResolvedValue(undefined);

      const fallbackConfig = { ...mockConfig, is_fallback: true };
      mockConfigRepository.save.mockResolvedValue(fallbackConfig);

      const result = await service.setFallback('tenant-123', 'config-123', 'user-123');

      expect(result.is_fallback).toBe(true);
    });

    it('should clear previous fallback configuration', async () => {
      mockConfigRepository.findByTenantAndId.mockResolvedValue(mockConfig);
      (mockConfigRepository.clearFallbackByTenant as jest.Mock).mockResolvedValue(undefined);

      mockConfigRepository.save.mockResolvedValue({ ...mockConfig, is_fallback: true });

      await service.setFallback('tenant-123', 'config-123', 'user-123');

      expect(mockConfigRepository.clearFallbackByTenant).toHaveBeenCalledWith('tenant-123');
      expect(mockConfigRepository.save).toHaveBeenCalled();
    });
  });

  describe('clearFallback', () => {
    it('should clear fallback configuration', async () => {
      const fallbackConfig = { ...mockConfig, is_fallback: true };
      mockConfigRepository.findFallbackByTenant.mockResolvedValue(fallbackConfig);

      mockConfigRepository.save.mockResolvedValue({ ...mockConfig, is_fallback: false });

      await service.clearFallback('tenant-123', 'user-123');

      expect(mockConfigRepository.save).toHaveBeenCalled();
    });
  });

  describe('getActiveForModule', () => {
    it('should retrieve active configuration with decrypted credentials', async () => {
      const activeConfig = { ...mockConfig, is_active: true };
      mockConfigRepository.findActiveByTenant.mockResolvedValue(activeConfig);

      mockEncryptionService.decryptVendorConfig.mockReturnValue({
        apiKey: 'decrypted-key',
      });

      const result = await service.getActiveForModule('tenant-123');

      expect(mockEncryptionService.decryptVendorConfig).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if no active configuration', async () => {
      mockConfigRepository.findActiveByTenant.mockResolvedValue(null);

      await expect(service.getActiveForModule('tenant-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('validateConfiguration', () => {
    it('should validate configuration', () => {
      mockValidationService.validateVendorConfig.mockReturnValue({
        isValid: true,
        errors: [],
      });

      const result = service.validateConfiguration(MailerVendor.RESEND, {
        apiKey: 'test-key',
      });

      expect(result.isValid).toBe(true);
    });

    it('should return validation errors', () => {
      mockValidationService.validateVendorConfig.mockReturnValue({
        isValid: false,
        errors: ['apiKey is required'],
      });

      const result = service.validateConfiguration(MailerVendor.RESEND, {
        apiKey: '',
      } as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('apiKey is required');
    });
  });

  describe('Tenant isolation', () => {
    it('should not allow access to other tenant configurations', async () => {
      mockConfigRepository.findByTenantAndId.mockResolvedValue(null);

      await expect(
        service.findById('tenant-456', 'config-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should only return configurations for the requesting tenant', async () => {
      mockConfigRepository.findByTenantWithPagination.mockResolvedValue({
        data: [mockConfig],
        total: 1,
        page: 1,
        limit: 10,
      });

      await service.findByTenant('tenant-123', { page: 1, limit: 10 });

      expect(mockConfigRepository.findByTenantWithPagination).toHaveBeenCalledWith(
        'tenant-123',
        expect.any(Object),
      );
    });
  });
});
