"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePhoneNumber = parsePhoneNumber;
exports.isValidE164 = isValidE164;
exports.toE164 = toE164;
exports.extractCountryCode = extractCountryCode;
exports.extractNationalNumber = extractNationalNumber;
exports.getCountryName = getCountryName;
exports.getSupportedCountryCodes = getSupportedCountryCodes;
exports.getCountryCodeByName = getCountryCodeByName;
const COUNTRY_CODES = {
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
function parsePhoneNumber(phoneInput, defaultCountryCode) {
    if (!phoneInput || typeof phoneInput !== 'string') {
        return {
            isValid: false,
            e164: '',
            countryCode: '',
            nationalNumber: '',
            error: 'Phone number is required and must be a string',
        };
    }
    let cleaned = phoneInput.trim().replace(/[\s\-().]/g, '');
    let countryCode = '';
    let nationalNumber = '';
    if (cleaned.startsWith('+')) {
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
    }
    else {
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
    if (!/^\d+$/.test(nationalNumber)) {
        return {
            isValid: false,
            e164: '',
            countryCode,
            nationalNumber: '',
            error: `National number contains non-digit characters: ${nationalNumber}`,
        };
    }
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
    const e164 = `${countryCode}${nationalNumber}`;
    return {
        isValid: true,
        e164,
        countryCode,
        nationalNumber,
        countryName: countryInfo.name,
    };
}
function isValidE164(phoneNumber) {
    const result = parsePhoneNumber(phoneNumber);
    return result.isValid;
}
function toE164(phoneInput, defaultCountryCode) {
    const result = parsePhoneNumber(phoneInput, defaultCountryCode);
    return result.isValid ? result.e164 : '';
}
function extractCountryCode(phoneNumber) {
    const result = parsePhoneNumber(phoneNumber);
    return result.countryCode;
}
function extractNationalNumber(phoneNumber) {
    const result = parsePhoneNumber(phoneNumber);
    return result.nationalNumber;
}
function getCountryName(countryCode) {
    return COUNTRY_CODES[countryCode]?.name;
}
function getSupportedCountryCodes() {
    return Object.keys(COUNTRY_CODES);
}
function getCountryCodeByName(countryName) {
    const normalized = countryName.toLowerCase();
    for (const [code, info] of Object.entries(COUNTRY_CODES)) {
        if (info.name.toLowerCase() === normalized) {
            return code;
        }
    }
    return undefined;
}
//# sourceMappingURL=phone.validator.js.map