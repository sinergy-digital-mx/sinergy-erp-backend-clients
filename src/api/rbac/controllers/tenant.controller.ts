import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  UseGuards,
  Logger,
  Req,
} from '@nestjs/common';
import { TenantService, TenantCreationOptions, TenantCreationResult, TenantDeletionResult } from '../services/tenant.service';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { PermissionGuard } from '../guards/permission.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

export class CreateTenantDto {
  name: string;
  subdomain: string;
  isActive?: boolean;
  skipSystemRoles?: boolean;
  customRoleTemplates?: Array<{
    name: string;
    description: string;
    permissions: Array<{
      entityType: string;
      actions: string[];
    }>;
  }>;
}

export class UpdateTenantStatusDto {
  isActive: boolean;
}

@Controller('rbac/tenants')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class TenantController {
  private readonly logger = new Logger(TenantController.name);

  constructor(private readonly tenantService: TenantService) {}

  /**
   * Create a new tenant with automatic role initialization
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions({ entityType: 'Tenant', action: 'Create' })
  async createTenant(@Body() createTenantDto: CreateTenantDto): Promise<{
    message: string;
    tenant: any;
    systemRoles: {
      totalRoles: number;
      totalPermissions: number;
      errors: string[];
    };
    customRoles: {
      totalRoles: number;
      totalPermissions: number;
      errors: string[];
    };
    warnings: string[];
  }> {
    this.logger.log(`Creating tenant: ${createTenantDto.name}`);

    const options: TenantCreationOptions = {
      name: createTenantDto.name,
      subdomain: createTenantDto.subdomain,
      isActive: createTenantDto.isActive,
      skipSystemRoles: createTenantDto.skipSystemRoles,
      customRoleTemplates: createTenantDto.customRoleTemplates,
    };

    const result: TenantCreationResult = await this.tenantService.createTenant(options);

    return {
      message: 'Tenant created successfully',
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        subdomain: result.tenant.subdomain,
        isActive: result.tenant.is_active,
        createdAt: result.tenant.created_at,
      },
      systemRoles: {
        totalRoles: result.systemRoles.totalRoles,
        totalPermissions: result.systemRoles.totalPermissions,
        errors: result.systemRoles.errors,
      },
      customRoles: {
        totalRoles: result.customRoles.totalRoles,
        totalPermissions: result.customRoles.totalPermissions,
        errors: result.customRoles.errors,
      },
      warnings: result.warnings,
    };
  }

  /**
   * Get tenant by ID
   */
  @Get(':tenantId')
  @RequirePermissions({ entityType: 'Tenant', action: 'Read' })
  async getTenant(@Param('tenantId') tenantId: string): Promise<{
    tenant: any;
  }> {
    const tenant = await this.tenantService.getTenantById(tenantId);
    
    if (!tenant) {
      throw new Error(`Tenant with ID ${tenantId} not found`);
    }

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        isActive: tenant.is_active,
        createdAt: tenant.created_at,
        updatedAt: tenant.updated_at,
      },
    };
  }

  /**
   * Initialize roles for an existing tenant
   */
  @Post(':tenantId/initialize-roles')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ entityType: 'Tenant', action: 'Update' })
  async initializeRoles(@Param('tenantId') tenantId: string): Promise<{
    message: string;
    systemRoles: {
      totalRoles: number;
      totalPermissions: number;
      errors: string[];
    };
    customRoles: {
      totalRoles: number;
      totalPermissions: number;
      errors: string[];
    };
  }> {
    this.logger.log(`Initializing roles for tenant: ${tenantId}`);

    const result = await this.tenantService.initializeRolesForTenant(tenantId);

    return {
      message: 'Roles initialized successfully',
      systemRoles: {
        totalRoles: result.systemRoles.totalRoles,
        totalPermissions: result.systemRoles.totalPermissions,
        errors: result.systemRoles.errors,
      },
      customRoles: {
        totalRoles: result.customRoles.totalRoles,
        totalPermissions: result.customRoles.totalPermissions,
        errors: result.customRoles.errors,
      },
    };
  }

  /**
   * Update tenant status (active/inactive)
   */
  @Put(':tenantId/status')
  @RequirePermissions({ entityType: 'Tenant', action: 'Update' })
  async updateTenantStatus(
    @Param('tenantId') tenantId: string,
    @Body() updateStatusDto: UpdateTenantStatusDto,
  ): Promise<{
    message: string;
    tenant: any;
  }> {
    this.logger.log(`Updating status for tenant: ${tenantId} to ${updateStatusDto.isActive}`);

    const tenant = await this.tenantService.updateTenantStatus(tenantId, updateStatusDto.isActive);

    return {
      message: 'Tenant status updated successfully',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        isActive: tenant.is_active,
        updatedAt: tenant.updated_at,
      },
    };
  }

  /**
   * Delete a tenant and all associated data with cascade deletion
   */
  @Delete(':tenantId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ entityType: 'Tenant', action: 'Delete' })
  async deleteTenant(
    @Param('tenantId') tenantId: string,
    @Req() request: any,
  ): Promise<{
    message: string;
    deletionResult: {
      tenantId: string;
      tenantName: string;
      deletedAt: Date;
      cascadeResults: {
        userRoles: number;
        rolePermissions: number;
        roles: number;
        auditLogs: number;
      };
      warnings: string[];
    };
  }> {
    this.logger.log(`Deleting tenant: ${tenantId}`);
    
    // Get actor ID from JWT token for audit logging
    const actorId = request.user?.id;
    
    const deletionResult: TenantDeletionResult = await this.tenantService.deleteTenant(tenantId, actorId);

    return {
      message: 'Tenant deleted successfully with cascade cleanup',
      deletionResult: {
        tenantId: deletionResult.tenantId,
        tenantName: deletionResult.tenantName,
        deletedAt: deletionResult.deletedAt,
        cascadeResults: deletionResult.cascadeResults,
        warnings: deletionResult.warnings,
      },
    };
  }

  /**
   * Validate orphaned references for a tenant
   */
  @Get(':tenantId/validate-references')
  @RequirePermissions({ entityType: 'Tenant', action: 'Read' })
  async validateOrphanedReferences(@Param('tenantId') tenantId: string): Promise<{
    tenantId: string;
    warnings: string[];
    isValid: boolean;
  }> {
    this.logger.log(`Validating orphaned references for tenant: ${tenantId}`);
    
    const warnings = await this.tenantService.validateOrphanedReferences(tenantId);

    return {
      tenantId,
      warnings,
      isValid: warnings.length === 0,
    };
  }
}