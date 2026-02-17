/**
 * Phone number validation and formatting utilities
 * Supports E.164 format and international phone numbers
 * 
 * E.164 Format: +[country code][number]
 * Examples:
 * - Mexico: +52 6647945661
 * - USA: +1 2025551234
 * - UK: +44 2071838750
 * - Germany: +49 3012345678
 * - Argentina: +54 1123456789
 * - China: +86 1012345678
 */

export interface PhoneParseResult {
  isValid: boolean;
  e164: string; // E.164 formatted number
  countryCode: string; // e.g., '+52'
  countryName?: string;
  nationalNumber: string; // Number without country code
  error?: string;
}

/**
 * Country code mapping with their phone number characteristics
 */
const COUNTRY_CODES: Record<string, { code: string; name: string; minDigits: number; maxDigits: number }> = {
  '+1': { code: '+1', name: 'USA/Canada', minDigits: 10, maxDigits: 11 },
  '+52': { code: '+52', name: 'Mexico', minDigits: 10, maxDigits: 10 },
  '+44': { code: '+44', name: 'United Kingdom', minDigits: 9, maxDigits: 10 },
  '+49': { code: '+49', name: 'Germany', minDigits: 5, maxDigits: 11 },
  '+54': { code: '+54', name: 'Argentina', minDigits: 8, maxDigits: 10 },
  '+86': { code: '+86', name: 'China', minDigits: 11, maxDigits: 11 },
  '+33': { code: '+33', name: 'France', minDigits: 9, maxDigits: 9 },
  '+39': { code: '+39', name: 'Italy', minDigits: 9, maxDigits: 10 },
  '+34': { code: '+34', name: 'Spain', minDigits: 9, maxDigits: 9 },
  '+31': { code: '+31', name: 'Netherlands', minDigits: 9, maxDigits: 9 },
  '+32': { code: '+32', name: 'Belgium', minDigits: 8, maxDigits: 9 },
  '+43': { code: '+43', name: 'Austria', minDigits: 9, maxDigits: 10 },
  '+41': { code: '+41', name: 'Switzerland', minDigits: 9, maxDigits: 9 },
  '+46': { code: '+46', name: 'Sweden', minDigits: 8, maxDigits: 9 },
  '+47': { code: '+47', name: 'Norway', minDigits: 8, maxDigits: 8 },
  '+45': { code: '+45', name: 'Denmark', minDigits: 8, maxDigits: 8 },
  '+358': { code: '+358', name: 'Finland', minDigits: 8, maxDigits: 9 },
  '+48': { code: '+48', name: 'Poland', minDigits: 9, maxDigits: 9 },
  '+420': { code: '+420', name: 'Czech Republic', minDigits: 9, maxDigits: 9 },
  '+36': { code: '+36', name: 'Hungary', minDigits: 9, maxDigits: 9 },
  '+40': { code: '+40', name: 'Romania', minDigits: 9, maxDigits: 9 },
  '+30': { code: '+30', name: 'Greece', minDigits: 10, maxDigits: 10 },
  '+90': { code: '+90', name: 'Turkey', minDigits: 10, maxDigits: 10 },
  '+7': { code: '+7', name: 'Russia', minDigits: 10, maxDigits: 10 },
  '+81': { code: '+81', name: 'Japan', minDigits: 9, maxDigits: 10 },
  '+82': { code: '+82', name: 'South Korea', minDigits: 9, maxDigits: 10 },
  '+65': { code: '+65', name: 'Singapore', minDigits: 8, maxDigits: 8 },
  '+60': { code: '+60', name: 'Malaysia', minDigits: 9, maxDigits: 10 },
  '+66': { code: '+66', name: 'Thailand', minDigits: 9, maxDigits: 9 },
  '+62': { code: '+62', name: 'Indonesia', minDigits: 9, maxDigits: 10 },
  '+63': { code: '+63', name: 'Philippines', minDigits: 10, maxDigits: 10 },
  '+91': { code: '+91', name: 'India', minDigits: 10, maxDigits: 10 },
  '+55': { code: '+55', name: 'Brazil', minDigits: 10, maxDigits: 11 },
  '+56': { code: '+56', name: 'Chile', minDigits: 9, maxDigits: 9 },
  '+57': { code: '+57', name: 'Colombia', minDigits: 10, maxDigits: 10 },
  '+51': { code: '+51', name: 'Peru', minDigits: 9, maxDigits: 9 },
  '+58': { code: '+58', name: 'Venezuela', minDigits: 10, maxDigits: 10 },
  '+27': { code: '+27', name: 'South Africa', minDigits: 9, maxDigits: 9 },
  '+20': { code: '+20', name: 'Egypt', minDigits: 10, maxDigits: 10 },
  '+234': { code: '+234', name: 'Nigeria', minDigits: 10, maxDigits: 10 },
  '+212': { code: '+212', name: 'Morocco', minDigits: 9, maxDigits: 9 },
  '+216': { code: '+216', name: 'Tunisia', minDigits: 8, maxDigits: 8 },
  '+61': { code: '+61', name: 'Australia', minDigits: 9, maxDigits: 9 },
  '+64': { code: '+64', name: 'New Zealand', minDigits: 9, maxDigits: 9 },
};

