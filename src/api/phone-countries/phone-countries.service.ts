import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PhoneCountry } from '../../entities/phone-country.entity';

@Injectable()
export class PhoneCountriesService {
  constructor(
    @InjectRepository(PhoneCountry)
    private phoneCountryRepo: Repository<PhoneCountry>,
  ) {}

  async findAll() {
    return this.phoneCountryRepo.find({
      where: { is_active: true },
      order: { country_name: 'ASC' },
    });
  }

  async findByPhoneCode(phoneCode: string) {
    return this.phoneCountryRepo.findOne({
      where: { phone_code: phoneCode, is_active: true },
    });
  }

  async findByCountryCode(countryCode: string) {
    return this.phoneCountryRepo.findOne({
      where: { country_code: countryCode, is_active: true },
    });
  }

  async search(query: string) {
    return this.phoneCountryRepo
      .createQueryBuilder('pc')
      .where('pc.is_active = :active', { active: true })
      .andWhere(
        '(LOWER(pc.country_name) LIKE LOWER(:query) OR pc.phone_code LIKE :query OR pc.country_code LIKE :query)',
        { query: `%${query}%` }
      )
      .orderBy('pc.country_name', 'ASC')
      .getMany();
  }
}
