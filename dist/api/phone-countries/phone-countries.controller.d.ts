import { PhoneCountriesService } from './phone-countries.service';
export declare class PhoneCountriesController {
    private readonly phoneCountriesService;
    constructor(phoneCountriesService: PhoneCountriesService);
    findAll(): Promise<import("../../entities/phone-country.entity").PhoneCountry[]>;
    search(query: string): Promise<import("../../entities/phone-country.entity").PhoneCountry[]>;
    findByCountryCode(code: string): Promise<import("../../entities/phone-country.entity").PhoneCountry | null>;
    findByPhoneCode(phoneCode: string): Promise<import("../../entities/phone-country.entity").PhoneCountry | null>;
}
