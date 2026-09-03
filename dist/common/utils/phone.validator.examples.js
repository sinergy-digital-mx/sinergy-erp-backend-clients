"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserDto = exports.UserService = void 0;
exports.example1_basicParsing = example1_basicParsing;
exports.example2_flexibleFormats = example2_flexibleFormats;
exports.example3_multipleCountries = example3_multipleCountries;
exports.example4_validation = example4_validation;
exports.example5_errorHandling = example5_errorHandling;
exports.example6_defaultCountryCode = example6_defaultCountryCode;
exports.example7_extractingInfo = example7_extractingInfo;
exports.example8_convertToE164 = example8_convertToE164;
exports.example9_lookupByCountryName = example9_lookupByCountryName;
exports.example10_supportedCountries = example10_supportedCountries;
exports.example13_importScript = example13_importScript;
exports.example14_migrateOldData = example14_migrateOldData;
exports.runAllExamples = runAllExamples;
const phone_validator_1 = require("./phone.validator");
function example1_basicParsing() {
    console.log('=== Example 1: Basic Parsing ===');
    const result = (0, phone_validator_1.parsePhoneNumber)('+52 6647945661');
    console.log('Input: +52 6647945661');
    console.log('Valid:', result.isValid);
    console.log('E.164:', result.e164);
    console.log('Country Code:', result.countryCode);
    console.log('Country Name:', result.countryName);
    console.log('National Number:', result.nationalNumber);
}
function example2_flexibleFormats() {
    console.log('=== Example 2: Flexible Input Formats ===');
    const formats = [
        '+52 6647945661',
        '+52-664-794-5661',
        '+52 (664) 794-5661',
        '+526647945661',
    ];
    formats.forEach(format => {
        const result = (0, phone_validator_1.parsePhoneNumber)(format);
        console.log(`Input: ${format} => E.164: ${result.e164}`);
    });
}
function example3_multipleCountries() {
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
        const result = (0, phone_validator_1.parsePhoneNumber)(phone);
        console.log(`${country}: ${phone} => ${result.e164}`);
    });
}
function example4_validation() {
    console.log('=== Example 4: Validation ===');
    const testNumbers = [
        '+52 6647945661',
        '+1 2025551234',
        '+52 123',
        '+999 1234567890',
        '6647945661',
    ];
    testNumbers.forEach(phone => {
        const isValid = (0, phone_validator_1.isValidE164)(phone);
        console.log(`${phone}: ${isValid ? '✓ Valid' : '✗ Invalid'}`);
    });
}
function example5_errorHandling() {
    console.log('=== Example 5: Error Handling ===');
    const invalidNumbers = [
        '+52 123',
        '+52 12345678901234',
        '+999 1234567890',
        '+52 664ABC5661',
    ];
    invalidNumbers.forEach(phone => {
        const result = (0, phone_validator_1.parsePhoneNumber)(phone);
        if (!result.isValid) {
            console.log(`Error for ${phone}:`);
            console.log(`  ${result.error}`);
        }
    });
}
function example6_defaultCountryCode() {
    console.log('=== Example 6: Using Default Country Code ===');
    const nationalNumbers = [
        { number: '6647945661', country: '+52' },
        { number: '2025551234', country: '+1' },
        { number: '2071838750', country: '+44' },
    ];
    nationalNumbers.forEach(({ number, country }) => {
        const result = (0, phone_validator_1.parsePhoneNumber)(number, country);
        if (result.isValid) {
            console.log(`${number} (${country}) => ${result.e164}`);
        }
    });
}
function example7_extractingInfo() {
    console.log('=== Example 7: Extracting Information ===');
    const phone = '+52 6647945661';
    const countryCode = (0, phone_validator_1.extractCountryCode)(phone);
    const nationalNumber = (0, phone_validator_1.extractNationalNumber)(phone);
    const countryName = (0, phone_validator_1.getCountryName)(countryCode);
    console.log(`Phone: ${phone}`);
    console.log(`Country Code: ${countryCode}`);
    console.log(`Country Name: ${countryName}`);
    console.log(`National Number: ${nationalNumber}`);
}
function example8_convertToE164() {
    console.log('=== Example 8: Converting to E.164 ===');
    const messyNumbers = [
        '+52 (664) 794-5661',
        '+1 (202) 555-1234',
        '+44 207 183 8750',
    ];
    messyNumbers.forEach(phone => {
        const e164 = (0, phone_validator_1.toE164)(phone);
        console.log(`${phone} => ${e164}`);
    });
}
function example9_lookupByCountryName() {
    console.log('=== Example 9: Looking Up Country Code by Name ===');
    const countries = ['Mexico', 'USA/Canada', 'United Kingdom', 'China'];
    countries.forEach(country => {
        const code = (0, phone_validator_1.getCountryCodeByName)(country);
        console.log(`${country} => ${code}`);
    });
}
function example10_supportedCountries() {
    console.log('=== Example 10: Supported Countries ===');
    const codes = (0, phone_validator_1.getSupportedCountryCodes)();
    console.log(`Total supported countries: ${codes.length}`);
    console.log('First 10 country codes:', codes.slice(0, 10));
}
class UserService {
    async createUser(userData) {
        const phoneResult = (0, phone_validator_1.parsePhoneNumber)(userData.phone, userData.defaultCountry);
        if (!phoneResult.isValid) {
            throw new Error(`Invalid phone number: ${phoneResult.error}`);
        }
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
exports.UserService = UserService;
const is_phone_decorator_1 = require("../decorators/is-phone.decorator");
const class_validator_1 = require("class-validator");
class CreateUserDto {
    name;
    phone;
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "name", void 0);
__decorate([
    (0, is_phone_decorator_1.IsPhone)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "phone", void 0);
async function example13_importScript() {
    console.log('=== Example 13: Import Script ===');
    const csvData = [
        { name: 'Juan', phone: '6647945661' },
        { name: 'Maria', phone: '6648945661' },
        { name: 'Carlos', phone: '6649945661' },
    ];
    const defaultCountryCode = '+52';
    const importedUsers = csvData.map(row => {
        const result = (0, phone_validator_1.parsePhoneNumber)(row.phone, defaultCountryCode);
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
async function example14_migrateOldData() {
    console.log('=== Example 14: Migrating Old Data ===');
    const oldData = [
        { id: 1, phone: '2025551234', country: 'USA' },
        { id: 2, phone: '6647945661', country: 'Mexico' },
        { id: 3, phone: '2071838750', country: 'UK' },
    ];
    const countryMap = {
        'USA': '+1',
        'Mexico': '+52',
        'UK': '+44',
    };
    const migratedData = oldData.map(row => {
        const countryCode = countryMap[row.country];
        const result = (0, phone_validator_1.parsePhoneNumber)(row.phone, countryCode);
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
function runAllExamples() {
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
//# sourceMappingURL=phone.validator.examples.js.map