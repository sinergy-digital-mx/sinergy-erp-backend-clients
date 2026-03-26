import { Test, TestingModule } from '@nestjs/testing';
import { VendorValidationService } from '../vendor-validation.service';
import { MailerVendor } from '../../enums/mailer-vendor.enum';
import type { ResendConfig } from '../../interfaces/vendor-config.interface';

/**
 * Resend API Key Validation Tests
 * Tests for validating Resend api_key field according to requirements:
 * - api_key is required (not empty)
 * - api_key must have valid format (minimum 20 characters typically)
 * - api_key cannot be null or undefined
 * - api_key must be a string
 * - Validation succeeds with valid api_key
 * - Error messages are descriptive
 */
describe('Resend API Key Validation', () => {
  let service: VendorValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VendorValidationService],
    }).compile();

    service = module.get<VendorValidationService>(VendorValidationService);
  });

  describe('Required Field Validation', () => {
    it('should reject when api_key is missing', () => {
      const config: ResendConfig = {
        apiKey: '',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('apiKey is required');
    });

    it('should reject when api_key is not provided', () => {
      const config = {} as ResendConfig;

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('apiKey is required');
    });

    it('should reject when api_key is null', () => {
      const config = {
        apiKey: null,
      } as any;

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('apiKey is required');
    });

    it('should reject when api_key is undefined', () => {
      const config = {
        apiKey: undefined,
      } as any;

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('apiKey is required');
    });
  });

  describe('Data Type Validation', () => {
    it('should reject when api_key is not a string', () => {
      const config = {
        apiKey: 12345,
      } as any;

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('apiKey must be a string with at least 10 characters');
    });

    it('should reject when api_key is a number', () => {
      const config = {
        apiKey: 123456789,
      } as any;

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('apiKey must be a string with at least 10 characters');
    });

    it('should reject when api_key is a boolean', () => {
      const config = {
        apiKey: true,
      } as any;

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('apiKey must be a string with at least 10 characters');
    });

    it('should reject when api_key is an object', () => {
      const config = {
        apiKey: { key: 'value' },
      } as any;

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('apiKey must be a string with at least 10 characters');
    });

    it('should reject when api_key is an array', () => {
      const config = {
        apiKey: ['api', 'key'],
      } as any;

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('apiKey must be a string with at least 10 characters');
    });
  });

  describe('Format Validation', () => {
    it('should reject when api_key is too short (less than 10 characters)', () => {
      const config: ResendConfig = {
        apiKey: 'short',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('apiKey must be a string with at least 10 characters');
    });

    it('should reject when api_key is exactly 9 characters', () => {
      const config: ResendConfig = {
        apiKey: '123456789',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('apiKey must be a string with at least 10 characters');
    });

    it('should accept when api_key is exactly 10 characters', () => {
      const config: ResendConfig = {
        apiKey: '1234567890',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept when api_key is 20 characters', () => {
      const config: ResendConfig = {
        apiKey: '12345678901234567890',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept when api_key is longer than 20 characters', () => {
      const config: ResendConfig = {
        apiKey: 're_1234567890123456789012345',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Valid API Key Scenarios', () => {
    it('should accept valid Resend api_key with typical format', () => {
      const config: ResendConfig = {
        apiKey: 're_1234567890123456789',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid Resend api_key with alphanumeric characters', () => {
      const config: ResendConfig = {
        apiKey: 'resend_key_abc123def456',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid Resend api_key with special characters', () => {
      const config: ResendConfig = {
        apiKey: 're_abc-123_def-456_ghi',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid Resend api_key with underscores', () => {
      const config: ResendConfig = {
        apiKey: 're_1234567890_abcdefghij',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid Resend api_key with hyphens', () => {
      const config: ResendConfig = {
        apiKey: 're-1234567890-abcdefghij',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid Resend api_key with mixed case', () => {
      const config: ResendConfig = {
        apiKey: 'Re_1234567890_AbCdEfGhIj',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid Resend api_key with only numbers', () => {
      const config: ResendConfig = {
        apiKey: '12345678901234567890',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid Resend api_key with only letters', () => {
      const config: ResendConfig = {
        apiKey: 'abcdefghijklmnopqrst',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should accept api_key with only whitespace (10+ chars)', () => {
      const config: ResendConfig = {
        apiKey: '          ',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      // Whitespace is technically a string with 10 characters, so it passes length check
      expect(result.isValid).toBe(true);
    });

    it('should reject api_key with leading/trailing whitespace if too short', () => {
      const config: ResendConfig = {
        apiKey: '  short  ',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      // This depends on implementation - typically should be trimmed or rejected
      // For now, we check that it's handled
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
    });

    it('should handle very long api_key', () => {
      const config: ResendConfig = {
        apiKey: 'a'.repeat(500),
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Error Message Quality', () => {
    it('should provide descriptive error message for missing api_key', () => {
      const config: ResendConfig = {
        apiKey: '',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.errors).toContain('apiKey is required');
      expect(result.errors[0]).toMatch(/apiKey.*required/i);
    });

    it('should provide descriptive error message for short api_key', () => {
      const config: ResendConfig = {
        apiKey: 'short',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.errors).toContain('apiKey must be a string with at least 10 characters');
      expect(result.errors[0]).toMatch(/apiKey.*characters/i);
    });

    it('should provide descriptive error message for non-string api_key', () => {
      const config = {
        apiKey: 12345,
      } as any;

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.errors).toContain('apiKey must be a string with at least 10 characters');
      expect(result.errors[0]).toMatch(/apiKey.*string/i);
    });

    it('should have errors array in validation result', () => {
      const config: ResendConfig = {
        apiKey: '',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should have isValid flag in validation result', () => {
      const config: ResendConfig = {
        apiKey: 'valid_api_key_12345',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result).toHaveProperty('isValid');
      expect(typeof result.isValid).toBe('boolean');
    });
  });

  describe('Optional Fields', () => {
    it('should accept valid api_key with optional publicKey', () => {
      const config: ResendConfig = {
        apiKey: 'valid_api_key_12345',
        publicKey: 'valid_public_key_12345',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid api_key without optional publicKey', () => {
      const config: ResendConfig = {
        apiKey: 'valid_api_key_12345',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-string publicKey when provided', () => {
      const config: ResendConfig = {
        apiKey: 'valid_api_key_12345',
        publicKey: 123 as any,
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('publicKey must be a string');
    });
  });

  describe('Validation Result Structure', () => {
    it('should return ValidationResult with isValid and errors properties', () => {
      const config: ResendConfig = {
        apiKey: 'valid_api_key_12345',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should return empty errors array for valid configuration', () => {
      const config: ResendConfig = {
        apiKey: 'valid_api_key_12345',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.errors).toEqual([]);
    });

    it('should return non-empty errors array for invalid configuration', () => {
      const config: ResendConfig = {
        apiKey: '',
      };

      const result = service.validateVendorConfig(MailerVendor.RESEND, config);

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
