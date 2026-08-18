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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { FiscalConfigurationFinkokService } from '../electronic-invoicing/services/fiscal-configuration-finkok.service';
import { RegisterFiscalConfigurationFinkokDto } from '../electronic-invoicing/dto/register-fiscal-configuration-finkok.dto';
import type { FinkokEnvironment } from '../../entities/electronic-invoicing/finkok-provider-configuration.entity';
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
  constructor(
    private readonly service: FiscalConfigurationService,
    private readonly finkokService: FiscalConfigurationFinkokService,
  ) {}

  @Post()
  @RequirePermissions({ entityType: 'FiscalConfiguration', action: 'Create' })
  @ApiOperation({ summary: 'Create a new fiscal configuration' })
  @ApiBody({ type: CreateFiscalConfigurationDto })
  @ApiResponse({ status: 201, description: 'Fiscal configuration created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  create(@Body() dto: CreateFiscalConfigurationDto, @Req() req) {
    return this.service.create(dto, req.user.tenantId, req.user.id);
  }

  @Get()
  @RequirePermissions({ entityType: 'FiscalConfiguration', action: 'Read' })
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

  @Get(':id/finkok-status')
  @RequirePermissions({ entityType: 'FiscalConfiguration', action: 'Read' })
  @ApiOperation({
    summary: 'Consultar si el RFC de la razón emisora existe en Finkok',
  })
  @ApiQuery({ name: 'environment', required: false, enum: ['demo', 'production'] })
  getFinkokStatus(
    @Param('id') id: string,
    @Query('environment') environment: FinkokEnvironment | undefined,
    @Req() req: { user: { tenantId: string } },
  ) {
    return this.finkokService.getFinkokStatus(id, req.user.tenantId, environment);
  }

  @Post(':id/register-finkok')
  @HttpCode(200)
  @RequirePermissions({ entityType: 'FiscalConfiguration', action: 'Update' })
  @ApiOperation({ summary: 'Vincular o registrar razón emisora en Finkok' })
  registerFinkok(
    @Param('id') id: string,
    @Body() dto: RegisterFiscalConfigurationFinkokDto,
    @Req() req: { user: { tenantId: string; id: string } },
  ) {
    return this.finkokService.registerIssuer(id, req.user.tenantId, req.user.id, dto);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'FiscalConfiguration', action: 'Read' })
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
  @RequirePermissions({ entityType: 'FiscalConfiguration', action: 'Update' })
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

  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('file'))
  @RequirePermissions({ entityType: 'FiscalConfiguration', action: 'Update' })
  @ApiOperation({ summary: 'Upload logo for a fiscal configuration' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Logo uploaded successfully' })
  uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    if (!file) {
      throw new BadRequestException('No se envió ningún archivo');
    }

    return this.service.uploadLogo(id, req.user.tenantId, file);
  }

  @Delete(':id')
  @HttpCode(200)
  @RequirePermissions({ entityType: 'FiscalConfiguration', action: 'Delete' })
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
