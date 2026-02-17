import {
  parsePhoneNumber,
  isValidE164,
  toE164,
  extractCountryCode,
  extractNationalNumber,
  getCountryName,
  getCountryCodeByName,
} from '../phone.validator';

describe('Phone Validator', () => {
  describe('parsePhoneNumber', () => {
    it('should parse valid E.164 format numbers', () => {
      const result = parsePhoneNumber('+52 6647945661');
      expect(result.isValid).toBe(true);
      expect(result.e164).toBe('+526647945661');
      expect(result.countryCode).toBe('+52');
      expect(result.nationalNumber).toBe('6647945661');
      expect(result.countryName).toBe('Mexico');
    });

    it('should parse numbers with various formatting', () => {
      const formats = [
        '+52 6647945661',
        '+52-664-794-5661',
        '+52 (664) 794-5661',
        '+526647945661',
      ];

      formats.forEach(format => {
        const result = parsePhoneNumber(format);
        expect(result.isValid).toBe(true);
        expect(result.e164).toBe('+526647945661');
      });
    });

    it('should parse USA numbers', () => {
      const result = parsePhoneNumber('+1 2025551234');
      expect(result.isValid).toBe(true);
      expect(result.e164).toBe('+12025551234');
      expect(result.countryCode).toBe('+1');
      expect(result.countryName).toBe('USA/Canada');
    });

    it('should parse UK numbers', () => {
      const result = parsePhoneNumber('+44 2071838750');
      expect(result.isValid).toBe(true);
      expect(result.e164).toBe('+442071838750');
      expect(result.countryCode).toBe('+44');
      expect(result.countryName).toBe('United Kingdom');
    });

    it('should parse Germany numbers', () => {
      const result = parsePhoneNumber('+49 3012345678');
      expect(result.isValid).toBe(true);
      expect(result.e164).toBe('+493012345678');
      expect(result.countryCode).toBe('+49');
      expect(result.countryName).toBe('Germany');
    });

    it('should parse China numbers', () => {
      const result = parsePhoneNumber('+86 13012345678'); // 11 digits for China
      expect(result.isValid).toBe(true);
      expect(result.e164).toBe('+8613012345678');
      expect(result.countryCode).toBe('+86');
      expect(result.countryName).toBe('China');
    });

    it('should parse Argentina numbers', () => {
      const result = parsePhoneNumber('+54 1123456789');
      expect(result.isValid).toBe(true);
      expect(result.e164).toBe('+541123456789');
      expect(result.countryCode).toBe('+54');
      expect(result.countryName).toBe('Argentina');
    });

    it('should parse Brazil numbers', () => {
      const result = parsePhoneNumber('+55 1123456789');
      expect(result.isValid).toBe(true);
      expect(result.e164).toBe('+551123456789');
      expect(result.countryCode).toBe('+55');
      expect(result.countryName).toBe('Brazil');
    });

    it('should accept national number with default country code', () => {
      const result = parsePhoneNumber('6647945661', '+52');
      expect(result.isValid).toBe(true);
      expect(result.e164).toBe('+526647945661');
      expect(result.countryCode).toBe('+52');
    });

    it('should reject invalid country code', () => {
      const result = parsePhoneNumber('+999 1234567890');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unknown country code');
    });

    it('should reject number with too few digits', () => {
      const result = parsePhoneNumber('+52 123'); // Mexico needs 10 digits
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid number of digits');
    });

    it('should reject number with too many digits', () => {
      const result = parsePhoneNumber('+52 12345678901234'); // Mexico max 10 digits
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid number of digits');
    });

    it('should reject number with non-digit characters in national number', () => {
      const result = parsePhoneNumber('+52 664ABC5661');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('non-digit characters');
    });

    it('should reject empty string', () => {
      const result = parsePhoneNumber('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject null', () => {
      const result = parsePhoneNumber(null as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject number without country code and no default', () => {
      const result = parsePhoneNumber('6647945661');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('No country code found');
    });
  });

  describe('isValidE164', () => {
    it('should return true for valid E.164 numbers', () => {
      expect(isValidE164('+52 6647945661')).toBe(true);
      expect(isValidE164('+1 2025551234')).toBe(true);
      expect(isValidE164('+44 2071838750')).toBe(true);
    });

    it('should return false for invalid numbers', () => {
      expect(isValidE164('+52 123')).toBe(false);
      expect(isValidE164('+999 1234567890')).toBe(false);
      expect(isValidE164('6647945661')).toBe(false);
    });
  });

  describe('toE164', () => {
    it('should convert to E.164 format', () => {
      expect(toE164('+52 664-794-5661')).toBe('+526647945661');
      expect(toE164('+1 (202) 555-1234')).toBe('+12025551234');
    });

    it('should return empty string for invalid numbers', () => {
      expect(toE164('+52 123')).toBe('');
      expect(toE164('invalid')).toBe('');
    });

    it('should use default country code', () => {
      expect(toE164('6647945661', '+52')).toBe('+526647945661');
      expect(toE164('2025551234', '+1')).toBe('+12025551234');
    });
  });

  describe('extractCountryCode', () => {
    it('should extract country code', () => {
      expect(extractCountryCode('+52 6647945661')).toBe('+52');
      expect(extractCountryCode('+1 2025551234')).toBe('+1');
      expect(extractCountryCode('+44 2071838750')).toBe('+44');
    });

    it('should return empty string for invalid numbers', () => {
      expect(extractCountryCode('invalid')).toBe('');
    });
  });

  describe('extractNationalNumber', () => {
    it('should extract national number', () => {
      expect(extractNationalNumber('+52 6647945661')).toBe('6647945661');
      expect(extractNationalNumber('+1 2025551234')).toBe('2025551234');
      expect(extractNationalNumber('+44 2071838750')).toBe('2071838750');
    });

    it('should return empty string for invalid numbers', () => {
      expect(extractNationalNumber('invalid')).toBe('');
    });
  });

  describe('getCountryName', () => {
    it('should return country name for valid country code', () => {
      expect(getCountryName('+52')).toBe('Mexico');
      expect(getCountryName('+1')).toBe('USA/Canada');
      expect(getCountryName('+44')).toBe('United Kingdom');
      expect(getCountryName('+86')).toBe('China');
    });

    it('should return undefined for invalid country code', () => {
      expect(getCountryName('+999')).toBeUndefined();
    });
  });

  describe('getCountryCodeByName', () => {
    it('should return country code for valid country name', () => {
      expect(getCountryCodeByName('Mexico')).toBe('+52');
      expect(getCountryCodeByName('USA/Canada')).toBe('+1');
      expect(getCountryCodeByName('United Kingdom')).toBe('+44');
      expect(getCountryCodeByName('China')).toBe('+86');
    });

    it('should be case-insensitive', () => {
      expect(getCountryCodeByName('mexico')).toBe('+52');
      expect(getCountryCodeByName('MEXICO')).toBe('+52');
      expect(getCountryCodeByName('MeXiCo')).toBe('+52');
    });

    it('should return undefined for invalid country name', () => {
      expect(getCountryCodeByName('Invalid Country')).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle numbers with leading zeros in national number', () => {
      const result = parsePhoneNumber('+44 2071838750'); // UK number without leading zero
      expect(result.isValid).toBe(true);
      expect(result.nationalNumber).toBe('2071838750');
    });

    it('should handle numbers with multiple spaces', () => {
      const result = parsePhoneNumber('+52   664   794   5661');
      expect(result.isValid).toBe(true);
      expect(result.e164).toBe('+526647945661');
    });

    it('should handle numbers with mixed formatting', () => {
      const result = parsePhoneNumber('+52 (664) 794-5661');
      expect(result.isValid).toBe(true);
      expect(result.e164).toBe('+526647945661');
    });

    it('should validate Brazil 10-digit numbers', () => {
      const result = parsePhoneNumber('+55 1123456789');
      expect(result.isValid).toBe(true);
    });

    it('should validate Brazil 11-digit numbers', () => {
      const result = parsePhoneNumber('+55 11234567890');
      expect(result.isValid).toBe(true);
    });

    it('should reject Brazil 9-digit numbers', () => {
      const result = parsePhoneNumber('+55 112345678');
      expect(result.isValid).toBe(false);
    });
  });
});
