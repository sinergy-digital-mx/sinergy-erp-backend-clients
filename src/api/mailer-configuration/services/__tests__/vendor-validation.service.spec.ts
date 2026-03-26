import { Test, TestingModule } from '@nestjs/testing';
import { VendorValidationService } from '../vendor-validation.service';
import { MailerVendor } from '../../enums/mailer-vendor.enum';
import type { ResendConfig, SendGridConfig, AwsSesConfig, SmtpConfig } from '../../interfaces/vendor-config.interface';

describe('VendorValidationService', () => {
  let service: VendorValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VendorValidationService],
    }).compile();

    service = module.get<VendorValidationService>(VendorValidationService);
  });

  describe('Resend validation', () => {
    it('should validate valid Resend config', () => {
      const config: ResendConfig = {
        apiKey: 'test-api-key-12345',
        publicKey: 'test-public-key',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate Resend config without optional publicKey', () => {
      const config: ResendConfig = {
        apiKey: 'test-api-key-12345',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject Resend config with missing apiKey', () => {
      const config: ResendConfig = {
        apiKey: '',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('apiKey is required for Resend');
    });

    it('should reject Resend config with short apiKey', () => {
      const config: ResendConfig = {
        apiKey: 'short',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('apiKey must be at least 10 characters');
    });

    it('should reject Resend config with non-string apiKey', () => {
      const config = {
        apiKey: 12345,
      } as any;

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('apiKey must be a string');
    });

    it('should reject Resend config with short optional publicKey', () => {
      const config: ResendConfig = {
        apiKey: 'test-api-key-12345',
        publicKey: 'short',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('publicKey must be at least 10 characters if provided');
    });
  });

  describe('SendGrid validation', () => {
    it('should validate valid SendGrid config', () => {
      const config: SendGridConfig = {
        apiKey: 'SG.test-api-key-12345',
        senderEmail: 'sender@example.com',
      };

      const result = service.validateVendorConfig(MailerVendor.SENDGRID, config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate SendGrid config without optional senderEmail', () => {
      const config: SendGridConfig = {
        apiKey: 'SG.test-api-key-12345',
      };

      const result = service.validateVendorConfig(MailerVendor.SENDGRID, config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject SendGrid config with missing apiKey', () => {
      const config: SendGridConfig = {
        apiKey: '',
      };

      const result = service.validateVendorConfig(MailerVendor.SENDGRID, config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('apiKey is required for SendGrid');
    });

    it('should reject SendGrid config with invalid senderEmail', () => {
      const config: SendGridConfig = {
        apiKey: 'SG.test-api-key-12345',
        senderEmail: 'invalid-email',
      };

      const result = service.validateVendorConfig(MailerVendor.SENDGRID, config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('senderEmail must be a valid email address');
    });

    it('should accept SendGrid config with empty optional senderEmail', () => {
      const config: SendGridConfig = {
        apiKey: 'SG.test-api-key-12345',
        senderEmail: '',
      };

      const result = service.validateVendorConfig(MailerVendor.SENDGRID, config);
      expect(result.isValid).toBe(true);
    });
  });

  describe('AWS SES validation', () => {
    it('should validate valid AWS SES config', () => {
      const config: AwsSesConfig = {
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        region: 'us-east-1',
      };

      const result = service.validateVendorConfig(MailerVendor.AWS_SES, config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate AWS SES config with different regions', () => {
      const regions = ['us-east-1', 'eu-west-1', 'ap-southeast-1', 'ca-central-1'];

      regions.forEach((region) => {
        const config: AwsSesConfig = {
          accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
          secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
          region,
        };

        const result = service.validateVendorConfig(MailerVendor.AWS_SES, config);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject AWS SES config with missing accessKeyId', () => {
      const config: AwsSesConfig = {
        accessKeyId: '',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        region: 'us-east-1',
      };

      const result = service.validateVendorConfig(MailerVendor.AWS_SES, config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('accessKeyId is required for AWS SES');
    });

    it('should reject AWS SES config with short secretAccessKey', () => {
      const config: AwsSesConfig = {
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'short',
        region: 'us-east-1',
      };

      const result = service.validateVendorConfig(MailerVendor.AWS_SES, config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('secretAccessKey must be at least 20 characters');
    });

    it('should reject AWS SES config with invalid region', () => {
      const config: AwsSesConfig = {
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        region: 'invalid-region',
      };

      const result = service.validateVendorConfig(MailerVendor.AWS_SES, config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('region must be a valid AWS region (e.g., us-east-1, eu-west-1)');
    });
  });

  describe('SMTP validation', () => {
    it('should validate valid SMTP config', () => {
      const config: SmtpConfig = {
        host: 'smtp.example.com',
        port: 587,
        username: 'user@example.com',
        password: 'secure-password-123',
        useTls: true,
      };

      const result = service.validateVendorConfig(MailerVendor.SMTP, config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate SMTP config without optional useTls', () => {
      const config: SmtpConfig = {
        host: 'smtp.example.com',
        port: 25,
        username: 'user@example.com',
        password: 'password',
      };

      const result = service.validateVendorConfig(MailerVendor.SMTP, config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate SMTP config with common ports', () => {
      const ports = [25, 465, 587, 2525];

      ports.forEach((port) => {
        const config: SmtpConfig = {
          host: 'smtp.example.com',
          port,
          username: 'user@example.com',
          password: 'password',
        };

        const result = service.validateVendorConfig(MailerVendor.SMTP, config);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject SMTP config with missing host', () => {
      const config: SmtpConfig = {
        host: '',
        port: 587,
        username: 'user@example.com',
        password: 'password',
      };

      const result = service.validateVendorConfig(MailerVendor.SMTP, config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('host is required for SMTP');
    });

    it('should reject SMTP config with missing port', () => {
      const config = {
        host: 'smtp.example.com',
        port: undefined,
        username: 'user@example.com',
        password: 'password',
      } as any;

      const result = service.validateVendorConfig(MailerVendor.SMTP, config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('port is required for SMTP');
    });

    it('should reject SMTP config with invalid port number', () => {
      const config: SmtpConfig = {
        host: 'smtp.example.com',
        port: 99999,
        username: 'user@example.com',
        password: 'password',
      };

      const result = service.validateVendorConfig(MailerVendor.SMTP, config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('port must be between 1 and 65535');
    });

    it('should reject SMTP config with port 0', () => {
      const config: SmtpConfig = {
        host: 'smtp.example.com',
        port: 0,
        username: 'user@example.com',
        password: 'password',
      };

      const result = service.validateVendorConfig(MailerVendor.SMTP, config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('port must be between 1 and 65535');
    });

    it('should reject SMTP config with missing username', () => {
      const config: SmtpConfig = {
        host: 'smtp.example.com',
        port: 587,
        username: '',
        password: 'password',
      };

      const result = service.validateVendorConfig(MailerVendor.SMTP, config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('username is required for SMTP');
    });

    it('should reject SMTP config with missing password', () => {
      const config: SmtpConfig = {
        host: 'smtp.example.com',
        port: 587,
        username: 'user@example.com',
        password: '',
      };

      const result = service.validateVendorConfig(MailerVendor.SMTP, config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('password is required for SMTP');
    });

    it('should reject SMTP config with non-boolean useTls', () => {
      const config = {
        host: 'smtp.example.com',
        port: 587,
        username: 'user@example.com',
        password: 'password',
        useTls: 'true',
      } as any;

      const result = service.validateVendorConfig(MailerVendor.SMTP, config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('useTls must be a boolean');
    });
  });

  describe('Required and optional fields', () => {
    it('should return correct required fields for each vendor', () => {
      expect(service.getRequiredFields(MailerVendor.RESEND)).toEqual(['apiKey']);
      expect(service.getRequiredFields(MailerVendor.SENDGRID)).toEqual(['apiKey']);
      expect(service.getRequiredFields(MailerVendor.AWS_SES)).toEqual(['accessKeyId', 'secretAccessKey', 'region']);
      expect(service.getRequiredFields(MailerVendor.SMTP)).toEqual(['host', 'port', 'username', 'password']);
    });

    it('should return correct optional fields for each vendor', () => {
      expect(service.getOptionalFields(MailerVendor.RESEND)).toEqual(['publicKey']);
      expect(service.getOptionalFields(MailerVendor.SENDGRID)).toEqual(['senderEmail']);
      expect(service.getOptionalFields(MailerVendor.AWS_SES)).toEqual([]);
      expect(service.getOptionalFields(MailerVendor.SMTP)).toEqual(['useTls']);
    });
  });

  describe('Error handling', () => {
    it('should handle unknown vendor', () => {
      const result = service.validateVendorConfig('unknown' as MailerVendor, {} as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unknown vendor: unknown');
    });
  });
});
