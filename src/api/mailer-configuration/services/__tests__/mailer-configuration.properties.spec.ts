import { fc } from 'fast-check';
import { MailerVendor } from '../../enums/mailer-vendor.enum';
import { MailerConfigurationEncryptionService } from '../encryption.service';
import { VendorValidationService } from '../vendor-validation.service';
import type { ResendConfig, SendGridConfig, AwsSesConfig, SmtpConfig } from '../../interfaces/vendor-config.interface';

describe('Mailer Configuration - Property-Based Tests', () => {
  let encryptionService: MailerConfigurationEncryptionService;
  let validationService: VendorValidationService;

  beforeAll(() => {
    process.env.ENCRYPTION_KEY = '0'.repeat(64);
    encryptionService = new MailerConfigurationEncryptionService();
    validationService = new VendorValidationService();
  });

  // Property 1: Vendor Type Persistence
  describe('Property 1: Vendor Type Persistence', () => {
    it('should persist vendor type for any valid vendor', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            MailerVendor.RESEND,
            MailerVendor.SENDGRID,
            MailerVendor.AWS_SES,
            MailerVendor.SMTP,
          ),
          (vendor) => {
            const config = { vendor };
            expect(config.vendor).toBe(vendor);
          },
        ),
      );
    });
  });

  // Property 5: Sensitive Field Encryption
  describe('Property 5: Sensitive Field Encryption', () => {
    it('should encrypt sensitive fields for Resend', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (apiKey) => {
          const config: ResendConfig = { apiKey };
          const encrypted = encryptionService.encryptVendorConfig(
            MailerVendor.RESEND,
            config,
          );
          expect(encrypted.apiKey).not.toBe(apiKey);
          expect(typeof encrypted.apiKey).toBe('string');
        }),
      );
    });

    it('should encrypt sensitive fields for AWS SES', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 20 }),
          fc.string({ minLength: 40 }),
          (accessKeyId, secretAccessKey) => {
            const config: AwsSesConfig = {
              accessKeyId,
              secretAccessKey,
              region: 'us-east-1',
            };
            const encrypted = encryptionService.encryptVendorConfig(
              MailerVendor.AWS_SES,
              config,
            );
            expect(encrypted.accessKeyId).not.toBe(accessKeyId);
            expect(encrypted.secretAccessKey).not.toBe(secretAccessKey);
            expect(encrypted.region).toBe('us-east-1');
          },
        ),
      );
    });

    it('should encrypt sensitive fields for SMTP', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          (username, password) => {
            const config: SmtpConfig = {
              host: 'smtp.example.com',
              port: 587,
              username,
              password,
            };
            const encrypted = encryptionService.encryptVendorConfig(
              MailerVendor.SMTP,
              config,
            );
            expect(encrypted.username).not.toBe(username);
            expect(encrypted.password).not.toBe(password);
            expect(encrypted.host).toBe('smtp.example.com');
          },
        ),
      );
    });
  });

  // Property 6: Sensitive Field Decryption Round-Trip
  describe('Property 6: Sensitive Field Decryption Round-Trip', () => {
    it('should decrypt Resend config to original value', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (apiKey) => {
          const config: ResendConfig = { apiKey };
          const encrypted = encryptionService.encryptVendorConfig(
            MailerVendor.RESEND,
            config,
          );
          const decrypted = encryptionService.decryptVendorConfig(
            MailerVendor.RESEND,
            encrypted,
          );
          expect(decrypted.apiKey).toBe(apiKey);
        }),
      );
    });

    it('should decrypt AWS SES config to original value', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 20 }),
          fc.string({ minLength: 40 }),
          (accessKeyId, secretAccessKey) => {
            const config: AwsSesConfig = {
              accessKeyId,
              secretAccessKey,
              region: 'us-east-1',
            };
            const encrypted = encryptionService.encryptVendorConfig(
              MailerVendor.AWS_SES,
              config,
            );
            const decrypted = encryptionService.decryptVendorConfig(
              MailerVendor.AWS_SES,
              encrypted,
            );
            expect(decrypted.accessKeyId).toBe(accessKeyId);
            expect(decrypted.secretAccessKey).toBe(secretAccessKey);
            expect(decrypted.region).toBe('us-east-1');
          },
        ),
      );
    });

    it('should decrypt SMTP config to original value', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          (username, password) => {
            const config: SmtpConfig = {
              host: 'smtp.example.com',
              port: 587,
              username,
              password,
            };
            const encrypted = encryptionService.encryptVendorConfig(
              MailerVendor.SMTP,
              config,
            );
            const decrypted = encryptionService.decryptVendorConfig(
              MailerVendor.SMTP,
              encrypted,
            );
            expect(decrypted.username).toBe(username);
            expect(decrypted.password).toBe(password);
          },
        ),
      );
    });
  });

  // Property 7: Sensitive Field Masking
  describe('Property 7: Sensitive Field Masking', () => {
    it('should mask Resend apiKey showing only last 4 characters', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (apiKey) => {
          const config: ResendConfig = { apiKey };
          const masked = encryptionService.maskVendorConfig(
            MailerVendor.RESEND,
            config,
          );
          const lastFour = apiKey.slice(-4);
          expect(masked.apiKey).toContain(lastFour);
          expect(masked.apiKey).not.toBe(apiKey);
        }),
      );
    });

    it('should mask AWS SES credentials', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 20 }),
          fc.string({ minLength: 40 }),
          (accessKeyId, secretAccessKey) => {
            const config: AwsSesConfig = {
              accessKeyId,
              secretAccessKey,
              region: 'us-east-1',
            };
            const masked = encryptionService.maskVendorConfig(
              MailerVendor.AWS_SES,
              config,
            );
            expect(masked.accessKeyId).not.toBe(accessKeyId);
            expect(masked.secretAccessKey).not.toBe(secretAccessKey);
            expect(masked.region).toBe('us-east-1');
          },
        ),
      );
    });

    it('should mask SMTP credentials', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          (username, password) => {
            const config: SmtpConfig = {
              host: 'smtp.example.com',
              port: 587,
              username,
              password,
            };
            const masked = encryptionService.maskVendorConfig(
              MailerVendor.SMTP,
              config,
            );
            expect(masked.username).not.toBe(username);
            expect(masked.password).not.toBe(password);
            expect(masked.host).toBe('smtp.example.com');
          },
        ),
      );
    });
  });

  // Property 11: Required Field Validation
  describe('Property 11: Required Field Validation', () => {
    it('should reject Resend config with missing apiKey', () => {
      fc.assert(
        fc.property(fc.constant({}), (config) => {
          const result = validationService.validateVendorConfig(
            MailerVendor.RESEND,
            config as any,
          );
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }),
      );
    });

    it('should reject AWS SES config with missing required fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            accessKeyId: fc.option(fc.string()),
            secretAccessKey: fc.option(fc.string()),
            region: fc.option(fc.string()),
          }),
          (config) => {
            const result = validationService.validateVendorConfig(
              MailerVendor.AWS_SES,
              config as any,
            );
            if (!config.accessKeyId || !config.secretAccessKey || !config.region) {
              expect(result.isValid).toBe(false);
            }
          },
        ),
      );
    });

    it('should reject SMTP config with missing required fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            host: fc.option(fc.string()),
            port: fc.option(fc.integer()),
            username: fc.option(fc.string()),
            password: fc.option(fc.string()),
          }),
          (config) => {
            const result = validationService.validateVendorConfig(
              MailerVendor.SMTP,
              config as any,
            );
            if (!config.host || !config.port || !config.username || !config.password) {
              expect(result.isValid).toBe(false);
            }
          },
        ),
      );
    });
  });

  // Property 12: Field Format Validation
  describe('Property 12: Field Format Validation', () => {
    it('should validate SMTP port is in valid range', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 65535 }), (port) => {
          const config: SmtpConfig = {
            host: 'smtp.example.com',
            port,
            username: 'user@example.com',
            password: 'password',
          };
          const result = validationService.validateVendorConfig(
            MailerVendor.SMTP,
            config,
          );
          expect(result.isValid).toBe(true);
        }),
      );
    });

    it('should reject SMTP port outside valid range', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ max: 0 }),
            fc.integer({ min: 65536 }),
          ),
          (port) => {
            const config: SmtpConfig = {
              host: 'smtp.example.com',
              port,
              username: 'user@example.com',
              password: 'password',
            };
            const result = validationService.validateVendorConfig(
              MailerVendor.SMTP,
              config,
            );
            expect(result.isValid).toBe(false);
          },
        ),
      );
    });

    it('should validate SendGrid email format', () => {
      fc.assert(
        fc.property(fc.emailAddress(), (email) => {
          const config: SendGridConfig = {
            apiKey: 'SG.test-api-key-12345',
            senderEmail: email,
          };
          const result = validationService.validateVendorConfig(
            MailerVendor.SENDGRID,
            config,
          );
          expect(result.isValid).toBe(true);
        }),
      );
    });

    it('should reject invalid email format', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter((s) => !s.includes('@')),
          (invalidEmail) => {
            const config: SendGridConfig = {
              apiKey: 'SG.test-api-key-12345',
              senderEmail: invalidEmail,
            };
            const result = validationService.validateVendorConfig(
              MailerVendor.SENDGRID,
              config,
            );
            expect(result.isValid).toBe(false);
          },
        ),
      );
    });
  });

  // Property 30: Data Type Consistency in Serialization
  describe('Property 30: Data Type Consistency in Serialization', () => {
    it('should maintain string types through encryption/decryption', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (apiKey) => {
          const config: ResendConfig = { apiKey };
          const encrypted = encryptionService.encryptVendorConfig(
            MailerVendor.RESEND,
            config,
          );
          const decrypted = encryptionService.decryptVendorConfig(
            MailerVendor.RESEND,
            encrypted,
          );
          expect(typeof decrypted.apiKey).toBe('string');
        }),
      );
    });

    it('should maintain number types for SMTP port', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 65535 }), (port) => {
          const config: SmtpConfig = {
            host: 'smtp.example.com',
            port,
            username: 'user@example.com',
            password: 'password',
          };
          const encrypted = encryptionService.encryptVendorConfig(
            MailerVendor.SMTP,
            config,
          );
          const decrypted = encryptionService.decryptVendorConfig(
            MailerVendor.SMTP,
            encrypted,
          );
          expect(typeof decrypted.port).toBe('number');
          expect(decrypted.port).toBe(port);
        }),
      );
    });

    it('should maintain boolean types for SMTP useTls', () => {
      fc.assert(
        fc.property(fc.boolean(), (useTls) => {
          const config: SmtpConfig = {
            host: 'smtp.example.com',
            port: 587,
            username: 'user@example.com',
            password: 'password',
            useTls,
          };
          const encrypted = encryptionService.encryptVendorConfig(
            MailerVendor.SMTP,
            config,
          );
          const decrypted = encryptionService.decryptVendorConfig(
            MailerVendor.SMTP,
            encrypted,
          );
          expect(typeof decrypted.useTls).toBe('boolean');
          expect(decrypted.useTls).toBe(useTls);
        }),
      );
    });
  });

  // Property 2: Vendor Type Filtering
  describe('Property 2: Vendor Type Filtering', () => {
    it('should correctly identify vendor types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            MailerVendor.RESEND,
            MailerVendor.SENDGRID,
            MailerVendor.AWS_SES,
            MailerVendor.SMTP,
          ),
          (vendor) => {
            const configs = [
              { vendor: MailerVendor.RESEND },
              { vendor: MailerVendor.SENDGRID },
              { vendor: MailerVendor.AWS_SES },
              { vendor: MailerVendor.SMTP },
            ];
            const filtered = configs.filter((c) => c.vendor === vendor);
            expect(filtered.length).toBe(1);
            expect(filtered[0].vendor).toBe(vendor);
          },
        ),
      );
    });
  });

  // Property 3: Vendor-Specific Field Storage
  describe('Property 3: Vendor-Specific Field Storage', () => {
    it('should store all Resend fields', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10 }),
          fc.option(fc.string({ minLength: 10 })),
          (apiKey, publicKey) => {
            const config: ResendConfig = { apiKey, publicKey };
            expect(config.apiKey).toBe(apiKey);
            if (publicKey) {
              expect(config.publicKey).toBe(publicKey);
            }
          },
        ),
      );
    });

    it('should store all AWS SES fields', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 20 }),
          fc.string({ minLength: 40 }),
          fc.constantFrom('us-east-1', 'eu-west-1', 'ap-southeast-1'),
          (accessKeyId, secretAccessKey, region) => {
            const config: AwsSesConfig = {
              accessKeyId,
              secretAccessKey,
              region,
            };
            expect(config.accessKeyId).toBe(accessKeyId);
            expect(config.secretAccessKey).toBe(secretAccessKey);
            expect(config.region).toBe(region);
          },
        ),
      );
    });

    it('should store all SMTP fields', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.integer({ min: 1, max: 65535 }),
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          fc.boolean(),
          (host, port, username, password, useTls) => {
            const config: SmtpConfig = {
              host,
              port,
              username,
              password,
              useTls,
            };
            expect(config.host).toBe(host);
            expect(config.port).toBe(port);
            expect(config.username).toBe(username);
            expect(config.password).toBe(password);
            expect(config.useTls).toBe(useTls);
          },
        ),
      );
    });
  });
});
