import { Repository } from 'typeorm';
import { PhoneCountry } from '../../entities/phone-country.entity';
export declare class PhoneCountriesService {
    private phoneCountryRepo;
    constructor(phoneCountryRepo: Repository<PhoneCountry>);
    findAll(): Promise<PhoneCountry[]>;
    findByPhoneCode(phoneCode: string): Promise<PhoneCountry | null>;
    findByCountryCode(countryCode: string): Promise<PhoneCountry | null>;
    search(query: string): Promise<PhoneCountry[]>;
}
