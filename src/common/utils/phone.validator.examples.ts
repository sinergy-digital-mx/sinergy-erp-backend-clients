/**
 * Phone Validator - Usage Examples
 * 
 * This file demonstrates how to use the phone validator utility
 * in your application.
 */

import {
  parsePhoneNumber,
  isValidE164,
  toE164,
  extractCountryCode,
  extractNationalNumber,
  getCountryName,
  getCountryCodeByName,
  getSupportedCountryCodes,
} from './phone.validator';

// ============================================================================
// EXAMPLE 1: Basic Parsing
// ============================================================================

export function example1_basicParsing() {
  console.log('=== Example 1: Basic Parsing ===');

  // Parse a Mexican phone number
  const result = parsePhoneNumber('+52 6647945661');
  
  console.log('Input: +52 6647945661');
  console.log('Valid:', result.isValid);
  console.log('E.164:', result.e164);
  console.log('Country Code:', result.countryCode);
  console.log('Country Name:', result.countryName);
  console.log('National Number:', result.nationalNumber);
  
  // Output:
  // Valid: true
  // E.164: +526647945661
  // Country Code: +52
  // Country Name: Mexico
  // National Number: 6647945661
}

// ============================================================================
// EXAMPLE 2: Flexible Input Formats
// ============================================================================

export function example2_flexibleFormats() {
  console.log('=== Example 2: Flexible Input Formats ===');

  const formats = [
    '+52 6647945661',      // With space
    '+52-664-794-5661',    // With dashes
    '+52 (664) 794-5661',  // With parentheses
    '+526647945661',       // No formatting
  ];

  formats.forEach(format => {
    const result = parsePhoneNumber(format);
    console.log(`Input: ${format} => E.164: ${result.e164}`);
  });

  // Output:
  // Input: +52 6647945661 => E.164: +526647945661
  // Input: +52-664-794-5661 => E.164: +526647945661
  // Input: +52 (664) 794-5661 => E.164: +526647945661
  // Input: +526647945661 => E.164: +526647945661
}

// ============================================================================
// EXAMPLE 3: Multiple Countries
// ============================================================================

export function example3_multipleCountries() {
  console.log('=== Example 3: Multiple Countries ===');

  const numbers = [
    { phone: '+52 6647945661', country: 'Mexico' },
    { phone: '+1 2025551234', country: 'USA' },
    { phone: '+44 2071838750', country: 'UK' },
    { phone: '+49 3012345678', country: 'Germany' },
    { phone: '+86 13012345678', country: 'China' },
    { phone: '+55 1123456789', country: 'Brazil' },
  ];

  numbers.forEach(({ phone, country }) => {
    const result = parsePhoneNumber(phone);
    console.log(`${country}: ${phone} => ${result.e164}`);
  });
}

// ============================================================================
// EXAMPLE 4: Validation
// ============================================================================

export function example4_validation() {
  console.log('=== Example 4: Validation ===');

  const testNumbers = [
    '+52 6647945661',      // Valid
    '+1 2025551234',       // Valid
    '+52 123',             // Invalid - too few digits
    '+999 1234567890',     // Invalid - unknown country
    '6647945661',          // Invalid - no country code
  ];

  testNumbers.forEach(phone => {
    const isValid = isValidE164(phone);
    console.log(`${phone}: ${isValid ? '✓ Valid' : '✗ Invalid'}`);
  });

  // Output:
  // +52 6647945661: ✓ Valid
  // +1 2025551234: ✓ Valid
  // +52 123: ✗ Invalid
  // +999 1234567890: ✗ Invalid
  // 6647945661: ✗ Invalid
}

// ============================================================================
// EXAMPLE 5: Error Handling
// ============================================================================

export function example5_errorHandling() {
  console.log('=== Example 5: Error Handling ===');

  const invalidNumbers = [
    '+52 123',             // Too few digits
    '+52 12345678901234',  // Too many digits
    '+999 1234567890',     // Unknown country
    '+52 664ABC5661',      // Non-digit characters
  ];

  invalidNumbers.forEach(phone => {
    const result = parsePhoneNumber(phone);
    if (!result.isValid) {
      console.log(`Error for ${phone}:`);
      console.log(`  ${result.error}`);
    }
  });

  // Output:
  // Error for +52 123:
  //   Invalid number of digits for Mexico. Expected 10 digits, got 3
  // Error for +52 12345678901234:
  //   Invalid number of digits for Mexico. Expected 10 digits, got 14
  // Error for +999 1234567890:
  //   Unknown country code: +999
  // Error for +52 664ABC5661:
  //   National number contains non-digit characters: 664ABC5661
}

// ============================================================================
// EXAMPLE 6: Using Default Country Code
// ============================================================================

export function example6_defaultCountryCode() {
  console.log('=== Example 6: Using Default Country Code ===');

  // When you have just the national number, provide a default country code
  const nationalNumbers = [
    { number: '6647945661', country: '+52' },
    { number: '2025551234', country: '+1' },
    { number: '2071838750', country: '+44' },
  ];

  nationalNumbers.forEach(({ number, country }) => {
    const result = parsePhoneNumber(number, country);
    if (result.isValid) {
      console.log(`${number} (${country}) => ${result.e164}`);
    }
  });

  // Output:
  // 6647945661 (+52) => +526647945661
  // 2025551234 (+1) => +12025551234
  // 2071838750 (+44) => +442071838750
}

// ============================================================================
// EXAMPLE 7: Extracting Information
// ============================================================================

