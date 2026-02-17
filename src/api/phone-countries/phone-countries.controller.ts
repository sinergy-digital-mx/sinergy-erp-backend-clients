import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { PhoneCountriesService } from './phone-countries.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('phone-countries')
@ApiTags('Phone Countries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class PhoneCountriesController {
  constructor(private readonly phoneCountriesService: PhoneCountriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all phone countries' })
  @ApiResponse({
    status: 200,
    description: 'List of all phone countries',
    schema: {
      example: [
        {
          id: 1,
          country_name: 'United States',
          country_code: 'US',
          phone_code: '+1',
          flag_emoji: '🇺🇸',
          is_active: true,
        },
        {
          id: 2,
          country_name: 'Mexico',
          country_code: 'MX',
          phone_code: '+52',
          flag_emoji: '🇲🇽',
          is_active: true,
        },
      ],
    },
  })
  async findAll() {
    return this.phoneCountriesService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search phone countries by name, code, or phone code' })
  @ApiQuery({ name: 'q', description: 'Search query (country name, code, or phone code)' })
  @ApiResponse({
    status: 200,
    description: 'Filtered list of phone countries',
  })
  async search(@Query('q') query: string) {
    if (!query || query.length < 1) {
      return [];
    }
    return this.phoneCountriesService.search(query);
  }

  @Get('by-code')
  @ApiOperation({ summary: 'Get phone country by country code' })
  @ApiQuery({ name: 'code', description: 'Country code (e.g., US, MX, ES)' })
  @ApiResponse({
    status: 200,
    description: 'Phone country details',
  })
  async findByCountryCode(@Query('code') code: string) {
    return this.phoneCountriesService.findByCountryCode(code);
  }

  @Get('by-phone-code')
  @ApiOperation({ summary: 'Get phone country by phone code' })
  @ApiQuery({ name: 'phone_code', description: 'Phone code (e.g., +1, +52, +34)' })
  @ApiResponse({
    status: 200,
    description: 'Phone country details',
  })
  async findByPhoneCode(@Query('phone_code') phoneCode: string) {
    return this.phoneCountriesService.findByPhoneCode(phoneCode);
  }
}
