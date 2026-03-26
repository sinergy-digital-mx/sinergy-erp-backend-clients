import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
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
import { plainToInstance } from 'class-transformer';
import { MailerConfigurationService } from '../services/mailer-configuration.service';
import { CreateMailerConfigurationDto } from '../dto/create-mailer-configuration.dto';
import { UpdateMailerConfigurationDto } from '../dto/update-mailer-configuration.dto';
import { QueryMailerConfigurationDto } from '../dto/query-mailer-configuration.dto';
import { MailerConfigurationDto } from '../dto/mailer-configuration.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { TenantContextService } from '../../rbac/services/tenant-context.service';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tenant/mailer-configurations')
@ApiTags('Mailer Configurations')
@ApiBearerAuth()
export class MailerConfigurationController {
  constructor(
    private readonly service: MailerConfigurationService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Post()
  @RequirePermissions({ entityType: 'mailer_configurations', action: 'Create' })
  @ApiOperation({ summary: 'Create a new Resend configuration' })
  @ApiBody({ type: CreateMailerConfigurationDto })
  @ApiResponse({ status: 201, description: 'Configuration created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Body() dto: CreateMailerConfigurationDto): Promise<MailerConfigurationDto> {
    const tenantId = this.tenantContext.getCurrentTenantId();
    const userId = this.tenantContext.getCurrentUserId();
    if (!tenantId || !userId) {
      throw new Error('Tenant context is required');
    }
    const config = await this.service.create(tenantId, dto, userId);
    return plainToInstance(MailerConfigurationDto, config);
  }

  @Get()
  @RequirePermissions({ entityType: 'mailer_configurations', action: 'Read' })
  @ApiOperation({ summary: 'List Resend configurations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Configurations retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @Query() query: QueryMailerConfigurationDto,
  ): Promise<{ data: MailerConfigurationDto[]; total: number; page: number; limit: number }> {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    const result = await this.service.list(tenantId, query);
    return {
      ...result,
      data: plainToInstance(MailerConfigurationDto, result.data),
    };
  }

  @Get('active')
  @RequirePermissions({ entityType: 'mailer_configurations', action: 'Read' })
  @ApiOperation({ summary: 'Get active configuration' })
  @ApiResponse({ status: 200, description: 'Active configuration retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'No active configuration' })
  async getActive(): Promise<MailerConfigurationDto> {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    const config = await this.service.findActive(tenantId);
    return plainToInstance(MailerConfigurationDto, config);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'mailer_configurations', action: 'Read' })
  @ApiOperation({ summary: 'Get configuration by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(@Param('id') id: string): Promise<MailerConfigurationDto> {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    const config = await this.service.findById(tenantId, id);
    return plainToInstance(MailerConfigurationDto, config);
  }

  @Patch(':id')
  @RequirePermissions({ entityType: 'mailer_configurations', action: 'Update' })
  @ApiOperation({ summary: 'Update configuration' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: UpdateMailerConfigurationDto })
  @ApiResponse({ status: 200, description: 'Configuration updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMailerConfigurationDto,
  ): Promise<MailerConfigurationDto> {
    const tenantId = this.tenantContext.getCurrentTenantId();
    const userId = this.tenantContext.getCurrentUserId();
    if (!tenantId || !userId) {
      throw new Error('Tenant context is required');
    }
    const config = await this.service.update(tenantId, id, dto, userId);
    return plainToInstance(MailerConfigurationDto, config);
  }

  @Delete(':id')
  @HttpCode(200)
  @RequirePermissions({ entityType: 'mailer_configurations', action: 'Delete' })
  @ApiOperation({ summary: 'Delete configuration' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Configuration deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async remove(@Param('id') id: string): Promise<void> {
    const tenantId = this.tenantContext.getCurrentTenantId();
    const userId = this.tenantContext.getCurrentUserId();
    if (!tenantId || !userId) {
      throw new Error('Tenant context is required');
    }
    return this.service.delete(tenantId, id, userId);
  }

  @Post(':id/activate')
  @RequirePermissions({ entityType: 'mailer_configurations', action: 'Update' })
  @ApiOperation({ summary: 'Activate configuration' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Configuration activated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async activate(@Param('id') id: string): Promise<MailerConfigurationDto> {
    const tenantId = this.tenantContext.getCurrentTenantId();
    const userId = this.tenantContext.getCurrentUserId();
    if (!tenantId || !userId) {
      throw new Error('Tenant context is required');
    }
    const config = await this.service.activate(tenantId, id, userId);
    return plainToInstance(MailerConfigurationDto, config);
  }
}
