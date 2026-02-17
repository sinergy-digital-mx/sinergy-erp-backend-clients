import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CatalogsService } from './catalogs.service';
import { CatalogType } from '../../entities/catalog.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tenant/catalogs')
@ApiTags('Catalogs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class CatalogsController {
  constructor(private readonly catalogsService: CatalogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all catalogs or filter by type' })
  @ApiQuery({ name: 'type', required: false, enum: CatalogType, description: 'Catalog type filter' })
  @ApiResponse({
    status: 200,
    description: 'List of catalogs',
    schema: {
      example: [
        {
          id: 1,
          catalog_type: 'phone_country',
          name: 'United States',
          code: 'US',
          value: '+1',
          description: null,
          metadata: null,
          is_active: true,
          sort_order: 0,
        },
      ],
    },
  })
  async findAll(@Query('type') type?: CatalogType) {
    return this.catalogsService.findAll(type);
  }

  @Get('by-type')
  @ApiOperation({ summary: 'Get catalogs by type' })
  @ApiQuery({ name: 'type', enum: CatalogType, description: 'Catalog type' })
  @ApiResponse({
    status: 200,
    description: 'Catalogs of specified type',
  })
  async findByType(@Query('type') type: CatalogType) {
    return this.catalogsService.findByType(type);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search catalogs by type and query' })
  @ApiQuery({ name: 'type', enum: CatalogType, description: 'Catalog type' })
  @ApiQuery({ name: 'q', description: 'Search query (name, code, or value)' })
  @ApiResponse({
    status: 200,
    description: 'Filtered catalogs',
  })
  async search(@Query('type') type: CatalogType, @Query('q') query: string) {
    if (!query || query.length < 1) {
      return this.catalogsService.findByType(type);
    }
    return this.catalogsService.search(type, query);
  }

  @Get('phone-countries')
  @ApiOperation({ summary: 'Get all phone countries (convenience endpoint)' })
  @ApiResponse({
    status: 200,
    description: 'List of phone countries',
  })
  async getPhoneCountries() {
    return this.catalogsService.findByType(CatalogType.PHONE_COUNTRY);
  }
}
