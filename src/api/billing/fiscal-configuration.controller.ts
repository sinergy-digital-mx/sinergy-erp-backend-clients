import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  Delete,
  Query,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FiscalConfigurationService } from './fiscal-configuration.service';
import { CreateFiscalConfigurationDto } from './dto/create-fiscal-configuration.dto';
import { UpdateFiscalConfigurationDto } from './dto/update-fiscal-configuration.dto';
import { QueryFiscalConfigurationDto } from './dto/query-fiscal-configuration.dto';
import { PaginatedFiscalConfigurationDto } from './dto/paginated-fiscal-configuration.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tenant/fiscal-configurations')
@ApiTags('Fiscal Configurations')
@ApiBearerAuth()
export class FiscalConfigurationController {
  constructor(private readonly service: FiscalConfigurationService) {}

  @Post()
  @RequirePermissions({ entityType: 'fiscal_configurations', action: 'Create' })
  @ApiOperation({ summary: 'Create a new fiscal configuration' })
  @ApiBody({ type: CreateFiscalConfigurationDto })
  @ApiResponse({ status: 201, description: 'Fiscal configuration created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  create(@Body() dto: CreateFiscalConfigurationDto, @Req() req) {
    return this.service.create(dto, req.user.tenantId);
  }

  @Get()
  @RequirePermissions({ entityType: 'fiscal_configurations', action: 'Read' })
  @ApiOperation({ summary: 'Get paginated fiscal configurations with search and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of fiscal configurations retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Query() query: QueryFiscalConfigurationDto, @Req() req): Promise<PaginatedFiscalConfigurationDto> {
    return this.service.findAll(req.user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'fiscal_configurations', action: 'Read' })
  @ApiOperation({ summary: 'Get a specific fiscal configuration by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Fiscal Configuration ID' })
  @ApiResponse({ status: 200, description: 'Fiscal configuration retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string, @Req() req) {
    return this.service.findOne(id, req.user.tenantId);
  }



  @Put(':id')
  @RequirePermissions({ entityType: 'fiscal_configurations', action: 'Update' })
  @ApiOperation({ summary: 'Update an existing fiscal configuration' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: UpdateFiscalConfigurationDto })
  @ApiResponse({ status: 200, description: 'Fiscal configuration updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(@Param('id') id: string, @Body() dto: UpdateFiscalConfigurationDto, @Req() req) {
    return this.service.update(id, dto, req.user.tenantId);
  }

  @Delete(':id')
  @HttpCode(200)
  @RequirePermissions({ entityType: 'fiscal_configurations', action: 'Delete' })
  @ApiOperation({ summary: 'Delete a fiscal configuration by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Fiscal configuration deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id') id: string, @Req() req) {
    return this.service.remove(id, req.user.tenantId);
  }
}