/**
 * Parse and validate a phone number
 * Supports multiple input formats:
 * - E.164: +52 6647945661
 * - With spaces: +52 664 794 5661
 * - With dashes: +52-664-794-5661
 * - With parentheses: +52 (664) 794-5661
 * - Just digits with country code: +526647945661
 * 
 * @param phoneInput - The phone number to parse
 * @param defaultCountryCode - Default country code if not provided (e.g., '+52' for Mexico)
 * @returns PhoneParseResult with validation status and formatted number
 */
export function parsePhoneNumber(phoneInput: string, defaultCountryCode?: string): PhoneParseResult {
  if (!phoneInput || typeof phoneInput !== 'string') {
    return {
      isValid: false,
      e164: '',
      countryCode: '',
      nationalNumber: '',
      error: 'Phone number is required and must be a string',
    };
  }

  // Remove all whitespace and common formatting characters
  let cleaned = phoneInput.trim().replace(/[\s\-().]/g, '');

  // Extract country code
  let countryCode = '';
  let nationalNumber = '';

  // Check if starts with +
  if (cleaned.startsWith('+')) {
    // Find the country code by checking known codes (longest first to avoid partial matches)
    const sortedCodes = Object.keys(COUNTRY_CODES).sort((a, b) => b.length - a.length);
    
    for (const code of sortedCodes) {
      if (cleaned.startsWith(code)) {
        countryCode = code;
        nationalNumber = cleaned.substring(code.length);
        break;
      }
    }

    if (!countryCode) {
      return {
        isValid: false,
        e164: '',
        countryCode: '',
        nationalNumber: '',
        error: `Unknown country code in: ${phoneInput}`,
      };
    }
  } else {
    // No country code provided, use default or reject
    if (!defaultCountryCode) {
      return {
        isValid: false,
        e164: '',
        countryCode: '',
        nationalNumber: '',
        error: `No country code found. Please provide phone in E.164 format (e.g., +52 6647945661) or specify a default country code`,
      };
    }

    countryCode = defaultCountryCode;
    nationalNumber = cleaned;
  }

  // Validate national number contains only digits
  if (!/^\d+$/.test(nationalNumber)) {
    return {
      isValid: false,
      e164: '',
      countryCode,
      nationalNumber: '',
      error: `National number contains non-digit characters: ${nationalNumber}`,
    };
  }

  // Get country info
  const countryInfo = COUNTRY_CODES[countryCode];
  if (!countryInfo) {
    return {
      isValid: false,
      e164: '',
      countryCode,
      nationalNumber,
      error: `Unknown country code: ${countryCode}`,
    };
  }

  // Validate length
  const digitCount = nationalNumber.length;
  if (digitCount < countryInfo.minDigits || digitCount > countryInfo.maxDigits) {
    return {
      isValid: false,
      e164: '',
      countryCode,
      nationalNumber,
      countryName: countryInfo.name,
      error: `Invalid number of digits for ${countryInfo.name}. Expected ${countryInfo.minDigits}-${countryInfo.maxDigits} digits, got ${digitCount}`,
    };
  }

  // Build E.164 format
  const e164 = `${countryCode}${nationalNumber}`;

  return {
    isValid: true,
    e164,
    countryCode,
    nationalNumber,
    countryName: countryInfo.name,
  };
}

/**
 * Validate if a phone number is in valid E.164 format
 * @param phoneNumber - Phone number to validate
 * @returns true if valid E.164 format
 */
export function isValidE164(phoneNumber: string): boolean {
  const result = parsePhoneNumber(phoneNumber);
  return result.isValid;
}

/**
 * Convert phone number to E.164 format
 * @param phoneInput - Phone number in any format
 * @param defaultCountryCode - Default country code if not provided
 * @returns E.164 formatted number or empty string if invalid
 */
export function toE164(phoneInput: string, defaultCountryCode?: string): string {
  const result = parsePhoneNumber(phoneInput, defaultCountryCode);
  return result.isValid ? result.e164 : '';
}

/**
 * Extract country code from a phone number
 * @param phoneNumber - Phone number in E.164 format
 * @returns Country code (e.g., '+52') or empty string if not found
 */
export function extractCountryCode(phoneNumber: string): string {
  const result = parsePhoneNumber(phoneNumber);
  return result.countryCode;
}

/**
 * Extract national number (without country code) from a phone number
 * @param phoneNumber - Phone number in E.164 format
 * @returns National number or empty string if invalid
 */
export function extractNationalNumber(phoneNumber: string): string {
  const result = parsePhoneNumber(phoneNumber);
  return result.nationalNumber;
}

/**
 * Get country name from country code
 * @param countryCode - Country code (e.g., '+52')
 * @returns Country name or undefined
 */
export function getCountryName(countryCode: string): string | undefined {
  return COUNTRY_CODES[countryCode]?.name;
}

/**
 * Get all supported country codes
 * @returns Array of country codes
 */
export function getSupportedCountryCodes(): string[] {
  return Object.keys(COUNTRY_CODES);
}

/**
 * Get country code by country name (case-insensitive)
 * @param countryName - Country name (e.g., 'Mexico')
 * @returns Country code or undefined
 */
export function getCountryCodeByName(countryName: string): string | undefined {
  const normalized = countryName.toLowerCase();
  for (const [code, info] of Object.entries(COUNTRY_CODES)) {
    if (info.name.toLowerCase() === normalized) {
      return code;
    }
  }
  return undefined;
}
