export declare function example1_basicParsing(): void;
export declare function example2_flexibleFormats(): void;
export declare function example3_multipleCountries(): void;
export declare function example4_validation(): void;
export declare function example5_errorHandling(): void;
export declare function example6_defaultCountryCode(): void;
export declare function example7_extractingInfo(): void;
export declare function example8_convertToE164(): void;
export declare function example9_lookupByCountryName(): void;
export declare function example10_supportedCountries(): void;
export declare class UserService {
    createUser(userData: {
        name: string;
        phone: string;
        defaultCountry?: string;
    }): Promise<{
        name: string;
        phone: string;
        phone_code: string;
        phone_country: string | undefined;
    }>;
}
export declare class CreateUserDto {
    name: string;
    phone: string;
}
export declare function example13_importScript(): Promise<void>;
export declare function example14_migrateOldData(): Promise<void>;
export declare function runAllExamples(): void;
