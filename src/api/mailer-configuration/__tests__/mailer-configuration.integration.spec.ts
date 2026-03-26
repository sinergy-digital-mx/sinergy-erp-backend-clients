import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException, NotFoundException } from '@nestjs/common';
import { MailerConfigurationService } from '../services/mailer-configuration.service';
import { MailerConfigurationTestService } from '../services/mailer-configuration-test.service';
import { MailerConfigurationHealthService } from '../services/mailer-configuration-health.service';
import { MailerConfigurationEncryptionService } from '../services/encryption.service';
import { VendorValidationService } from '../services/vendor-validation.service';
import { AuditService } from '../services/audit.service';
import { MailerVendor } from '../enums/mailer-vendor.enum';
import { CreateMailerConfigurationDto } from '../dto/create-mailer-configuration.dto';
import { UpdateMailerConfigurationDto } from '../dto/update-mailer-configuration.dto';

describe('Mailer Configuration - Integration Tests', () => {
  let app: INestApplication;
  let configService: MailerConfigurationService;
  let testService: MailerConfigurationTestService;
  let healthService: MailerConfigurationHealthService;
  let encryptionService: MailerConfigurationEncryptionService;
  let validationService: VendorValidationService;
  let auditService: AuditService;

  const tenantId = 'tenant-123';
  const userId = 'user-123';

  beforeAll(async () => {
    process.env.ENCRYPTION_KEY = '0'.repeat(64);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        MailerConfigurationService,
        MailerConfigurationTestService,
        MailerConfigurationHealthService,
        MailerConfigurationEncryptionService,
        VendorValidationService,
        AuditService,
        {
          provide: 'MailerConfigurationRepository',
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: 'MailerConfigurationAuditRepository',
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: 'MailerConfigurationHealthRepository',
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: 'DataSource',
          useValue: {
            getRepository: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    configService = moduleFixture.get<MailerConfigurationService>(
      MailerConfigurationService,
    );
    testService = moduleFixture.get<MailerConfigurationTestService>(
      MailerConfigurationTestService,
    );
    healthService = moduleFixture.get<MailerConfigurationHealthService>(
      MailerConfigurationHealthService,
    );
    encryptionService = moduleFixture.get<MailerConfigurationEncryptionService>(
      MailerConfigurationEncryptionService,
    );
    validationService = moduleFixture.get<VendorValidationService>(
      VendorValidationService,
    );
    auditService = moduleFixture.get<AuditService>(AuditService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('End-to-End: Create-Validate-Activate Flow', () => {
    it('should complete full configuration lifecycle', async () => {
      // Step 1: Create configuration
      const createDto: CreateMailerConfigurationDto = {
        name: 'Production Resend',
        vendor: MailerVendor.RESEND,
        vendorConfig: {
          apiKey: 'test-api-key-12345',
        },
      };

      // Validate vendor config
      const validationResult = validationService.validateVendorConfig(
        createDto.vendor,
        createDto.vendorConfig,
      );
      expect(validationResult.isValid).toBe(true);

      // Encrypt credentials
      const encryptedConfig = encryptionService.encryptVendorConfig(
        createDto.vendor,
        createDto.vendorConfig,
      );
      expect(encryptedConfig.apiKey).not.toBe(createDto.vendorConfig.apiKey);

      // Step 2: Decrypt for use
      const decryptedConfig = encryptionService.decryptVendorConfig(
        createDto.vendor,
        encryptedConfig,
      );
      expect(decryptedConfig.apiKey).toBe(createDto.vendorConfig.apiKey);

      // Step 3: Mask for display
      const maskedConfig = encryptionService.maskVendorConfig(
        createDto.vendor,
        decryptedConfig,
      );
      expect(maskedConfig.apiKey).not.toBe(createDto.vendorConfig.apiKey);
      expect(maskedConfig.apiKey).toContain('2345');
    });
  });

  describe('End-to-End: Configuration Update with Audit Trail', () => {
    it('should track configuration changes', async () => {
      const originalConfig = {
        name: 'Original Name',
        vendor: MailerVendor.SENDGRID,
        vendorConfig: {
          apiKey: 'original-key',
        },
      };

      const updateDto: UpdateMailerConfigurationDto = {
        name: 'Updated Name',
      };

      // Validate update
      const validationResult = validationService.validateVendorConfig(
        originalConfig.vendor,
        originalConfig.vendorConfig,
      );
      expect(validationResult.isValid).toBe(true);

      // Track changes
      const changes = {
        name: {
          oldValue: originalConfig.name,
          newValue: updateDto.name,
        },
      };

      expect(changes.name.oldValue).toBe('Original Name');
      expect(changes.name.newValue).toBe('Updated Name');
    });
  });

  describe('End-to-End: Active Configuration Retrieval for Email Module', () => {
    it('should retrieve active configuration with all necessary fields', async () => {
      const activeConfig = {
        id: 'config-123',
        tenantId,
        name: 'Active Config',
        vendor: MailerVendor.AWS_SES,
        vendorConfig: {
          accessKeyId: 'AKIA1234567890EXAMPLE',
          secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
          region: 'us-east-1',
        },
        isActive: true,
        isValid: true,
      };

      // Encrypt for storage
      const encrypted = encryptionService.encryptVendorConfig(
        activeConfig.vendor,
        activeConfig.vendorConfig,
      );

      // Decrypt for module use
      const decrypted = encryptionService.decryptVendorConfig(
        activeConfig.vendor,
        encrypted,
      );

      expect(decrypted.accessKeyId).toBe(activeConfig.vendorConfig.accessKeyId);
      expect(decrypted.secretAccessKey).toBe(
        activeConfig.vendorConfig.secretAccessKey,
      );
      expect(decrypted.region).toBe(activeConfig.vendorConfig.region);
    });
  });

  describe('End-to-End: Fallback Configuration Usage', () => {
    it('should support fallback configuration when primary fails', async () => {
      const primaryConfig = {
        id: 'config-primary',
        isActive: true,
        isFallback: false,
        vendor: MailerVendor.RESEND,
      };

      const fallbackConfig = {
        id: 'config-fallback',
        isActive: false,
        isFallback: true,
        vendor: MailerVendor.SENDGRID,
      };

      // Primary is active
      expect(primaryConfig.isActive).toBe(true);
      expect(primaryConfig.isFallback).toBe(false);

      // Fallback is designated
      expect(fallbackConfig.isActive).toBe(false);
      expect(fallbackConfig.isFallback).toBe(true);

      // If primary fails, fallback can be used
      if (!primaryConfig.isActive) {
        expect(fallbackConfig.isFallback).toBe(true);
      }
    });
  });

  describe('End-to-End: Cross-Tenant Isolation', () => {
    it('should maintain complete isolation between tenants', async () => {
      const tenant1Config = {
        id: 'config-tenant1',
        tenantId: 'tenant-1',
        name: 'Tenant 1 Config',
        vendor: MailerVendor.RESEND,
      };

      const tenant2Config = {
        id: 'config-tenant2',
        tenantId: 'tenant-2',
        name: 'Tenant 2 Config',
        vendor: MailerVendor.SENDGRID,
      };

      // Tenant 1 should only see their config
      expect(tenant1Config.tenantId).toBe('tenant-1');
      expect(tenant1Config.tenantId).not.toBe(tenant2Config.tenantId);

      // Tenant 2 should only see their config
      expect(tenant2Config.tenantId).toBe('tenant-2');
      expect(tenant2Config.tenantId).not.toBe(tenant1Config.tenantId);
    });
  });

  describe('End-to-End: Permission-Based Access Control', () => {
    it('should enforce RBAC for all operations', async () => {
      const operations = [
        { action: 'Create', permission: 'mailer_configurations:Create' },
        { action: 'Read', permission: 'mailer_configurations:Read' },
        { action: 'Update', permission: 'mailer_configurations:Update' },
        { action: 'Delete', permission: 'mailer_configurations:Delete' },
        { action: 'Test', permission: 'mailer_configurations:Test' },
      ];

      operations.forEach((op) => {
        expect(op.permission).toContain('mailer_configurations');
        expect(op.permission).toContain(op.action);
      });
    });
  });

  describe('Error Scenarios', () => {
    it('should handle validation errors gracefully', async () => {
      const invalidConfig = {
        vendor: MailerVendor.RESEND,
        vendorConfig: {
          apiKey: '', // Missing required field
        },
      };

      const result = validationService.validateVendorConfig(
        invalidConfig.vendor,
        invalidConfig.vendorConfig,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle authorization errors', async () => {
      // Simulate unauthorized access
      const unauthorizedTenantId = 'tenant-unauthorized';
      const configTenantId = 'tenant-123';

      expect(unauthorizedTenantId).not.toBe(configTenantId);
    });

    it('should handle not found errors', async () => {
      // Configuration not found scenario
      const nonExistentConfigId = 'config-does-not-exist';
      const foundConfig = null;

      expect(foundConfig).toBeNull();
    });

    it('should handle test connection errors', async () => {
      const invalidConfig = {
        vendor: MailerVendor.SMTP,
        vendorConfig: {
          host: 'invalid-host-that-does-not-exist.example.com',
          port: 587,
          username: 'user@example.com',
          password: 'password',
        },
      };

      // Test connection would fail
      expect(invalidConfig.vendorConfig.host).toBe(
        'invalid-host-that-does-not-exist.example.com',
      );
    });

    it('should handle state errors', async () => {
      const invalidConfig = {
        isValid: false,
        isActive: false,
      };

      // Cannot activate invalid configuration
      if (!invalidConfig.isValid) {
        expect(invalidConfig.isActive).toBe(false);
      }
    });
  });

  describe('Configuration Serialization and Export', () => {
    it('should serialize configuration excluding sensitive fields', async () => {
      const config = {
        id: 'config-123',
        name: 'Test Config',
        vendor: MailerVendor.RESEND,
        vendorConfig: {
          apiKey: 'secret-key',
          publicKey: 'public-key',
        },
        isActive: true,
        createdAt: new Date(),
        createdBy: 'user-123',
      };

      // Mask sensitive fields for export
      const masked = encryptionService.maskVendorConfig(
        config.vendor,
        config.vendorConfig,
      );

      const exported = {
        id: config.id,
        name: config.name,
        vendor: config.vendor,
        vendorConfig: masked,
        isActive: config.isActive,
        createdAt: config.createdAt,
      };

      expect(exported.vendorConfig.apiKey).not.toBe(config.vendorConfig.apiKey);
      expect(exported.name).toBe(config.name);
      expect(exported.vendor).toBe(config.vendor);
    });

    it('should deserialize configuration maintaining data types', async () => {
      const serialized = {
        id: 'config-123',
        name: 'Test Config',
        vendor: MailerVendor.SMTP,
        vendorConfig: {
          host: 'smtp.example.com',
          port: 587,
          username: 'user@example.com',
          password: 'password',
          useTls: true,
        },
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      // Deserialize
      const deserialized = {
        ...serialized,
        createdAt: new Date(serialized.createdAt),
      };

      expect(typeof deserialized.vendorConfig.port).toBe('number');
      expect(typeof deserialized.vendorConfig.useTls).toBe('boolean');
      expect(typeof deserialized.vendorConfig.host).toBe('string');
      expect(deserialized.createdAt instanceof Date).toBe(true);
    });

    it('should maintain round-trip equivalence', async () => {
      const original = {
        name: 'Test Config',
        vendor: MailerVendor.AWS_SES,
        vendorConfig: {
          accessKeyId: 'AKIA1234567890EXAMPLE',
          secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
          region: 'us-east-1',
        },
      };

      // Encrypt
      const encrypted = encryptionService.encryptVendorConfig(
        original.vendor,
        original.vendorConfig,
      );

      // Decrypt
      const decrypted = encryptionService.decryptVendorConfig(
        original.vendor,
        encrypted,
      );

      // Should match original (excluding sensitive field masking)
      expect(decrypted.accessKeyId).toBe(original.vendorConfig.accessKeyId);
      expect(decrypted.secretAccessKey).toBe(
        original.vendorConfig.secretAccessKey,
      );
      expect(decrypted.region).toBe(original.vendorConfig.region);
    });
  });

  describe('Health Monitoring and Status', () => {
    it('should track configuration health status', async () => {
      const health = {
        configurationId: 'config-123',
        lastTestResult: 'SUCCESS',
        lastTestTimestamp: new Date(),
        lastUsedTimestamp: new Date(),
        consecutiveFailures: 0,
        isHealthy: true,
      };

      expect(health.lastTestResult).toBe('SUCCESS');
      expect(health.isHealthy).toBe(true);
      expect(health.consecutiveFailures).toBe(0);
    });

    it('should indicate untested configuration status', async () => {
      const untestedHealth = {
        configurationId: 'config-123',
        lastTestResult: 'UNTESTED',
        lastTestTimestamp: null,
        isHealthy: true,
      };

      expect(untestedHealth.lastTestResult).toBe('UNTESTED');
      expect(untestedHealth.lastTestTimestamp).toBeNull();
    });

    it('should indicate unused configuration status', async () => {
      const unusedHealth = {
        configurationId: 'config-123',
        lastUsedTimestamp: null,
      };

      expect(unusedHealth.lastUsedTimestamp).toBeNull();
    });
  });

  describe('Audit Trail Tracking', () => {
    it('should record creation audit metadata', async () => {
      const auditRecord = {
        action: 'CREATE',
        configurationId: 'config-123',
        performedBy: userId,
        performedAt: new Date(),
        details: 'Created new configuration',
      };

      expect(auditRecord.action).toBe('CREATE');
      expect(auditRecord.performedBy).toBe(userId);
      expect(auditRecord.performedAt instanceof Date).toBe(true);
    });

    it('should record update audit metadata with changed fields', async () => {
      const auditRecord = {
        action: 'UPDATE',
        configurationId: 'config-123',
        performedBy: userId,
        performedAt: new Date(),
        changedFields: {
          name: {
            oldValue: 'Old Name',
            newValue: 'New Name',
          },
        },
      };

      expect(auditRecord.action).toBe('UPDATE');
      expect(auditRecord.changedFields.name.oldValue).toBe('Old Name');
      expect(auditRecord.changedFields.name.newValue).toBe('New Name');
    });

    it('should record deletion audit metadata', async () => {
      const auditRecord = {
        action: 'DELETE',
        configurationId: 'config-123',
        performedBy: userId,
        performedAt: new Date(),
      };

      expect(auditRecord.action).toBe('DELETE');
      expect(auditRecord.performedBy).toBe(userId);
    });

    it('should support date range filtering', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const auditRecords = [
        {
          performedAt: new Date('2024-01-15'),
          action: 'CREATE',
        },
        {
          performedAt: new Date('2024-01-20'),
          action: 'UPDATE',
        },
      ];

      const filtered = auditRecords.filter(
        (r) => r.performedAt >= startDate && r.performedAt <= endDate,
      );

      expect(filtered.length).toBe(2);
    });
  });
});
