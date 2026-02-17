import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { TenantContextService } from '../../rbac/services/tenant-context.service';
import { ThirdPartyConfigService } from '../services/third-party-config.service';
import { CreateThirdPartyConfigDto } from '../dto/create-third-party-config.dto';
import { UpdateThirdPartyConfigDto } from '../dto/update-third-party-config.dto';

@ApiTags('Tenant - Third-Party Integrations')
@Controller('tenant/integrations/third-party-configs')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class ThirdPartyConfigController {
  constructor(
    private configService: ThirdPartyConfigService,
    private tenantContextService: TenantContextService,
  ) {}

  @Post()
  @RequirePermissions({ entityType: 'Integration', action: 'Create' })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create third-party configuration',
    description: 'Create a new third-party API configuration for the tenant',
  })
  @ApiResponse({
    status: 201,
    description: 'Configuration created successfully',
  })
  async create(@Body() dto: CreateThirdPartyConfigDto) {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    const userId = this.tenantContextService.getCurrentUserId();

    if (!tenantId || !userId) {
      throw new Error('Tenant context is required');
    }

    const config = await this.configService.create(tenantId, dto, userId);

    return this.maskSensitiveData(config);
  }

  @Get()
  @RequirePermissions({ entityType: 'Integration', action: 'Read' })
  @ApiOperation({
    summary: 'List third-party configurations',
    description: 'List all third-party configurations for the tenant',
  })
  @ApiResponse({
    status: 200,
    description: 'List of configurations',
  })
  async list() {
    const tenantId = this.tenantContextService.getCurrentTenantId();

    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    const configs = await this.configService.listByTenant(tenantId);

    return {
      configs: configs.map((c) => this.maskSensitiveData(c)),
    };
  }

  @Get(':configId')
  @RequirePermissions({ entityType: 'Integration', action: 'Read' })
  @ApiOperation({
    summary: 'Get third-party configuration',
    description: 'Get a specific third-party configuration with decrypted secrets',
  })
  @ApiParam({ name: 'configId', description: 'Configuration ID' })
  @ApiResponse({
    status: 200,
    description: 'Configuration details',
  })
  async getById(@Param('configId') configId: string) {
    const tenantId = this.tenantContextService.getCurrentTenantId();

    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    const config = await this.configService.getById(configId, tenantId);

    return config;
  }

  @Put(':configId')
  @RequirePermissions({ entityType: 'Integration', action: 'Update' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update third-party configuration',
    description: 'Update a third-party configuration',
  })
  @ApiParam({ name: 'configId', description: 'Configuration ID' })
  @ApiResponse({
    status: 200,
    description: 'Configuration updated successfully',
  })
  async update(
    @Param('configId') configId: string,
    @Body() dto: UpdateThirdPartyConfigDto,
  ) {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    const userId = this.tenantContextService.getCurrentUserId();

    if (!tenantId || !userId) {
      throw new Error('Tenant context is required');
    }

    const config = await this.configService.update(
      configId,
      tenantId,
      dto,
      userId,
    );

    return this.maskSensitiveData(config);
  }

  @Delete(':configId')
  @RequirePermissions({ entityType: 'Integration', action: 'Delete' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete third-party configuration',
    description: 'Delete a third-party configuration',
  })
  @ApiParam({ name: 'configId', description: 'Configuration ID' })
  @ApiResponse({
    status: 200,
    description: 'Configuration deleted successfully',
  })
  async delete(@Param('configId') configId: string) {
    const tenantId = this.tenantContextService.getCurrentTenantId();

    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    await this.configService.delete(configId, tenantId);

    return { message: 'Configuration deleted successfully' };
  }

  @Post(':configId/test')
  @RequirePermissions({ entityType: 'Integration', action: 'Read' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test configuration',
    description: 'Test if the configuration is valid and decryptable',
  })
  @ApiParam({ name: 'configId', description: 'Configuration ID' })
  @ApiResponse({
    status: 200,
    description: 'Test result',
  })
  async test(@Param('configId') configId: string) {
    const tenantId = this.tenantContextService.getCurrentTenantId();

    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    const isValid = await this.configService.testConfig(configId, tenantId);

    return {
      is_valid: isValid,
      message: isValid ? 'Configuration is valid' : 'Configuration test failed',
    };
  }

  /**
   * Mask sensitive data in response (show only last 4 chars)
   */
  private maskSensitiveData(config: any) {
    return {
      ...config,
      encrypted_api_key: this.maskSecret(config.encrypted_api_key),
      encrypted_api_secret: config.encrypted_api_secret
        ? this.maskSecret(config.encrypted_api_secret)
        : null,
      encrypted_webhook_secret: config.encrypted_webhook_secret
        ? this.maskSecret(config.encrypted_webhook_secret)
        : null,
    };
  }

  private maskSecret(secret: string): string {
    if (!secret || secret.length < 4) return '****';
    return `****${secret.slice(-4)}`;
  }
}
