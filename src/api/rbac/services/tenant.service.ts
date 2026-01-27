import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RBACTenant } from '../../../entities/rbac/tenant.entity';
import { Role } from '../../../entities/rbac/role.entity';
import { UserRole } from '../../../entities/rbac/user-role.entity';
import { RolePermission } from '../../../entities/rbac/role-permission.entity';
import { AuditLog } from '../../../entities/rbac/audit-log.entity';
import { RoleTemplateService, BulkRoleCreationResult } from './role-template.service';
import { AuditLogService, AuditAction } from './audit-log.service';
import { ConfigService } from '@nestjs/config';

export interface TenantCreationOptions {
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

export interface TenantCreationResult {
  tenant: RBACTenant;
  systemRoles: BulkRoleCreationResult;
  customRoles: BulkRoleCreationResult;
  warnings: string[];
}

export interface TenantDeletionResult {
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
}

export interface TenantDataCounts {
  userRoles: number;
  rolePermissions: number;
  roles: number;
  auditLogs: number;
  activeUsers: number;
}

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    @InjectRepository(RBACTenant)
    private tenantRepository: Repository<RBACTenant>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private roleTemplateService: RoleTemplateService,
    private auditLogService: AuditLogService,
    private configService: ConfigService,
  ) {}

  /**
   * Create a new tenant with automatic role initialization
   * @param options - Tenant creation options
   * @returns Promise<TenantCreationResult> - Result of tenant creation
   */
  async createTenant(options: TenantCreationOptions): Promise<TenantCreationResult> {
    this.logger.debug(`Creating tenant: ${options.name} (${options.subdomain})`);

    // Validate input
    this.validateTenantOptions(options);

    // Check if tenant already exists
    await this.checkTenantUniqueness(options.name, options.subdomain);

    const result: TenantCreationResult = {
      tenant: null as any, // Will be set after tenant creation
      systemRoles: {
        roles: [],
        totalRoles: 0,
        totalPermissions: 0,
        errors: [],
      },
      customRoles: {
        roles: [],
        totalRoles: 0,
        totalPermissions: 0,
        errors: [],
      },
      warnings: [],
    };

    try {
      // Create the tenant
      const tenant = this.tenantRepository.create({
        name: options.name,
        subdomain: options.subdomain,
        is_active: options.isActive ?? true,
      });

      result.tenant = await this.tenantRepository.save(tenant);
      this.logger.debug(`Created tenant ${options.name} with ID ${result.tenant.id}`);

      // Create system roles unless explicitly skipped
      if (!options.skipSystemRoles) {
        try {
          result.systemRoles = await this.roleTemplateService.createSystemRolesForTenant(
            result.tenant.id,
            true, // Skip existing roles
          );
          this.logger.debug(
            `Created ${result.systemRoles.totalRoles} system roles for tenant ${result.tenant.id}`
          );
        } catch (error) {
          this.logger.error(`Failed to create system roles for tenant ${result.tenant.id}:`, error);
          result.warnings.push(`Failed to create system roles: ${error.message}`);
        }
      }

      // Create custom roles from configuration
      const configCustomRoles = this.getCustomRoleTemplatesFromConfig();
      const allCustomRoles = [...configCustomRoles, ...(options.customRoleTemplates || [])];

      if (allCustomRoles.length > 0) {
        try {
          result.customRoles = await this.createCustomRolesForTenant(
            result.tenant.id,
            allCustomRoles,
          );
          this.logger.debug(
            `Created ${result.customRoles.totalRoles} custom roles for tenant ${result.tenant.id}`
          );
        } catch (error) {
          this.logger.error(`Failed to create custom roles for tenant ${result.tenant.id}:`, error);
          result.warnings.push(`Failed to create custom roles: ${error.message}`);
        }
      }

      this.logger.log(
        `Tenant creation completed for ${options.name}: ` +
        `${result.systemRoles.totalRoles} system roles, ` +
        `${result.customRoles.totalRoles} custom roles, ` +
        `${result.systemRoles.totalPermissions + result.customRoles.totalPermissions} total permissions`
      );

      return result;
    } catch (error) {
      // If tenant creation fails after tenant is saved, we should clean up
      if (result.tenant) {
        try {
          await this.tenantRepository.remove(result.tenant);
          this.logger.debug(`Cleaned up tenant ${result.tenant.id} after creation failure`);
        } catch (cleanupError) {
          this.logger.error(`Failed to cleanup tenant after creation failure:`, cleanupError);
        }
      }
      throw error;
    }
  }

  /**
   * Get a tenant by ID
   * @param tenantId - The tenant ID
   * @returns Promise<RBACTenant | null> - The tenant or null if not found
   */
  async getTenantById(tenantId: string): Promise<RBACTenant | null> {
    return await this.tenantRepository.findOne({
      where: { id: tenantId },
    });
  }

  /**
   * Get a tenant by subdomain
   * @param subdomain - The tenant subdomain
   * @returns Promise<RBACTenant | null> - The tenant or null if not found
   */
  async getTenantBySubdomain(subdomain: string): Promise<RBACTenant | null> {
    return await this.tenantRepository.findOne({
      where: { subdomain },
    });
  }

  /**
   * Initialize roles for an existing tenant
   * This is useful for tenants created before role initialization was implemented
   * @param tenantId - The tenant ID
   * @param skipExisting - Whether to skip roles that already exist (default: true)
   * @returns Promise<{ systemRoles: BulkRoleCreationResult; customRoles: BulkRoleCreationResult }>
   */
  async initializeRolesForTenant(
    tenantId: string,
    skipExisting: boolean = true,
  ): Promise<{ systemRoles: BulkRoleCreationResult; customRoles: BulkRoleCreationResult; warnings: string[] }> {
    this.logger.debug(`Initializing roles for existing tenant ${tenantId}`);

    // Verify tenant exists
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new BadRequestException(`Tenant with ID ${tenantId} not found`);
    }

    const result = {
      systemRoles: { roles: [], totalRoles: 0, totalPermissions: 0, errors: [] } as BulkRoleCreationResult,
      customRoles: { roles: [], totalRoles: 0, totalPermissions: 0, errors: [] } as BulkRoleCreationResult,
      warnings: [] as string[],
    };

    // Create system roles with error handling
    try {
      result.systemRoles = await this.roleTemplateService.createSystemRolesForTenant(
        tenantId,
        skipExisting,
      );
      this.logger.debug(
        `Created ${result.systemRoles.totalRoles} system roles for tenant ${tenantId}`
      );
    } catch (error) {
      this.logger.error(`Failed to create system roles for tenant ${tenantId}:`, error);
      result.warnings.push(`Failed to create system roles: ${error.message}`);
    }

    // Create custom roles from configuration with error handling
    try {
      const customRoleTemplates = this.getCustomRoleTemplatesFromConfig();
      result.customRoles = await this.createCustomRolesForTenant(tenantId, customRoleTemplates);
      this.logger.debug(
        `Created ${result.customRoles.totalRoles} custom roles for tenant ${tenantId}`
      );
    } catch (error) {
      this.logger.error(`Failed to create custom roles for tenant ${tenantId}:`, error);
      result.warnings.push(`Failed to create custom roles: ${error.message}`);
    }

    this.logger.log(
      `Role initialization completed for tenant ${tenantId}: ` +
      `${result.systemRoles.totalRoles} system roles, ${result.customRoles.totalRoles} custom roles`
    );

    return result;
  }

  /**
   * Update tenant status
   * @param tenantId - The tenant ID
   * @param isActive - Whether the tenant should be active
   * @returns Promise<RBACTenant> - The updated tenant
   */
  async updateTenantStatus(tenantId: string, isActive: boolean): Promise<RBACTenant> {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new BadRequestException(`Tenant with ID ${tenantId} not found`);
    }

    tenant.is_active = isActive;
    return await this.tenantRepository.save(tenant);
  }

  /**
   * Delete a tenant and all associated data with comprehensive cascade deletion
   * @param tenantId - The tenant ID
   * @param actorId - The ID of the user performing the deletion (for audit logging)
   * @returns Promise<TenantDeletionResult> - Result of the deletion operation
   */
  async deleteTenant(tenantId: string, actorId?: string): Promise<TenantDeletionResult> {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new BadRequestException(`Tenant with ID ${tenantId} not found`);
    }

    this.logger.debug(`Starting cascade deletion for tenant ${tenantId}`);

    const deletionResult: TenantDeletionResult = {
      tenantId,
      tenantName: tenant.name,
      deletedAt: new Date(),
      cascadeResults: {
        userRoles: 0,
        rolePermissions: 0,
        roles: 0,
        auditLogs: 0,
      },
      warnings: [],
    };

    try {
      // Step 1: Get counts before deletion for reporting
      const counts = await this.getTenantDataCounts(tenantId);
      
      // Step 2: Validate deletion is safe (no active users, etc.)
      await this.validateTenantDeletion(tenantId, deletionResult);

      // Step 3: Perform cascade deletion in correct order
      await this.performCascadeDeletion(tenantId, deletionResult);

      // Step 4: Delete the tenant itself
      await this.tenantRepository.remove(tenant);

      // Step 5: Log the successful deletion
      if (actorId) {
        await this.logTenantDeletion(tenantId, actorId, deletionResult);
      }

      this.logger.log(
        `Successfully deleted tenant ${tenantId} (${tenant.name}) and all associated data: ` +
        `${deletionResult.cascadeResults.userRoles} user roles, ` +
        `${deletionResult.cascadeResults.rolePermissions} role permissions, ` +
        `${deletionResult.cascadeResults.roles} roles, ` +
        `${deletionResult.cascadeResults.auditLogs} audit logs`
      );

      return deletionResult;
    } catch (error) {
      this.logger.error(`Failed to delete tenant ${tenantId}:`, error);
      
      // Add error to warnings for partial failures
      deletionResult.warnings.push(`Deletion failed: ${error.message}`);
      
      // Re-throw for proper error handling
      throw error;
    }
  }

  /**
   * Delete a tenant and all associated data (legacy method for backward compatibility)
   * @param tenantId - The tenant ID
   * @returns Promise<void>
   * @deprecated Use deleteTenant(tenantId, actorId) instead
   */
  async deleteTenantLegacy(tenantId: string): Promise<void> {
    await this.deleteTenant(tenantId);
  }

  /**
   * Validate tenant creation options
   * @param options - Tenant creation options
   */
  private validateTenantOptions(options: TenantCreationOptions): void {
    if (!options.name || options.name.trim().length === 0) {
      throw new BadRequestException('Tenant name is required');
    }

    if (!options.subdomain || options.subdomain.trim().length === 0) {
      throw new BadRequestException('Tenant subdomain is required');
    }

    // Validate subdomain format (alphanumeric and hyphens only)
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(options.subdomain)) {
      throw new BadRequestException(
        'Subdomain must contain only lowercase letters, numbers, and hyphens'
      );
    }

    // Validate name length
    if (options.name.length > 100) {
      throw new BadRequestException('Tenant name must be 100 characters or less');
    }

    // Validate subdomain length
    if (options.subdomain.length > 50) {
      throw new BadRequestException('Tenant subdomain must be 50 characters or less');
    }
  }

  /**
   * Check if tenant name and subdomain are unique
   * @param name - Tenant name
   * @param subdomain - Tenant subdomain
   */
  private async checkTenantUniqueness(name: string, subdomain: string): Promise<void> {
    const existingByName = await this.tenantRepository.findOne({
      where: { name },
    });

    if (existingByName) {
      throw new ConflictException(`Tenant with name '${name}' already exists`);
    }

    const existingBySubdomain = await this.tenantRepository.findOne({
      where: { subdomain },
    });

    if (existingBySubdomain) {
      throw new ConflictException(`Tenant with subdomain '${subdomain}' already exists`);
    }
  }

  /**
   * Get custom role templates from configuration
   * @returns Array of custom role templates
   */
  private getCustomRoleTemplatesFromConfig(): Array<{
    name: string;
    description: string;
    permissions: Array<{ entityType: string; actions: string[] }>;
  }> {
    try {
      // First try to get from the main config
      const customTemplates = this.configService.get('rbac.customRoleTemplates', []);
      
      if (!Array.isArray(customTemplates)) {
        this.logger.warn('Custom role templates configuration is not an array, trying environment variable');
        
        // Fallback to environment variable
        const envTemplates = this.configService.get('RBAC_CUSTOM_ROLE_TEMPLATES');
        if (envTemplates) {
          try {
            const parsed = JSON.parse(envTemplates);
            if (Array.isArray(parsed)) {
              return this.validateCustomTemplates(parsed);
            }
          } catch (parseError) {
            this.logger.warn('Failed to parse RBAC_CUSTOM_ROLE_TEMPLATES from environment:', parseError);
          }
        }
        
        return [];
      }

      return this.validateCustomTemplates(customTemplates);
    } catch (error) {
      this.logger.warn('Failed to load custom role templates from configuration:', error);
      return [];
    }
  }

  /**
   * Validate custom role templates
   * @param templates - Array of templates to validate
   * @returns Array of valid templates
   */
  private validateCustomTemplates(templates: any[]): Array<{
    name: string;
    description: string;
    permissions: Array<{ entityType: string; actions: string[] }>;
  }> {
    const validTemplates = templates.filter((template) => {
      if (!template.name || !template.description || !Array.isArray(template.permissions)) {
        this.logger.warn(`Invalid custom role template structure, skipping: ${JSON.stringify(template)}`);
        return false;
      }

      // Validate permissions structure
      const validPermissions = template.permissions.every((perm: any) => {
        return perm.entityType && Array.isArray(perm.actions);
      });

      if (!validPermissions) {
        this.logger.warn(`Invalid permissions structure in template: ${template.name}`);
        return false;
      }

      return true;
    });

    this.logger.debug(`Validated ${validTemplates.length} custom role templates from configuration`);
    return validTemplates;
  }

  /**
   * Create custom roles for a tenant
   * @param tenantId - The tenant ID
   * @param customRoleTemplates - Array of custom role templates
   * @returns Promise<BulkRoleCreationResult> - Result of custom role creation
   */
  private async createCustomRolesForTenant(
    tenantId: string,
    customRoleTemplates: Array<{
      name: string;
      description: string;
      permissions: Array<{ entityType: string; actions: string[] }>;
    }>,
  ): Promise<BulkRoleCreationResult> {
    const result: BulkRoleCreationResult = {
      roles: [],
      totalRoles: 0,
      totalPermissions: 0,
      errors: [],
    };

    for (const template of customRoleTemplates) {
      try {
        const roleResult = await this.roleTemplateService.createRoleFromCustomTemplate(
          template.name,
          template.description,
          template.permissions,
          tenantId,
          false, // Not a system role
        );

        result.roles.push(roleResult);
        result.totalRoles++;
        result.totalPermissions += roleResult.permissionsAssigned;
      } catch (error) {
        this.logger.error(`Failed to create custom role ${template.name} for tenant ${tenantId}:`, error);
        result.errors.push(`Failed to create role ${template.name}: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Get counts of all data associated with a tenant
   * @param tenantId - The tenant ID
   * @returns Promise<TenantDataCounts> - Counts of associated data
   */
  private async getTenantDataCounts(tenantId: string): Promise<TenantDataCounts> {
    const [userRoles, rolePermissions, roles, auditLogs] = await Promise.all([
      this.userRoleRepository.count({ where: { tenant_id: tenantId } }),
      this.rolePermissionRepository
        .createQueryBuilder('rp')
        .innerJoin('rp.role', 'r')
        .where('r.tenant_id = :tenantId', { tenantId })
        .getCount(),
      this.roleRepository.count({ where: { tenant_id: tenantId } }),
      this.auditLogRepository.count({ where: { tenantId } }),
    ]);

    // Get count of unique active users in this tenant
    const activeUsersResult = await this.userRoleRepository
      .createQueryBuilder('ur')
      .select('COUNT(DISTINCT ur.user_id)', 'count')
      .where('ur.tenant_id = :tenantId', { tenantId })
      .getRawOne();

    const activeUsers = parseInt(activeUsersResult?.count || '0', 10);

    return {
      userRoles,
      rolePermissions,
      roles,
      auditLogs,
      activeUsers,
    };
  }

  /**
   * Validate that tenant deletion is safe to perform
   * @param tenantId - The tenant ID
   * @param deletionResult - The deletion result object to add warnings to
   */
  private async validateTenantDeletion(
    tenantId: string,
    deletionResult: TenantDeletionResult,
  ): Promise<void> {
    // Check for active users
    const counts = await this.getTenantDataCounts(tenantId);
    
    if (counts.activeUsers > 0) {
      deletionResult.warnings.push(
        `Tenant has ${counts.activeUsers} active users. All user assignments will be removed.`
      );
    }

    if (counts.roles > 0) {
      deletionResult.warnings.push(
        `Tenant has ${counts.roles} roles that will be deleted.`
      );
    }

    if (counts.auditLogs > 0) {
      deletionResult.warnings.push(
        `Tenant has ${counts.auditLogs} audit log entries that will be deleted.`
      );
    }

    // Additional validation could be added here, such as:
    // - Check for pending operations
    // - Check for external references
    // - Check for backup requirements
  }

  /**
   * Perform cascade deletion of all tenant-related data
   * @param tenantId - The tenant ID
   * @param deletionResult - The deletion result object to update
   */
  private async performCascadeDeletion(
    tenantId: string,
    deletionResult: TenantDeletionResult,
  ): Promise<void> {
    this.logger.debug(`Performing cascade deletion for tenant ${tenantId}`);

    try {
      // Step 1: Delete user role assignments
      const userRoleDeleteResult = await this.userRoleRepository.delete({ tenant_id: tenantId });
      deletionResult.cascadeResults.userRoles = userRoleDeleteResult.affected || 0;
      this.logger.debug(`Deleted ${deletionResult.cascadeResults.userRoles} user role assignments`);

      // Step 2: Delete role permission assignments
      // We need to find role permissions through roles that belong to this tenant
      const rolePermissionDeleteResult = await this.rolePermissionRepository
        .createQueryBuilder()
        .delete()
        .where('role_id IN (SELECT id FROM rbac_roles WHERE tenant_id = :tenantId)', { tenantId })
        .execute();
      deletionResult.cascadeResults.rolePermissions = rolePermissionDeleteResult.affected || 0;
      this.logger.debug(`Deleted ${deletionResult.cascadeResults.rolePermissions} role permission assignments`);

      // Step 3: Delete roles
      const roleDeleteResult = await this.roleRepository.delete({ tenant_id: tenantId });
      deletionResult.cascadeResults.roles = roleDeleteResult.affected || 0;
      this.logger.debug(`Deleted ${deletionResult.cascadeResults.roles} roles`);

      // Step 4: Delete audit logs (optional - some organizations may want to keep these)
      // This is configurable via environment variable
      const deleteAuditLogs = this.configService.get('RBAC_DELETE_AUDIT_LOGS_ON_TENANT_DELETION', 'true') === 'true';
      
      if (deleteAuditLogs) {
        const auditLogDeleteResult = await this.auditLogRepository.delete({ tenantId });
        deletionResult.cascadeResults.auditLogs = auditLogDeleteResult.affected || 0;
        this.logger.debug(`Deleted ${deletionResult.cascadeResults.auditLogs} audit log entries`);
      } else {
        this.logger.debug('Audit logs preserved as per configuration');
        deletionResult.warnings.push('Audit logs were preserved as per system configuration');
      }

    } catch (error) {
      this.logger.error(`Error during cascade deletion for tenant ${tenantId}:`, error);
      throw new BadRequestException(`Failed to perform cascade deletion: ${error.message}`);
    }
  }

  /**
   * Log the tenant deletion event
   * @param tenantId - The tenant ID
   * @param actorId - The ID of the user performing the deletion
   * @param deletionResult - The deletion result
   */
  private async logTenantDeletion(
    tenantId: string,
    actorId: string,
    deletionResult: TenantDeletionResult,
  ): Promise<void> {
    try {
      await this.auditLogService.logTenantManagement(
        AuditAction.TENANT_DELETED,
        actorId,
        tenantId,
        `Tenant '${deletionResult.tenantName}' deleted with cascade cleanup: ` +
        `${deletionResult.cascadeResults.userRoles} user roles, ` +
        `${deletionResult.cascadeResults.rolePermissions} role permissions, ` +
        `${deletionResult.cascadeResults.roles} roles, ` +
        `${deletionResult.cascadeResults.auditLogs} audit logs`,
        {
          cascadeResults: deletionResult.cascadeResults,
          warnings: deletionResult.warnings,
          deletedAt: deletionResult.deletedAt,
        }
      );
    } catch (error) {
      this.logger.warn(`Failed to log tenant deletion audit entry: ${error.message}`);
      // Don't fail the deletion if audit logging fails
    }
  }

  /**
   * Validate orphaned references after tenant operations
   * @param tenantId - The tenant ID to check
   * @returns Promise<string[]> - Array of orphaned reference warnings
   */
  async validateOrphanedReferences(tenantId: string): Promise<string[]> {
    const warnings: string[] = [];

    try {
      // Check for orphaned user roles (user roles without valid tenant)
      const orphanedUserRoles = await this.userRoleRepository
        .createQueryBuilder('ur')
        .leftJoin('ur.tenant', 't')
        .where('ur.tenant_id = :tenantId', { tenantId })
        .andWhere('t.id IS NULL')
        .getCount();

      if (orphanedUserRoles > 0) {
        warnings.push(`Found ${orphanedUserRoles} orphaned user role assignments`);
      }

      // Check for orphaned role permissions (role permissions without valid role)
      const orphanedRolePermissions = await this.rolePermissionRepository
        .createQueryBuilder('rp')
        .leftJoin('rp.role', 'r')
        .where('r.tenant_id = :tenantId', { tenantId })
        .andWhere('r.id IS NULL')
        .getCount();

      if (orphanedRolePermissions > 0) {
        warnings.push(`Found ${orphanedRolePermissions} orphaned role permission assignments`);
      }

      // Check for roles without tenant
      const orphanedRoles = await this.roleRepository
        .createQueryBuilder('r')
        .leftJoin('r.tenant', 't')
        .where('r.tenant_id = :tenantId', { tenantId })
        .andWhere('t.id IS NULL')
        .getCount();

      if (orphanedRoles > 0) {
        warnings.push(`Found ${orphanedRoles} orphaned roles`);
      }

    } catch (error) {
      this.logger.error(`Error validating orphaned references for tenant ${tenantId}:`, error);
      warnings.push(`Failed to validate orphaned references: ${error.message}`);
    }

    return warnings;
  }
}