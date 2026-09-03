export interface PhoneParseResult {
    isValid: boolean;
    e164: string;
    countryCode: string;
    countryName?: string;
    nationalNumber: string;
    error?: string;
}
export declare function parsePhoneNumber(phoneInput: string, defaultCountryCode?: string): PhoneParseResult;
export declare function isValidE164(phoneNumber: string): boolean;
export declare function toE164(phoneInput: string, defaultCountryCode?: string): string;
export declare function extractCountryCode(phoneNumber: string): string;
export declare function extractNationalNumber(phoneNumber: string): string;
export declare function getCountryName(countryCode: string): string | undefined;
export declare function getSupportedCountryCodes(): string[];
export declare function getCountryCodeByName(countryName: string): string | undefined;
