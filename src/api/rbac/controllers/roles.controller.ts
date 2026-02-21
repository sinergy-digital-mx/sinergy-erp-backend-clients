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
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { RoleService } from '../services/role.service';
import { TenantContextService } from '../services/tenant-context.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { AssignPermissionsDto } from '../dto/assign-permissions.dto';

@ApiTags('Tenant - Roles')
@Controller('tenant/roles')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(
    private roleService: RoleService,
    private tenantContextService: TenantContextService,
  ) {}

  @Get('summary/counts')
  @RequirePermissions({ entityType: 'User', action: 'Read' })
  @ApiOperation({
    summary: 'Get roles summary with counts',
    description: 'Returns a summary of all roles with user and permission counts',
  })
  @ApiResponse({
    status: 200,
    description: 'Roles summary with counts',
    schema: {
      example: {
        summary: {
          total_roles: 11,
          roles_with_permissions: 2,
          roles_without_permissions: 9,
          total_permission_assignments: 58,
        },
        roles: [
          {
            id: 'uuid',
            name: 'Admin',
            permission_count: 56,
            user_count: 3,
            is_system_role: false,
          },
          {
            id: 'uuid',
            name: 'Sales Representative',
            permission_count: 2,
            user_count: 1,
            is_system_role: false,
          },
        ],
      },
    },
  })
  async getRolesSummary() {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    
    const roles = await this.roleService.getTenantRoles(tenantId);

    // Get counts for each role
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const userIds = await this.roleService.getUsersWithRole(role.id, tenantId);
        const permissions = await this.roleService.getRolePermissions(role.id);
        return {
          id: role.id,
          name: role.name,
          permission_count: permissions.length,
          user_count: userIds.length,
          is_system_role: role.is_system_role,
        };
      }),
    );

    // Sort by permission count descending
    rolesWithCounts.sort((a, b) => b.permission_count - a.permission_count);

    // Calculate summary statistics
    const totalRoles = rolesWithCounts.length;
    const rolesWithPermissions = rolesWithCounts.filter(r => r.permission_count > 0).length;
    const rolesWithoutPermissions = rolesWithCounts.filter(r => r.permission_count === 0).length;
    const totalPermissionAssignments = rolesWithCounts.reduce((sum, r) => sum + r.permission_count, 0);

    return {
      summary: {
        total_roles: totalRoles,
        roles_with_permissions: rolesWithPermissions,
        roles_without_permissions: rolesWithoutPermissions,
        total_permission_assignments: totalPermissionAssignments,
      },
      roles: rolesWithCounts,
    };
  }

  @Get('permissions/available')
  @RequirePermissions({ entityType: 'User', action: 'Read' })
  @ApiOperation({
    summary: 'Get available permissions for tenant grouped by module',
    description: 'Returns only permissions for modules enabled in the current tenant, grouped by module with their entities and actions',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available permissions grouped by module (only for enabled modules)',
    schema: {
      example: {
        modules: [
          {
            id: 'uuid',
            name: 'Users Module',
            code: 'users',
            permissions: [
              {
                id: 'uuid',
                entity: 'User',
                action: 'Create',
                description: 'Create users',
              },
              {
                id: 'uuid',
                entity: 'User',
                action: 'Read',
                description: 'Read user data',
              },
            ],
          },
          {
            id: 'uuid',
            name: 'Leads Module',
            code: 'leads',
            permissions: [
              {
                id: 'uuid',
                entity: 'Lead',
                action: 'Create',
                description: 'Create leads',
              },
              {
                id: 'uuid',
                entity: 'Lead',
                action: 'Read',
                description: 'Read leads',
              },
            ],
          },
        ],
      },
    },
  })
  async getAvailablePermissions() {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    // Get enabled modules for this tenant
    const enabledModules = await this.roleService.getEnabledModulesForTenant(tenantId);
    const enabledModuleIds = enabledModules.map(m => m.module_id);

    // Get all permissions
    const allPermissions = await this.roleService.getAllPermissions();

    // Filter permissions to only those from enabled modules
    const tenantPermissions = allPermissions.filter(permission => {
      // If permission has a module_id, check if it's enabled
      if (permission.module_id) {
        return enabledModuleIds.includes(permission.module_id);
      }
      // System permissions (no module_id) are always available
      return true;
    });

    // Group by module
    const groupedByModule = enabledModules.reduce((acc, tenantModule) => {
      const module = tenantModule.module;
      const modulePermissions = tenantPermissions.filter(p => p.module_id === module.id);
      
      if (modulePermissions.length > 0) {
        acc.push({
          id: module.id,
          name: module.name,
          code: module.code,
          permissions: modulePermissions
            .map(p => ({
              id: p.id,
              entity: p.entity_type,
              action: p.action,
              description: p.description,
            }))
            .sort((a, b) => {
              const entityCompare = a.entity.localeCompare(b.entity);
              return entityCompare !== 0 ? entityCompare : a.action.localeCompare(b.action);
            }),
        });
      }
      
      return acc;
    }, [] as any[]);

    // Sort modules by name
    groupedByModule.sort((a, b) => a.name.localeCompare(b.name));

    return {
      modules: groupedByModule,
    };
  }

  @Get()
  @RequirePermissions({ entityType: 'User', action: 'Read' })
  @ApiOperation({
    summary: 'Get all roles for current tenant',
    description: 'Returns all roles available in the current tenant with permission counts',
  })
  @ApiResponse({
    status: 200,
    description: 'List of roles with permission counts',
    schema: {
      example: {
        roles: [
          {
            id: 'uuid',
            name: 'Sales Manager',
            description: 'Manages sales team',
            is_system_role: false,
            user_count: 5,
            permission_count: 12,
            created_at: '2024-01-27T14:30:00Z',
          },
        ],
      },
    },
  })
  async getRoles() {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    const roles = await this.roleService.getTenantRoles(tenantId);

    // Get user count and permission count for each role
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const userIds = await this.roleService.getUsersWithRole(
          role.id,
          tenantId,
        );
        const permissions = await this.roleService.getRolePermissions(role.id);
        return {
          ...role,
          user_count: userIds.length,
          permission_count: permissions.length,
        };
      }),
    );

    return { roles: rolesWithCounts };
  }

  @Get(':roleId/permissions/available')
  @RequirePermissions({ entityType: 'User', action: 'Read' })
  @ApiOperation({
    summary: 'Get available permissions for a role with assignment status',
    description: 'Returns all permissions available for the tenant grouped by module, with indication of which ones are already assigned to the role',
  })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({
    status: 200,
    description: 'Available permissions with assignment status',
    schema: {
      example: {
        role: {
          id: 'uuid',
          name: 'Sales Manager',
        },
        modules: [
          {
            id: 'uuid',
            name: 'Leads',
            code: 'leads',
            permissions: [
              {
                id: 'uuid',
                entity: 'Lead',
                action: 'Create',
                description: 'Create leads',
                assigned: true,
              },
              {
                id: 'uuid',
                entity: 'Lead',
                action: 'Read',
                description: 'Read leads',
                assigned: false,
              },
            ],
          },
        ],
      },
    },
  })
  async getAvailablePermissionsForRole(@Param('roleId') roleId: string) {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    // Get the role
    const role = await this.roleService.getRoleById(roleId, tenantId);

    // Get enabled modules for this tenant
    const enabledModules = await this.roleService.getEnabledModulesForTenant(tenantId);
    const enabledModuleIds = enabledModules.map(m => m.module_id);

    // Get all permissions
    const allPermissions = await this.roleService.getAllPermissions();

    // Get permissions already assigned to this role
    const rolePermissions = await this.roleService.getRolePermissions(roleId);
    const assignedPermissionIds = new Set(rolePermissions.map(p => p.id));

    // Filter permissions to only those from enabled modules
    const tenantPermissions = allPermissions.filter(permission => {
      if (permission.module_id) {
        return enabledModuleIds.includes(permission.module_id);
      }
      return true;
    });

    // Group by module
    const groupedByModule = enabledModules.reduce((acc, tenantModule) => {
      const module = tenantModule.module;
      const modulePermissions = tenantPermissions.filter(p => p.module_id === module.id);
      
      if (modulePermissions.length > 0) {
        acc.push({
          id: module.id,
          name: module.name,
          code: module.code,
          permissions: modulePermissions
            .map(p => ({
              id: p.id,
              entity: p.entity_type,
              action: p.action,
              description: p.description,
              assigned: assignedPermissionIds.has(p.id),
            }))
            .sort((a, b) => {
              const entityCompare = a.entity.localeCompare(b.entity);
              return entityCompare !== 0 ? entityCompare : a.action.localeCompare(b.action);
            }),
        });
      }
      
      return acc;
    }, [] as any[]);

    // Sort modules by name
    groupedByModule.sort((a, b) => a.name.localeCompare(b.name));

    return {
      role: {
        id: role.id,
        name: role.name,
      },
      modules: groupedByModule,
    };
  }

  @Get(':roleId')
  @RequirePermissions({ entityType: 'User', action: 'Read' })
  @ApiOperation({
    summary: 'Get role details',
    description: 'Returns detailed information about a specific role with permission count',
  })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({
    status: 200,
    description: 'Role details with permissions and counts',
    schema: {
      example: {
        role: {
          id: 'uuid',
          name: 'Sales Manager',
          description: 'Manages sales team',
          is_system_role: false,
          user_count: 5,
          permission_count: 12,
          created_at: '2024-01-27T14:30:00Z',
        },
        permissions: [
          {
            id: 'uuid',
            module: 'Lead',
            action: 'Create',
            description: 'Create leads',
          },
        ],
      },
    },
  })
  async getRole(@Param('roleId') roleId: string) {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    const role = await this.roleService.getRoleById(roleId, tenantId);
    const permissions = await this.roleService.getRolePermissions(roleId);
    const userIds = await this.roleService.getUsersWithRole(roleId, tenantId);

    return {
      role: {
        ...role,
        user_count: userIds.length,
        permission_count: permissions.length,
      },
      permissions: permissions.map((p) => ({
        id: p.id,
        module: p.entity_type,
        action: p.action,
        description: p.description,
      })),
    };
  }

  @Post()
  @RequirePermissions({ entityType: 'User', action: 'Create' })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new role',
    description: 'Creates a new role in the current tenant',
  })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
  })
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    const role = await this.roleService.createRole(
      tenantId,
      createRoleDto.name,
      createRoleDto.description,
    );

    // Assign permissions if provided
    if (createRoleDto.permission_ids && createRoleDto.permission_ids.length > 0) {
      await this.roleService.replaceRolePermissions(
        role.id,
        createRoleDto.permission_ids,
        tenantId,
      );
    }

    const permissions = await this.roleService.getRolePermissions(role.id);

    return {
      role,
      permissions: permissions.map((p) => ({
        id: p.id,
        module: p.entity_type,
        action: p.action,
        description: p.description,
      })),
    };
  }

  @Put(':roleId')
  @RequirePermissions({ entityType: 'User', action: 'Update' })
  @ApiOperation({
    summary: 'Update a role',
    description: 'Updates role information and/or permissions',
  })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
  })
  async updateRole(
    @Param('roleId') roleId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    // Update role info if provided
    if (updateRoleDto.name || updateRoleDto.description) {
      await this.roleService.updateRole(roleId, tenantId, {
        name: updateRoleDto.name,
        description: updateRoleDto.description,
      });
    }

    // Update permissions if provided
    if (
      updateRoleDto.permission_ids &&
      updateRoleDto.permission_ids.length >= 0
    ) {
      // Replace all permissions at once
      await this.roleService.replaceRolePermissions(
        roleId,
        updateRoleDto.permission_ids,
        tenantId,
      );
    }

    const role = await this.roleService.getRoleById(roleId, tenantId);
    const permissions = await this.roleService.getRolePermissions(roleId);

    return {
      role,
      permissions: permissions.map((p) => ({
        id: p.id,
        module: p.entity_type,
        action: p.action,
        description: p.description,
      })),
    };
  }

  @Delete(':roleId')
  @RequirePermissions({ entityType: 'User', action: 'Delete' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a role',
    description: 'Deletes a role and removes it from all users',
  })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({
    status: 204,
    description: 'Role deleted successfully',
  })
  async deleteRole(@Param('roleId') roleId: string) {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    await this.roleService.deleteRole(roleId, tenantId);
  }

  @Get(':roleId/permissions')
  @RequirePermissions({ entityType: 'User', action: 'Read' })
  @ApiOperation({
    summary: 'Get role permissions',
    description: 'Returns all permissions assigned to a role',
  })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({
    status: 200,
    description: 'List of permissions',
  })
  async getRolePermissions(@Param('roleId') roleId: string) {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    const role = await this.roleService.getRoleById(roleId, tenantId);
    const permissions = await this.roleService.getRolePermissions(roleId);

    return {
      role: {
        id: role.id,
        name: role.name,
      },
      permissions: permissions.map((p) => ({
        id: p.id,
        module: p.entity_type,
        action: p.action,
        description: p.description,
      })),
    };
  }

  @Post(':roleId/permissions')
  @RequirePermissions({ entityType: 'User', action: 'Update' })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Assign permissions to role',
    description: 'Adds permissions to a role',
  })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({
    status: 201,
    description: 'Permissions assigned successfully',
  })
  async assignPermissionsToRole(
    @Param('roleId') roleId: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    await this.roleService.getRoleById(roleId, tenantId);

    // Get current permissions and merge with new ones
    const currentPermissions = await this.roleService.getRolePermissions(roleId);
    const currentPermissionIds = new Set(currentPermissions.map(p => p.id));
    
    // Combine current and new permissions (avoiding duplicates)
    const allPermissionIds = [
      ...currentPermissionIds,
      ...assignPermissionsDto.permission_ids,
    ];

    // Replace all permissions with the combined list
    await this.roleService.replaceRolePermissions(
      roleId,
      allPermissionIds,
      tenantId,
    );

    const permissions = await this.roleService.getRolePermissions(roleId);

    return {
      permissions: permissions.map((p) => ({
        id: p.id,
        module: p.entity_type,
        action: p.action,
        description: p.description,
      })),
    };
  }

  @Delete(':roleId/permissions/:permissionId')
  @RequirePermissions({ entityType: 'User', action: 'Update' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove permission from role',
    description: 'Removes a permission from a role',
  })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiParam({ name: 'permissionId', description: 'Permission ID' })
  @ApiResponse({
    status: 204,
    description: 'Permission removed successfully',
  })
  async removePermissionFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    await this.roleService.getRoleById(roleId, tenantId);
    await this.roleService.removePermissionFromRole(roleId, permissionId);
  }
}
