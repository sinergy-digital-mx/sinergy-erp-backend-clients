import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhoneCountry } from '../../entities/phone-country.entity';
import { PhoneCountriesService } from './phone-countries.service';
import { PhoneCountriesController } from './phone-countries.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PhoneCountry])],
  providers: [PhoneCountriesService],
  controllers: [PhoneCountriesController],
  exports: [PhoneCountriesService],
})
export class PhoneCountriesModule {}
