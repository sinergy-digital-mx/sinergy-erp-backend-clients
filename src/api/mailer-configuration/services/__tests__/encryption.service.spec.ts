import { Test, TestingModule } from '@nestjs/testing';
import { MailerConfigurationEncryptionService } from '../encryption.service';
import { MailerVendor } from '../../enums/mailer-vendor.enum';
import type { ResendConfig, SendGridConfig, AwsSesConfig, SmtpConfig } from '../../interfaces/vendor-config.interface';

describe('MailerConfigurationEncryptionService', () => {
  let service: MailerConfigurationEncryptionService;

  beforeAll(() => {
    // Set encryption key for testing
    process.env.ENCRYPTION_KEY = '0'.repeat(64); // 32 bytes in hex
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailerConfigurationEncryptionService],
    }).compile();

    service = module.get<MailerConfigurationEncryptionService>(MailerConfigurationEncryptionService);
  });

  describe('Resend encryption/decryption', () => {
    it('should encrypt and decrypt Resend apiKey', () => {
      const config: ResendConfig = {
        apiKey: 'test-api-key-12345',
        publicKey: 'test-public-key',
      };

      const encrypted = service.encryptVendorConfig(MailerVendor.RESEND, config);
      expect(encrypted.apiKey).not.toBe(config.apiKey);
      expect(encrypted.publicKey).toBe(config.publicKey); // Not encrypted

      const decrypted = service.decryptVendorConfig(MailerVendor.RESEND, encrypted);
      expect(decrypted.apiKey).toBe(config.apiKey);
      expect(decrypted.publicKey).toBe(config.publicKey);
    });

    it('should mask Resend apiKey showing only last 4 characters', () => {
      const config: ResendConfig = {
        apiKey: 'test-api-key-12345',
      };

      const masked = service.maskVendorConfig(MailerVendor.RESEND, config);
      expect(masked.apiKey).toBe('**************2345');
      expect(masked.publicKey).toBeUndefined();
    });

    it('should handle Resend config without optional publicKey', () => {
      const config: ResendConfig = {
        apiKey: 'test-api-key-12345',
      };

      const encrypted = service.encryptVendorConfig(MailerVendor.RESEND, config);
      const decrypted = service.decryptVendorConfig(MailerVendor.RESEND, encrypted);
      expect(decrypted.apiKey).toBe(config.apiKey);
      expect(decrypted.publicKey).toBeUndefined();
    });
  });

  describe('SendGrid encryption/decryption', () => {
    it('should encrypt and decrypt SendGrid apiKey', () => {
      const config: SendGridConfig = {
        apiKey: 'SG.test-api-key-12345',
        senderEmail: 'sender@example.com',
      };

      const encrypted = service.encryptVendorConfig(MailerVendor.SENDGRID, config);
      expect(encrypted.apiKey).not.toBe(config.apiKey);
      expect(encrypted.senderEmail).toBe(config.senderEmail); // Not encrypted

      const decrypted = service.decryptVendorConfig(MailerVendor.SENDGRID, encrypted);
      expect(decrypted.apiKey).toBe(config.apiKey);
      expect(decrypted.senderEmail).toBe(config.senderEmail);
    });

    it('should mask SendGrid apiKey', () => {
      const config: SendGridConfig = {
        apiKey: 'SG.test-api-key-12345',
      };

      const masked = service.maskVendorConfig(MailerVendor.SENDGRID, config);
      expect(masked.apiKey).toBe('*****************2345');
    });
  });

  describe('AWS SES encryption/decryption', () => {
    it('should encrypt and decrypt AWS SES credentials', () => {
      const config: AwsSesConfig = {
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        region: 'us-east-1',
      };

      const encrypted = service.encryptVendorConfig(MailerVendor.AWS_SES, config);
      expect(encrypted.accessKeyId).not.toBe(config.accessKeyId);
      expect(encrypted.secretAccessKey).not.toBe(config.secretAccessKey);
      expect(encrypted.region).toBe(config.region); // Not encrypted

      const decrypted = service.decryptVendorConfig(MailerVendor.AWS_SES, encrypted);
      expect(decrypted.accessKeyId).toBe(config.accessKeyId);
      expect(decrypted.secretAccessKey).toBe(config.secretAccessKey);
      expect(decrypted.region).toBe(config.region);
    });

    it('should mask AWS SES credentials', () => {
      const config: AwsSesConfig = {
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        region: 'us-east-1',
      };

      const masked = service.maskVendorConfig(MailerVendor.AWS_SES, config);
      expect(masked.accessKeyId).toBe('****************MPLE');
      expect(masked.secretAccessKey).toBe('************************************EKEY');
      expect(masked.region).toBe('us-east-1');
    });
  });

  describe('SMTP encryption/decryption', () => {
    it('should encrypt and decrypt SMTP credentials', () => {
      const config: SmtpConfig = {
        host: 'smtp.example.com',
        port: 587,
        username: 'user@example.com',
        password: 'secure-password-123',
        useTls: true,
      };

      const encrypted = service.encryptVendorConfig(MailerVendor.SMTP, config);
      expect(encrypted.username).not.toBe(config.username);
      expect(encrypted.password).not.toBe(config.password);
      expect(encrypted.host).toBe(config.host); // Not encrypted
      expect(encrypted.port).toBe(config.port); // Not encrypted
      expect(encrypted.useTls).toBe(config.useTls); // Not encrypted

      const decrypted = service.decryptVendorConfig(MailerVendor.SMTP, encrypted);
      expect(decrypted.username).toBe(config.username);
      expect(decrypted.password).toBe(config.password);
      expect(decrypted.host).toBe(config.host);
      expect(decrypted.port).toBe(config.port);
      expect(decrypted.useTls).toBe(config.useTls);
    });

    it('should mask SMTP credentials', () => {
      const config: SmtpConfig = {
        host: 'smtp.example.com',
        port: 587,
        username: 'user@example.com',
        password: 'secure-password-123',
      };

      const masked = service.maskVendorConfig(MailerVendor.SMTP, config);
      expect(masked.username).toBe('************.com');
      expect(masked.password).toBe('***************-123');
      expect(masked.host).toBe('smtp.example.com');
      expect(masked.port).toBe(587);
    });

    it('should handle SMTP config without optional useTls', () => {
      const config: SmtpConfig = {
        host: 'smtp.example.com',
        port: 25,
        username: 'user@example.com',
        password: 'password',
      };

      const encrypted = service.encryptVendorConfig(MailerVendor.SMTP, config);
      const decrypted = service.decryptVendorConfig(MailerVendor.SMTP, encrypted);
      expect(decrypted.useTls).toBeUndefined();
    });
  });

  describe('Masking edge cases', () => {
    it('should mask values shorter than 4 characters', () => {
      const config: ResendConfig = {
        apiKey: 'abc',
      };

      const masked = service.maskVendorConfig(MailerVendor.RESEND, config);
      expect(masked.apiKey).toBe('***');
    });

    it('should mask values exactly 4 characters', () => {
      const config: ResendConfig = {
        apiKey: 'abcd',
      };

      const masked = service.maskVendorConfig(MailerVendor.RESEND, config);
      expect(masked.apiKey).toBe('****');
    });

    it('should mask values 5 characters', () => {
      const config: ResendConfig = {
        apiKey: 'abcde',
      };

      const masked = service.maskVendorConfig(MailerVendor.RESEND, config);
      expect(masked.apiKey).toBe('*bcde');
    });
  });

  describe('Round-trip encryption', () => {
    it('should maintain data integrity through encrypt/decrypt cycle', () => {
      const configs = [
        {
          vendor: MailerVendor.RESEND,
          config: { apiKey: 'resend-key-123456789' } as ResendConfig,
        },
        {
          vendor: MailerVendor.SENDGRID,
          config: { apiKey: 'SG.sendgrid-key-123456789' } as SendGridConfig,
        },
        {
          vendor: MailerVendor.AWS_SES,
          config: {
            accessKeyId: 'AKIA1234567890EXAMPLE',
            secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
            region: 'eu-west-1',
          } as AwsSesConfig,
        },
        {
          vendor: MailerVendor.SMTP,
          config: {
            host: 'smtp.gmail.com',
            port: 587,
            username: 'user@gmail.com',
            password: 'app-password-123456',
            useTls: true,
          } as SmtpConfig,
        },
      ];

      configs.forEach(({ vendor, config }) => {
        const encrypted = service.encryptVendorConfig(vendor, config);
        const decrypted = service.decryptVendorConfig(vendor, encrypted);
        expect(decrypted).toEqual(config);
      });
    });

    it('should produce different encrypted values for the same api_key (non-deterministic due to random IV)', () => {
      const config: ResendConfig = {
        apiKey: 'same-api-key-value',
      };

      const encrypted1 = service.encryptVendorConfig(MailerVendor.RESEND, config);
      const encrypted2 = service.encryptVendorConfig(MailerVendor.RESEND, config);

      // Encrypted values should be different due to random IV
      expect(encrypted1.apiKey).not.toBe(encrypted2.apiKey);

      // But both should decrypt to the same original value
      const decrypted1 = service.decryptVendorConfig(MailerVendor.RESEND, encrypted1);
      const decrypted2 = service.decryptVendorConfig(MailerVendor.RESEND, encrypted2);

      expect(decrypted1.apiKey).toBe(config.apiKey);
      expect(decrypted2.apiKey).toBe(config.apiKey);
    });

    it('should produce different encrypted values for different api_keys', () => {
      const config1: ResendConfig = {
        apiKey: 'api-key-value-1',
      };

      const config2: ResendConfig = {
        apiKey: 'api-key-value-2',
      };

      const encrypted1 = service.encryptVendorConfig(MailerVendor.RESEND, config1);
      const encrypted2 = service.encryptVendorConfig(MailerVendor.RESEND, config2);

      // Encrypted values should be different
      expect(encrypted1.apiKey).not.toBe(encrypted2.apiKey);

      // And decrypt to their respective original values
      const decrypted1 = service.decryptVendorConfig(MailerVendor.RESEND, encrypted1);
      const decrypted2 = service.decryptVendorConfig(MailerVendor.RESEND, encrypted2);

      expect(decrypted1.apiKey).toBe(config1.apiKey);
      expect(decrypted2.apiKey).toBe(config2.apiKey);
    });

    it('should encrypt api_key to a value different from the original', () => {
      const originalApiKey = 'original-api-key-12345';
      const config: ResendConfig = {
        apiKey: originalApiKey,
      };

      const encrypted = service.encryptVendorConfig(MailerVendor.RESEND, config);

      // Encrypted value should be different from original
      expect(encrypted.apiKey).not.toBe(originalApiKey);

      // But should decrypt back to original
      const decrypted = service.decryptVendorConfig(MailerVendor.RESEND, encrypted);
      expect(decrypted.apiKey).toBe(originalApiKey);
    });
  });

  describe('Error handling', () => {
    it('should throw error for unknown vendor', () => {
      const config = { apiKey: 'test' };
      expect(() => {
        service.encryptVendorConfig('unknown' as MailerVendor, config as any);
      }).toThrow('Unknown vendor: unknown');
    });

    it('should throw error for invalid encrypted data format', () => {
      const config: ResendConfig = {
        apiKey: 'invalid-format',
      };

      expect(() => {
        service.decryptVendorConfig(MailerVendor.RESEND, config);
      }).toThrow('Invalid encrypted data format');
    });
  });
});
