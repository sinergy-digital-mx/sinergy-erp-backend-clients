import { Injectable, BadRequestException, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../../entities/rbac/role.entity';
import { UserRole } from '../../../entities/rbac/user-role.entity';
import { RolePermission } from '../../../entities/rbac/role-permission.entity';
import { Permission } from '../../../entities/rbac/permission.entity';
import { RBACTenant } from '../../../entities/rbac/tenant.entity';
import { TenantModule } from '../../../entities/rbac/tenant-module.entity';
import { TenantContextService } from './tenant-context.service';
import { PermissionCacheService } from './permission-cache.service';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(RBACTenant)
    private tenantRepository: Repository<RBACTenant>,
    @InjectRepository(TenantModule)
    private tenantModuleRepository: Repository<TenantModule>,
    private tenantContextService: TenantContextService,
    private permissionCacheService: PermissionCacheService,
  ) {}

  /**
   * Create a new role within a tenant
   * @param tenantId - The tenant ID where the role will be created
   * @param name - The name of the role
   * @param description - Optional description of the role
   * @returns Promise<Role> - The created role
   */
  async createRole(
    tenantId: string,
    name: string,
    description?: string,
  ): Promise<Role> {
    // Validate tenant context
    this.validateTenantContext(tenantId);

    // Validate tenant exists
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    // Check if role with same name already exists in this tenant
    const existingRole = await this.roleRepository.findOne({
      where: { name, tenant_id: tenantId },
    });

    if (existingRole) {
      throw new ConflictException(
        `Role with name '${name}' already exists in this tenant`,
      );
    }

    const role = this.roleRepository.create({
      name,
      description,
      tenant_id: tenantId,
      is_system_role: false,
    });

    return await this.roleRepository.save(role);
  }

  /**
   * Create a role in the current tenant context
   * @param name - The name of the role
   * @param description - Optional description of the role
   * @returns Promise<Role> - The created role
   */
  async createRoleInCurrentContext(
    name: string,
    description?: string,
  ): Promise<Role> {
    const tenantId = this.tenantContextService.getCurrentTenantId();

    if (!tenantId) {
      throw new UnauthorizedException('Tenant context is required');
    }

    return this.createRole(tenantId, name, description);
  }

  /**
   * Assign a role to a user within a specific tenant
   * @param userId - The user ID
   * @param roleId - The role ID
   * @param tenantId - The tenant ID
   * @returns Promise<UserRole> - The created user-role assignment
   */
  async assignRoleToUser(
    userId: string,
    roleId: string,
    tenantId: string,
  ): Promise<UserRole> {
    // Validate tenant context and cross-tenant access
    this.validateTenantContext(tenantId);
    await this.validateCrossTenantRoleAssignment(userId, roleId, tenantId);

    // Validate role exists and belongs to the tenant
    const role = await this.roleRepository.findOne({
      where: { id: roleId, tenant_id: tenantId },
    });

    if (!role) {
      throw new NotFoundException(
        `Role with ID ${roleId} not found in tenant ${tenantId}`,
      );
    }

    // Check if user already has this role in this tenant
    const existingUserRole = await this.userRoleRepository.findOne({
      where: { user_id: userId, role_id: roleId, tenant_id: tenantId },
    });

    if (existingUserRole) {
      throw new ConflictException(
        `User already has role '${role.name}' in this tenant`,
      );
    }

    const userRole = this.userRoleRepository.create({
      user_id: userId,
      role_id: roleId,
      tenant_id: tenantId,
    });

    const savedUserRole = await this.userRoleRepository.save(userRole);

    // Invalidate user's permission cache since their roles changed
    try {
      await this.permissionCacheService.invalidateUserPermissions(userId, tenantId);
    } catch (error) {
      // Log cache error but don't fail the operation
      console.warn(`Failed to invalidate cache for user ${userId}:`, error.message);
    }

    return savedUserRole;
  }

  /**
   * Assign a permission to a role
   * @param roleId - The role ID
   * @param permissionId - The permission ID
   * @returns Promise<RolePermission> - The created role-permission assignment
   */
  async assignPermissionToRole(
    roleId: string,
    permissionId: string,
    tenantId?: string,
  ): Promise<RolePermission> {
    // Validate role exists
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Validate permission exists
    const permission = await this.permissionRepository.findOne({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${permissionId} not found`);
    }

    // If tenantId provided, validate permission belongs to an enabled module for this tenant
    if (tenantId && permission.module_id) {
      const tenantModule = await this.permissionRepository.manager
        .getRepository('TenantModule')
        .findOne({
          where: {
            tenant_id: tenantId,
            module_id: permission.module_id,
            is_enabled: true,
          },
        });

      if (!tenantModule) {
        throw new BadRequestException(
          `Permission belongs to a module that is not enabled for this tenant`,
        );
      }
    }

    // Check if role already has this permission
    const existingRolePermission = await this.rolePermissionRepository.findOne({
      where: { role_id: roleId, permission_id: permissionId },
    });

    if (existingRolePermission) {
      throw new ConflictException(
        `Role already has permission '${permission.entity_type}:${permission.action}'`,
      );
    }

    const rolePermission = this.rolePermissionRepository.create({
      role_id: roleId,
      permission_id: permissionId,
    });

    const savedRolePermission = await this.rolePermissionRepository.save(rolePermission);

    // Invalidate cache for all users with this role
    const userIds = await this.getUsersWithRole(roleId, role.tenant_id);
    try {
      await this.permissionCacheService.invalidateRolePermissions(roleId, role.tenant_id, userIds);
    } catch (error) {
      // Log cache error but don't fail the operation
      console.warn(`Failed to invalidate role permissions cache for role ${roleId}:`, error.message);
    }

    return savedRolePermission;
  }

  /**
   * Replace all permissions for a role (remove old, add new) in a single operation
   * @param roleId - The role ID
   * @param permissionIds - Array of new permission IDs
   * @param tenantId - The tenant ID for validation
   * @returns Promise<void>
   */
  async replaceRolePermissions(
    roleId: string,
    permissionIds: string[],
    tenantId: string,
  ): Promise<void> {
    // Single query: Get role and check it exists
    const role = await this.roleRepository.findOne({
      where: { id: roleId, tenant_id: tenantId },
    });

    if (!role) {
      throw new NotFoundException(
        `Role with ID ${roleId} not found in tenant ${tenantId}`,
      );
    }

    // Single DELETE query: Remove all existing permissions
    await this.rolePermissionRepository
      .createQueryBuilder()
      .delete()
      .where('role_id = :roleId', { roleId })
      .execute();

    if (permissionIds.length === 0) {
      // Invalidate cache (async, don't wait)
      this.permissionCacheService
        .invalidateRolePermissions(roleId, tenantId, [])
        .catch(error => {
          console.warn(`Failed to invalidate role permissions cache for role ${roleId}:`, error.message);
        });
      return;
    }

    // Single INSERT query: Insert all new permissions at once
    await this.rolePermissionRepository
      .createQueryBuilder()
      .insert()
      .into(RolePermission)
      .values(
        permissionIds.map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId,
        })),
      )
      .execute();

    // Invalidate cache (async, don't wait)
    this.permissionCacheService
      .invalidateRolePermissions(roleId, tenantId, [])
      .catch(error => {
        console.warn(`Failed to invalidate role permissions cache for role ${roleId}:`, error.message);
      });
  }

  /**
   * Get all roles for a user in a specific tenant
   * @param userId - The user ID
   * @param tenantId - The tenant ID
   * @returns Promise<Role[]> - Array of roles the user has in the tenant
   */
  async getUserRoles(userId: string, tenantId: string): Promise<Role[]> {
    // Validate tenant context
    this.validateTenantContext(tenantId, userId);

    const roles = await this.roleRepository
      .createQueryBuilder('r')
      .innerJoin('r.user_roles', 'ur')
      .where('ur.user_id = :userId', { userId })
      .andWhere('ur.tenant_id = :tenantId', { tenantId })
      .getMany();

    return roles;
  }

  /**
   * Get roles for current user in current tenant context
   * @returns Promise<Role[]> - Array of roles
   */
  async getCurrentUserRoles(): Promise<Role[]> {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    const userId = this.tenantContextService.getCurrentUserId();

    if (!tenantId || !userId) {
      throw new UnauthorizedException('Tenant context is required');
    }

    return this.getUserRoles(userId, tenantId);
  }

  /**
   * Get all roles within a tenant
   * @param tenantId - The tenant ID
   * @returns Promise<Role[]> - Array of all roles in the tenant
   */
  async getTenantRoles(tenantId: string): Promise<Role[]> {
    return await this.roleRepository.find({
      where: { tenant_id: tenantId },
      order: { name: 'ASC' },
    });
  }

  /**
   * Get a role by ID with tenant validation
   * @param roleId - The role ID
   * @param tenantId - The tenant ID for validation
   * @returns Promise<Role> - The role if found and belongs to tenant
   */
  async getRoleById(roleId: string, tenantId: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId, tenant_id: tenantId },
    });

    if (!role) {
      throw new NotFoundException(
        `Role with ID ${roleId} not found in tenant ${tenantId}`,
      );
    }

    return role;
  }

  /**
   * Get all permissions for a specific role
   * @param roleId - The role ID
   * @returns Promise<Permission[]> - Array of permissions assigned to the role
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const permissions = await this.permissionRepository
      .createQueryBuilder('p')
      .innerJoin('p.role_permissions', 'rp')
      .where('rp.role_id = :roleId', { roleId })
      .getMany();

    return permissions;
  }

  /**
   * Remove a role assignment from a user
   * @param userId - The user ID
   * @param roleId - The role ID
   * @param tenantId - The tenant ID
   * @returns Promise<void>
   */
  async removeRoleFromUser(
    userId: string,
    roleId: string,
    tenantId: string,
  ): Promise<void> {
    const userRole = await this.userRoleRepository.findOne({
      where: { user_id: userId, role_id: roleId, tenant_id: tenantId },
    });

    if (!userRole) {
      throw new NotFoundException(
        `User role assignment not found for user ${userId}, role ${roleId} in tenant ${tenantId}`,
      );
    }

    await this.userRoleRepository.remove(userRole);

    // Invalidate user's permission cache since their roles changed
    try {
      await this.permissionCacheService.invalidateUserPermissions(userId, tenantId);
    } catch (error) {
      // Log cache error but don't fail the operation
      console.warn(`Failed to invalidate cache for user ${userId}:`, error.message);
    }
  }

  /**
   * Remove a permission from a role
   * @param roleId - The role ID
   * @param permissionId - The permission ID
   * @returns Promise<void>
   */
  async removePermissionFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<void> {
    const rolePermission = await this.rolePermissionRepository.findOne({
      where: { role_id: roleId, permission_id: permissionId },
    });

    if (!rolePermission) {
      throw new NotFoundException(
        `Role permission assignment not found for role ${roleId}, permission ${permissionId}`,
      );
    }

    // Get role info for cache invalidation
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    await this.rolePermissionRepository.remove(rolePermission);

    // Invalidate cache for all users with this role
    if (role) {
      const userIds = await this.getUsersWithRole(roleId, role.tenant_id);
      try {
        await this.permissionCacheService.invalidateRolePermissions(roleId, role.tenant_id, userIds);
      } catch (error) {
        // Log cache error but don't fail the operation
        console.warn(`Failed to invalidate role permissions cache for role ${roleId}:`, error.message);
      }
    }
  }

  /**
   * Update a role's basic information
   * @param roleId - The role ID
   * @param tenantId - The tenant ID for validation
   * @param updates - Object containing fields to update
   * @returns Promise<Role> - The updated role
   */
  async updateRole(
    roleId: string,
    tenantId: string,
    updates: { name?: string; description?: string },
  ): Promise<Role> {
    const role = await this.getRoleById(roleId, tenantId);

    // Check if new name conflicts with existing role in tenant
    if (updates.name && updates.name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: updates.name, tenant_id: tenantId },
      });

      if (existingRole) {
        throw new ConflictException(
          `Role with name '${updates.name}' already exists in this tenant`,
        );
      }
    }

    Object.assign(role, updates);
    return await this.roleRepository.save(role);
  }

  /**
   * Delete a role and all its associations
   * @param roleId - The role ID
   * @param tenantId - The tenant ID for validation
   * @returns Promise<void>
   */
  async deleteRole(roleId: string, tenantId: string): Promise<void> {
    const role = await this.getRoleById(roleId, tenantId);

    // System roles cannot be deleted
    if (role.is_system_role) {
      throw new BadRequestException('System roles cannot be deleted');
    }

    // Get users with this role for cache invalidation
    const userIds = await this.getUsersWithRole(roleId, tenantId);

    // Remove all user role assignments
    await this.userRoleRepository.delete({ role_id: roleId });

    // Remove all role permission assignments
    await this.rolePermissionRepository.delete({ role_id: roleId });

    // Delete the role
    await this.roleRepository.remove(role);

    // Invalidate cache for all users who had this role
    try {
      await this.permissionCacheService.invalidateRolePermissions(roleId, tenantId, userIds);
    } catch (error) {
      // Log cache error but don't fail the operation
      console.warn(`Failed to invalidate role permissions cache for deleted role ${roleId}:`, error.message);
    }
  }

  /**
   * Create system roles for a tenant (Admin, Operator, Viewer)
   * @param tenantId - The tenant ID
   * @returns Promise<Role[]> - Array of created system roles
   * @deprecated Use RoleTemplateService.createSystemRolesForTenant instead
   */
  async createSystemRoles(tenantId: string): Promise<Role[]> {
    const systemRoles = [
      {
        name: 'Admin',
        description: 'Full access to all entities and actions',
        is_system_role: true,
      },
      {
        name: 'Operator',
        description: 'Read access to customers and leads, no user management',
        is_system_role: true,
      },
      {
        name: 'Viewer',
        description: 'Read-only access to basic entities',
        is_system_role: true,
      },
    ];

    const createdRoles: Role[] = [];

    for (const roleTemplate of systemRoles) {
      // Check if system role already exists
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleTemplate.name, tenant_id: tenantId },
      });

      if (!existingRole) {
        const role = this.roleRepository.create({
          ...roleTemplate,
          tenant_id: tenantId,
        });

        const savedRole = await this.roleRepository.save(role);
        createdRoles.push(savedRole);
      } else {
        createdRoles.push(existingRole);
      }
    }

    return createdRoles;
  }

  /**
   * Validate tenant context matches current request context
   * @param tenantId - The tenant ID to validate
   * @param userId - Optional user ID to validate
   * @throws UnauthorizedException if context doesn't match
   */
  private validateTenantContext(tenantId: string, userId?: string): void {
    const currentTenantId = this.tenantContextService.getCurrentTenantId();

    if (currentTenantId && currentTenantId !== tenantId) {
      throw new UnauthorizedException(
        'Cross-tenant access denied: Tenant context mismatch',
      );
    }

    // User ID validation removed - permission-based access control is enforced by PermissionGuard
    // This allows users with appropriate permissions (e.g., User:Read) to access other users' data
  }

  /**
   * Validate cross-tenant role assignment
   * @param userId - The user ID
   * @param roleId - The role ID
   * @param tenantId - The tenant ID
   * @throws UnauthorizedException if cross-tenant assignment is invalid
   */
  private async validateCrossTenantRoleAssignment(
    userId: string,
    roleId: string,
    tenantId: string,
  ): Promise<void> {
    // Ensure role belongs to the specified tenant
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (role && role.tenant_id !== tenantId) {
      throw new UnauthorizedException(
        `Cannot assign role from tenant ${role.tenant_id} to user in tenant ${tenantId}`,
      );
    }
  }

  /**
   * Get all users with a specific role in a tenant
   * @param roleId - The role ID
   * @param tenantId - The tenant ID
   * @returns Promise<string[]> - Array of user IDs
   */
  async getUsersWithRole(roleId: string, tenantId: string): Promise<string[]> {
    // Validate tenant context
    this.validateTenantContext(tenantId);

    const userRoles = await this.userRoleRepository.find({
      where: { role_id: roleId, tenant_id: tenantId },
      select: ['user_id'],
    });

    return userRoles?.map(ur => ur.user_id) || [];
  }

  /**
   * Check if a user has a specific role in a tenant
   * @param userId - The user ID
   * @param roleId - The role ID
   * @param tenantId - The tenant ID
   * @returns Promise<boolean> - True if user has the role
   */
  async userHasRole(
    userId: string,
    roleId: string,
    tenantId: string,
  ): Promise<boolean> {
    // Validate tenant context
    this.validateTenantContext(tenantId, userId);

    const userRole = await this.userRoleRepository.findOne({
      where: { user_id: userId, role_id: roleId, tenant_id: tenantId },
    });

    return !!userRole;
  }

  /**
   * Get enabled modules/entities for a tenant
   * @param tenantId - The tenant ID
   * @returns Promise<TenantModule[]> - Array of enabled modules for the tenant
   */
  async getEnabledModulesForTenant(tenantId: string): Promise<TenantModule[]> {
    return this.tenantModuleRepository.find({
      where: { 
        tenant_id: tenantId,
        is_enabled: true 
      },
      relations: ['module'],
    });
  }

  /**
   * Get all permissions in the system
   * @returns Promise<Permission[]> - Array of all permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    return await this.permissionRepository.find({
      relations: ['entity_registry'],
      order: { action: 'ASC' },
    });
  }
}
