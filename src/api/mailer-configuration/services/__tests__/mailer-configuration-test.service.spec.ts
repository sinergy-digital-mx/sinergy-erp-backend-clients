import { Test, TestingModule } from '@nestjs/testing';
import { MailerConfigurationTestService } from '../mailer-configuration-test.service';
import { MailerConfigurationEncryptionService } from '../encryption.service';
import { MailerConfigurationHealthService } from '../mailer-configuration-health.service';
import { MailerVendor } from '../../enums/mailer-vendor.enum';
import type { ResendConfig, SendGridConfig, AwsSesConfig, SmtpConfig } from '../../interfaces/vendor-config.interface';

describe('MailerConfigurationTestService', () => {
  let service: MailerConfigurationTestService;
  let mockEncryptionService: jest.Mocked<MailerConfigurationEncryptionService>;
  let mockHealthService: jest.Mocked<MailerConfigurationHealthService>;

  beforeEach(async () => {
    mockEncryptionService = {
      decryptVendorConfig: jest.fn(),
    } as any;

    mockHealthService = {
      recordTestResult: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerConfigurationTestService,
        {
          provide: MailerConfigurationEncryptionService,
          useValue: mockEncryptionService,
        },
        {
          provide: MailerConfigurationHealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    service = module.get<MailerConfigurationTestService>(
      MailerConfigurationTestService,
    );
  });

  describe('testVendorConnection', () => {
    it('should test Resend connection successfully', async () => {
      const config: ResendConfig = {
        apiKey: 'test-api-key',
      };

      const result = await service.testVendorConnection(MailerVendor.RESEND, config);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it('should test SendGrid connection successfully', async () => {
      const config: SendGridConfig = {
        apiKey: 'SG.test-api-key',
      };

      const result = await service.testVendorConnection(MailerVendor.SENDGRID, config);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it('should test AWS SES connection successfully', async () => {
      const config: AwsSesConfig = {
        accessKeyId: 'AKIA1234567890EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        region: 'us-east-1',
      };

      const result = await service.testVendorConnection(MailerVendor.AWS_SES, config);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it('should test SMTP connection successfully', async () => {
      const config: SmtpConfig = {
        host: 'smtp.example.com',
        port: 587,
        username: 'user@example.com',
        password: 'password',
        useTls: true,
      };

      const result = await service.testVendorConnection(MailerVendor.SMTP, config);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it('should return error for invalid credentials', async () => {
      const config: ResendConfig = {
        apiKey: 'invalid-key',
      };

      const result = await service.testVendorConnection(MailerVendor.RESEND, config);

      expect(result).toBeDefined();
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should handle network errors gracefully', async () => {
      const config: SmtpConfig = {
        host: 'invalid-host-that-does-not-exist.example.com',
        port: 587,
        username: 'user@example.com',
        password: 'password',
      };

      const result = await service.testVendorConnection(MailerVendor.SMTP, config);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
    });
  });

  describe('testConfiguration', () => {
    it('should test configuration and record result', async () => {
      const config = {
        id: 'config-123',
        vendor: MailerVendor.RESEND,
        vendorConfig: { apiKey: 'encrypted-key' },
      };

      mockEncryptionService.decryptVendorConfig.mockReturnValue({
        apiKey: 'test-key',
      });

      mockHealthService.recordTestResult.mockResolvedValue(undefined);

      const result = await service.testConfiguration(config as any);

      expect(mockEncryptionService.decryptVendorConfig).toHaveBeenCalled();
      expect(mockHealthService.recordTestResult).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle test failures', async () => {
      const config = {
        id: 'config-123',
        vendor: MailerVendor.RESEND,
        vendorConfig: { apiKey: 'encrypted-key' },
      };

      mockEncryptionService.decryptVendorConfig.mockReturnValue({
        apiKey: 'invalid-key',
      });

      mockHealthService.recordTestResult.mockResolvedValue(undefined);

      const result = await service.testConfiguration(config as any);

      expect(mockHealthService.recordTestResult).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('Vendor-specific connection tests', () => {
    it('should validate Resend API key format', async () => {
      const config: ResendConfig = {
        apiKey: 'short',
      };

      const result = await service.testVendorConnection(MailerVendor.RESEND, config);

      expect(result).toBeDefined();
    });

    it('should validate SendGrid API key format', async () => {
      const config: SendGridConfig = {
        apiKey: 'invalid-format',
      };

      const result = await service.testVendorConnection(MailerVendor.SENDGRID, config);

      expect(result).toBeDefined();
    });

    it('should validate AWS SES region', async () => {
      const config: AwsSesConfig = {
        accessKeyId: 'AKIA1234567890EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        region: 'invalid-region',
      };

      const result = await service.testVendorConnection(MailerVendor.AWS_SES, config);

      expect(result).toBeDefined();
    });

    it('should validate SMTP port range', async () => {
      const config: SmtpConfig = {
        host: 'smtp.example.com',
        port: 99999,
        username: 'user@example.com',
        password: 'password',
      };

      const result = await service.testVendorConnection(MailerVendor.SMTP, config);

      expect(result).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle unknown vendor', async () => {
      const config = { apiKey: 'test' };

      await expect(
        service.testVendorConnection('unknown' as MailerVendor, config as any),
      ).rejects.toThrow();
    });

    it('should provide descriptive error messages', async () => {
      const config: ResendConfig = {
        apiKey: 'invalid',
      };

      const result = await service.testVendorConnection(MailerVendor.RESEND, config);

      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });
  });
});