export function example7_extractingInfo() {
  console.log('=== Example 7: Extracting Information ===');

  const phone = '+52 6647945661';

  const countryCode = extractCountryCode(phone);
  const nationalNumber = extractNationalNumber(phone);
  const countryName = getCountryName(countryCode);

  console.log(`Phone: ${phone}`);
  console.log(`Country Code: ${countryCode}`);
  console.log(`Country Name: ${countryName}`);
  console.log(`National Number: ${nationalNumber}`);

  // Output:
  // Phone: +52 6647945661
  // Country Code: +52
  // Country Name: Mexico
  // National Number: 6647945661
}

// ============================================================================
// EXAMPLE 8: Converting to E.164
// ============================================================================

export function example8_convertToE164() {
  console.log('=== Example 8: Converting to E.164 ===');

  const messyNumbers = [
    '+52 (664) 794-5661',
    '+1 (202) 555-1234',
    '+44 207 183 8750',
  ];

  messyNumbers.forEach(phone => {
    const e164 = toE164(phone);
    console.log(`${phone} => ${e164}`);
  });

  // Output:
  // +52 (664) 794-5661 => +526647945661
  // +1 (202) 555-1234 => +12025551234
  // +44 207 183 8750 => +442071838750
}

// ============================================================================
// EXAMPLE 9: Looking Up Country Code by Name
// ============================================================================

export function example9_lookupByCountryName() {
  console.log('=== Example 9: Looking Up Country Code by Name ===');

  const countries = ['Mexico', 'USA/Canada', 'United Kingdom', 'China'];

  countries.forEach(country => {
    const code = getCountryCodeByName(country);
    console.log(`${country} => ${code}`);
  });

  // Output:
  // Mexico => +52
  // USA/Canada => +1
  // United Kingdom => +44
  // China => +86
}

// ============================================================================
// EXAMPLE 10: Getting All Supported Countries
// ============================================================================

export function example10_supportedCountries() {
  console.log('=== Example 10: Supported Countries ===');

  const codes = getSupportedCountryCodes();
  console.log(`Total supported countries: ${codes.length}`);
  console.log('First 10 country codes:', codes.slice(0, 10));

  // Output:
  // Total supported countries: 50
  // First 10 country codes: [ '+1', '+20', '+212', '+216', '+27', '+30', '+31', '+32', '+33', '+34' ]
}

// ============================================================================
// EXAMPLE 11: In a Service
// ============================================================================

export class UserService {
  /**
   * Create a user with phone validation
   */
  async createUser(userData: { name: string; phone: string; defaultCountry?: string }) {
    // Parse and validate the phone number
    const phoneResult = parsePhoneNumber(userData.phone, userData.defaultCountry);

    if (!phoneResult.isValid) {
      throw new Error(`Invalid phone number: ${phoneResult.error}`);
    }

    // Store the validated phone data
    const user = {
      name: userData.name,
      phone: phoneResult.e164,
      phone_code: phoneResult.countryCode,
      phone_country: phoneResult.countryName,
    };

    console.log('User created:', user);
    return user;
  }
}

// ============================================================================
// EXAMPLE 12: In a DTO with Decorator
// ============================================================================

import { IsPhone } from '../decorators/is-phone.decorator';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsPhone()
  @IsNotEmpty()
  phone: string;
}

// ============================================================================
// EXAMPLE 13: In an Import Script
// ============================================================================

export async function example13_importScript() {
  console.log('=== Example 13: Import Script ===');

  // Simulating importing phone numbers from a CSV
  const csvData = [
    { name: 'Juan', phone: '6647945661' },
    { name: 'Maria', phone: '6648945661' },
    { name: 'Carlos', phone: '6649945661' },
  ];

  const defaultCountryCode = '+52'; // Mexico

  const importedUsers = csvData.map(row => {
    const result = parsePhoneNumber(row.phone, defaultCountryCode);

    if (!result.isValid) {
      console.warn(`Skipping ${row.name}: ${result.error}`);
      return null;
    }

    return {
      name: row.name,
      phone: result.e164,
      phone_code: result.countryCode,
      phone_country: result.countryName,
    };
  }).filter(Boolean);

  console.log('Imported users:', importedUsers);
}

// ============================================================================
// EXAMPLE 14: Migrating Old Data
// ============================================================================

export async function example14_migrateOldData() {
  console.log('=== Example 14: Migrating Old Data ===');

  // Old data format: just digits
  const oldData = [
    { id: 1, phone: '2025551234', country: 'USA' },
    { id: 2, phone: '6647945661', country: 'Mexico' },
    { id: 3, phone: '2071838750', country: 'UK' },
  ];

  // Map old country names to country codes
  const countryMap: Record<string, string> = {
    'USA': '+1',
    'Mexico': '+52',
    'UK': '+44',
  };

  const migratedData = oldData.map(row => {
    const countryCode = countryMap[row.country];
    const result = parsePhoneNumber(row.phone, countryCode);

    if (!result.isValid) {
      console.error(`Failed to migrate ${row.id}: ${result.error}`);
      return null;
    }

    return {
      id: row.id,
      phone: result.e164,
      phone_code: result.countryCode,
      phone_country: result.countryName,
    };
  }).filter(Boolean);

  console.log('Migrated data:', migratedData);
}

// ============================================================================
// Run Examples
// ============================================================================

export function runAllExamples() {
  example1_basicParsing();
  console.log('\n');
  example2_flexibleFormats();
  console.log('\n');
  example3_multipleCountries();
  console.log('\n');
  example4_validation();
  console.log('\n');
  example5_errorHandling();
  console.log('\n');
  example6_defaultCountryCode();
  console.log('\n');
  example7_extractingInfo();
  console.log('\n');
  example8_convertToE164();
  console.log('\n');
  example9_lookupByCountryName();
  console.log('\n');
  example10_supportedCountries();
}
