import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../../entities/rbac/role.entity';
import { Permission } from '../../../entities/rbac/permission.entity';
import { RolePermission } from '../../../entities/rbac/role-permission.entity';
import { EntityRegistry } from '../../../entities/entity-registry/entity-registry.entity';
import { 
  RoleTemplate, 
  SYSTEM_ROLE_TEMPLATES, 
  getSystemRoleTemplates,
  getRoleTemplateByName,
  validateRoleTemplate,
  expandWildcardPermissions,
  createCustomRoleTemplate,
  validateAction
} from '../templates/role-templates';
import { PermissionService } from './permission.service';

export interface RoleCreationResult {
  role: Role | null;
  permissionsCreated: number;
  permissionsAssigned: number;
  warnings: string[];
}

export interface BulkRoleCreationResult {
  roles: RoleCreationResult[];
  totalRoles: number;
  totalPermissions: number;
  errors: string[];
}

@Injectable()
export class RoleTemplateService {
  private readonly logger = new Logger(RoleTemplateService.name);

  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(EntityRegistry)
    private entityRegistryRepository: Repository<EntityRegistry>,
    private permissionService: PermissionService,
  ) {}

  /**
   * Create a role from a template
   * @param template - The role template to use
   * @param tenantId - The tenant ID where the role will be created
   * @param skipExisting - Whether to skip creation if role already exists (default: true)
   * @returns Promise<RoleCreationResult> - Result of role creation
   */
  async createRoleFromTemplate(
    template: RoleTemplate,
    tenantId: string,
    skipExisting: boolean = true,
  ): Promise<RoleCreationResult> {
    this.logger.debug(`Creating role from template: ${template.name} for tenant ${tenantId}`);

    // Validate template structure
    if (!validateRoleTemplate(template)) {
      throw new BadRequestException(`Invalid role template structure for ${template.name}`);
    }

    const result: RoleCreationResult = {
      role: null,
      permissionsCreated: 0,
      permissionsAssigned: 0,
      warnings: [],
    };

    // Check if role already exists
    const existingRole = await this.roleRepository.findOne({
      where: { name: template.name, tenant_id: tenantId },
    });

    if (existingRole) {
      if (skipExisting) {
        this.logger.debug(`Role ${template.name} already exists in tenant ${tenantId}, skipping`);
        result.role = existingRole;
        result.warnings.push(`Role ${template.name} already exists`);
        return result;
      } else {
        throw new ConflictException(`Role ${template.name} already exists in tenant ${tenantId}`);
      }
    }

    // Create the role
    const role = this.roleRepository.create({
      name: template.name,
      description: template.description,
      tenant_id: tenantId,
      is_system_role: template.isSystemRole || false,
    });

    result.role = await this.roleRepository.save(role);
    this.logger.debug(`Created role ${template.name} with ID ${result.role.id}`);

    // Get available entity types for wildcard expansion
    const availableEntityTypes = await this.getAvailableEntityTypes();

    // Expand wildcards in template permissions
    const expandedTemplate = expandWildcardPermissions(template, availableEntityTypes);

    // Create and assign permissions
    for (const permissionSpec of expandedTemplate.permissions) {
      try {
        const permissionResults = await this.createAndAssignPermissions(
          result.role.id,
          permissionSpec.entityType,
          permissionSpec.actions,
        );

        result.permissionsCreated += permissionResults.created;
        result.permissionsAssigned += permissionResults.assigned;
        result.warnings.push(...permissionResults.warnings);
      } catch (error) {
        this.logger.warn(`Failed to create permissions for ${permissionSpec.entityType}:`, error);
        result.warnings.push(`Failed to create permissions for ${permissionSpec.entityType}: ${error.message}`);
      }
    }

    this.logger.debug(
      `Role template creation completed for ${template.name}: ` +
      `${result.permissionsCreated} permissions created, ` +
      `${result.permissionsAssigned} permissions assigned`
    );

    return result;
  }

  /**
   * Create all system roles for a tenant
   * @param tenantId - The tenant ID
   * @param skipExisting - Whether to skip roles that already exist (default: true)
   * @returns Promise<BulkRoleCreationResult> - Result of bulk role creation
   */
  async createSystemRolesForTenant(
    tenantId: string,
    skipExisting: boolean = true,
  ): Promise<BulkRoleCreationResult> {
    this.logger.debug(`Creating system roles for tenant ${tenantId}`);

    const result: BulkRoleCreationResult = {
      roles: [],
      totalRoles: 0,
      totalPermissions: 0,
      errors: [],
    };

    const systemTemplates = getSystemRoleTemplates();

    for (const template of systemTemplates) {
      try {
        const roleResult = await this.createRoleFromTemplate(template, tenantId, skipExisting);
        result.roles.push(roleResult);
        result.totalRoles++;
        result.totalPermissions += roleResult.permissionsAssigned;
      } catch (error) {
        this.logger.error(`Failed to create system role ${template.name} for tenant ${tenantId}:`, error);
        result.errors.push(`Failed to create role ${template.name}: ${error.message}`);
      }
    }

    this.logger.debug(
      `System role creation completed for tenant ${tenantId}: ` +
      `${result.totalRoles} roles created, ${result.totalPermissions} permissions assigned`
    );

    return result;
  }

  /**
   * Create a role from a system template by name
   * @param templateName - The name of the system template
   * @param tenantId - The tenant ID
   * @param skipExisting - Whether to skip if role already exists (default: true)
   * @returns Promise<RoleCreationResult> - Result of role creation
   */
  async createRoleFromSystemTemplate(
    templateName: string,
    tenantId: string,
    skipExisting: boolean = true,
  ): Promise<RoleCreationResult> {
    const template = getRoleTemplateByName(templateName);

    if (!template) {
      throw new BadRequestException(`System role template '${templateName}' not found`);
    }

    return this.createRoleFromTemplate(template, tenantId, skipExisting);
  }

  /**
   * Create a role from a custom template
   * @param name - The name of the role
   * @param description - The description of the role
   * @param permissions - Array of permissions for the role
   * @param tenantId - The tenant ID
   * @param isSystemRole - Whether this is a system role (default: false)
   * @returns Promise<RoleCreationResult> - Result of role creation
   */
  async createRoleFromCustomTemplate(
    name: string,
    description: string,
    permissions: Array<{ entityType: string; actions: string[] }>,
    tenantId: string,
    isSystemRole: boolean = false,
  ): Promise<RoleCreationResult> {
    const template = createCustomRoleTemplate(name, description, permissions, isSystemRole);
    return this.createRoleFromTemplate(template, tenantId, false);
  }

  /**
   * Get all available system role templates
   * @returns RoleTemplate[] - Array of system role templates
   */
  getSystemRoleTemplates(): RoleTemplate[] {
    return getSystemRoleTemplates();
  }

  /**
   * Get a system role template by name
   * @param name - The name of the template
   * @returns RoleTemplate | undefined - The template if found
   */
  getSystemRoleTemplate(name: string): RoleTemplate | undefined {
    return getRoleTemplateByName(name);
  }

  /**
   * Update an existing role to match a template
   * This will add missing permissions but won't remove existing ones
   * @param roleId - The role ID to update
   * @param template - The template to apply
   * @returns Promise<RoleCreationResult> - Result of role update
   */
  async updateRoleToMatchTemplate(
    roleId: string,
    template: RoleTemplate,
  ): Promise<RoleCreationResult> {
    this.logger.debug(`Updating role ${roleId} to match template ${template.name}`);

    // Validate template
    if (!validateRoleTemplate(template)) {
      throw new BadRequestException(`Invalid role template structure for ${template.name}`);
    }

    // Get the role
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new BadRequestException(`Role with ID ${roleId} not found`);
    }

    const result: RoleCreationResult = {
      role,
      permissionsCreated: 0,
      permissionsAssigned: 0,
      warnings: [],
    };

    // Update role metadata if needed
    let roleUpdated = false;
    if (role.description !== template.description) {
      role.description = template.description;
      roleUpdated = true;
    }

    if (roleUpdated) {
      await this.roleRepository.save(role);
      this.logger.debug(`Updated role metadata for ${template.name}`);
    }

    // Get available entity types for wildcard expansion
    const availableEntityTypes = await this.getAvailableEntityTypes();

    // Expand wildcards in template permissions
    const expandedTemplate = expandWildcardPermissions(template, availableEntityTypes);

    // Get existing role permissions
    const existingPermissions = await this.getRolePermissions(roleId);
    const existingPermissionKeys = new Set(
      existingPermissions.map(p => `${p.entity_type}:${p.action}`)
    );

    // Add missing permissions
    for (const permissionSpec of expandedTemplate.permissions) {
      try {
        const permissionResults = await this.createAndAssignPermissions(
          roleId,
          permissionSpec.entityType,
          permissionSpec.actions,
          existingPermissionKeys,
        );

        result.permissionsCreated += permissionResults.created;
        result.permissionsAssigned += permissionResults.assigned;
        result.warnings.push(...permissionResults.warnings);
      } catch (error) {
        this.logger.warn(`Failed to update permissions for ${permissionSpec.entityType}:`, error);
        result.warnings.push(`Failed to update permissions for ${permissionSpec.entityType}: ${error.message}`);
      }
    }

    this.logger.debug(
      `Role template update completed for ${template.name}: ` +
      `${result.permissionsCreated} permissions created, ` +
      `${result.permissionsAssigned} permissions assigned`
    );

    return result;
  }

  /**
   * Validate that a role matches a template
   * @param roleId - The role ID to validate
   * @param template - The template to validate against
   * @returns Promise<{ matches: boolean; missingPermissions: string[]; extraPermissions: string[] }>
   */
  async validateRoleAgainstTemplate(
    roleId: string,
    template: RoleTemplate,
  ): Promise<{ matches: boolean; missingPermissions: string[]; extraPermissions: string[] }> {
    // Get role permissions
    const rolePermissions = await this.getRolePermissions(roleId);
    const rolePermissionKeys = new Set(
      rolePermissions.map(p => `${p.entity_type}:${p.action}`)
    );

    // Get template permissions (expanded)
    const availableEntityTypes = await this.getAvailableEntityTypes();
    const expandedTemplate = expandWildcardPermissions(template, availableEntityTypes);
    
    const templatePermissionKeys = new Set<string>();
    for (const permissionSpec of expandedTemplate.permissions) {
      for (const action of permissionSpec.actions) {
        templatePermissionKeys.add(`${permissionSpec.entityType}:${action}`);
      }
    }

    // Find missing and extra permissions
    const missingPermissions = Array.from(templatePermissionKeys).filter(
      key => !rolePermissionKeys.has(key)
    );
    const extraPermissions = Array.from(rolePermissionKeys).filter(
      key => !templatePermissionKeys.has(key)
    );

    return {
      matches: missingPermissions.length === 0 && extraPermissions.length === 0,
      missingPermissions,
      extraPermissions,
    };
  }

  /**
   * Create and assign permissions for a role
   * @param roleId - The role ID
   * @param entityType - The entity type
   * @param actions - Array of actions
   * @param existingPermissions - Set of existing permission keys to avoid duplicates
   * @returns Promise<{ created: number; assigned: number; warnings: string[] }>
   */
  private async createAndAssignPermissions(
    roleId: string,
    entityType: string,
    actions: string[],
    existingPermissions?: Set<string>,
  ): Promise<{ created: number; assigned: number; warnings: string[] }> {
    const result: { created: number; assigned: number; warnings: string[] } = { 
      created: 0, 
      assigned: 0, 
      warnings: [] 
    };

    // Validate entity type exists in registry
    const isValidEntity = await this.permissionService.validateEntityType(entityType);
    if (!isValidEntity) {
      result.warnings.push(`Entity type ${entityType} not found in Entity Registry`);
      return result;
    }

    for (const action of actions) {
      // Validate action
      if (!validateAction(action)) {
        result.warnings.push(`Invalid action: ${action}`);
        continue;
      }

      const permissionKey = `${entityType}:${action}`;

      // Skip if permission already exists on role
      if (existingPermissions && existingPermissions.has(permissionKey)) {
        continue;
      }

      try {
        // Find or create permission
        let permission = await this.permissionService.findPermission(entityType, action);
        
        if (!permission) {
          permission = await this.permissionService.createPermission(
            entityType,
            action,
            `${action} permission for ${entityType}`,
          );
          result.created++;
          this.logger.debug(`Created permission ${entityType}:${action}`);
        }

        // Check if role already has this permission
        const existingRolePermission = await this.rolePermissionRepository.findOne({
          where: { role_id: roleId, permission_id: permission.id },
        });

        if (!existingRolePermission) {
          // Assign permission to role
          const rolePermission = this.rolePermissionRepository.create({
            role_id: roleId,
            permission_id: permission.id,
          });

          await this.rolePermissionRepository.save(rolePermission);
          result.assigned++;
          this.logger.debug(`Assigned permission ${entityType}:${action} to role ${roleId}`);
        }
      } catch (error) {
        this.logger.warn(`Failed to create/assign permission ${entityType}:${action}:`, error);
        result.warnings.push(`Failed to create/assign permission ${entityType}:${action}: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Get all permissions for a role
   * @param roleId - The role ID
   * @returns Promise<Permission[]> - Array of permissions
   */
  private async getRolePermissions(roleId: string): Promise<Permission[]> {
    return await this.permissionRepository
      .createQueryBuilder('p')
      .innerJoin('p.role_permissions', 'rp')
      .where('rp.role_id = :roleId', { roleId })
      .getMany();
  }

  /**
   * Get available entity types from Entity Registry
   * @returns Promise<string[]> - Array of entity type codes
   */
  private async getAvailableEntityTypes(): Promise<string[]> {
    const entities = await this.entityRegistryRepository.find({
      select: ['code'],
    });

    return entities.map(entity => entity.code);
  }
}