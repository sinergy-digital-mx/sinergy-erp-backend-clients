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
import { PermissionService } from '../services/permission.service';
import { TenantContextService } from '../services/tenant-context.service';
import { UsersService } from '../../users/users.service';

@ApiTags('Tenant - Users & Roles')
@Controller('tenant/users')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class UsersRolesController {
  constructor(
    private roleService: RoleService,
    private permissionService: PermissionService,
    private tenantContextService: TenantContextService,
    private usersService: UsersService,
  ) {}

  @Get()
  @RequirePermissions({ entityType: 'User', action: 'Read' })
  @ApiOperation({
    summary: 'List all users in tenant',
    description: 'Returns all users belonging to the current tenant with detailed information',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tenant users with details',
    schema: {
      example: {
        users: [
          {
            id: 'uuid',
            email: 'user@example.com',
            first_name: 'John',
            last_name: 'Doe',
            phone: '+1234567890',
            status: { id: 'uuid', name: 'Active' },
            language_code: 'es',
            last_login_at: '2024-01-27T14:30:00Z',
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      },
    },
  })
  async getTenantUsers() {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    const users = await this.usersService.findAll(tenantId);

    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        phone: u.phone,
        status: u.status,
        language_code: u.language_code,
        last_login_at: u.last_login_at,
        created_at: u.created_at,
      })),
    };
  }
  @Get(':userId')
  @RequirePermissions({ entityType: 'User', action: 'Read' })
  @ApiOperation({
    summary: 'Get user details',
    description: 'Returns details of a specific user in the current tenant',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User details',
  })
  async getUserById(@Param('userId') userId: string) {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    const user = await this.usersService.findOne(userId, tenantId);
    
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      status: user.status,
      language_code: user.language_code,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
    };
  }

  @Put(':userId')
  @RequirePermissions({ entityType: 'User', action: 'Update' })
  @ApiOperation({
    summary: 'Update user',
    description: 'Updates user information in the current tenant',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
  })
  async updateUser(
    @Param('userId') userId: string,
    @Body() updateData: any,
  ) {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    const user = await this.usersService.update(userId, updateData, tenantId);

    return {
      message: 'User updated successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        status: user.status,
        language_code: user.language_code,
      },
    };
  }

  @Get(':userId/permissions')
  @RequirePermissions({ entityType: 'User', action: 'Read' })
  @ApiOperation({
    summary: 'Get user permissions',
    description: 'Returns all permissions for a specific user in the current tenant',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'List of user permissions',
    schema: {
      example: {
        user: {
          id: 'uuid',
          email: 'user@example.com',
        },
        permissions: [
          'leads:create',
          'leads:read',
          'leads:update',
          'customers:read',
        ],
      },
    },
  })
  async getUserPermissions(@Param('userId') userId: string) {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    const permissions = await this.permissionService.getUserPermissions(
      userId,
      tenantId,
    );

    return {
      user: {
        id: userId,
      },
      permissions: permissions.map(
        (p) => `${p.entity_type.toLowerCase()}:${p.action.toLowerCase()}`,
      ),
    };
  }

  @Get(':userId/roles')
  @RequirePermissions({ entityType: 'User', action: 'Read' })
  @ApiOperation({
    summary: 'Get user roles',
    description: 'Returns all roles assigned to a user in the current tenant',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'List of user roles with permissions',
  })
  async getUserRoles(@Param('userId') userId: string) {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    const roles = await this.roleService.getUserRoles(userId, tenantId);

    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const permissions = await this.roleService.getRolePermissions(role.id);
        return {
          id: role.id,
          name: role.name,
          description: role.description,
          is_system_role: role.is_system_role,
          permissions: permissions.map((p) => ({
            id: p.id,
            action: p.action,
            description: p.description,
          })),
        };
      }),
    );

    return {
      user: {
        id: userId,
      },
      roles: rolesWithPermissions,
    };
  }

  @Post(':userId/roles/:roleId')
  @RequirePermissions({ entityType: 'User', action: 'Update' })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Assign role to user',
    description: 'Assigns a role to a user in the current tenant',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({
    status: 201,
    description: 'Role assigned successfully',
  })
  async assignRoleToUser(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    const userRole = await this.roleService.assignRoleToUser(
      userId,
      roleId,
      tenantId,
    );

    return {
      message: 'Role assigned successfully',
      user_role: userRole,
    };
  }

  @Put(':userId/roles/:roleId')
  @RequirePermissions({ entityType: 'User', action: 'Update' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Replace user role',
    description: 'Replaces a user role with a new one in the current tenant',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'roleId', description: 'Current Role ID to replace' })
  @ApiResponse({
    status: 200,
    description: 'Role replaced successfully',
    schema: {
      example: {
        message: 'Role replaced successfully',
        user_role: {
          id: 'uuid',
          user_id: 'uuid',
          role_id: 'uuid',
        },
      },
    },
  })
  async replaceUserRole(
    @Param('userId') userId: string,
    @Param('roleId') oldRoleId: string,
    @Body() body: { new_role_id: string },
  ) {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    
    // Remove old role and assign new one
    await this.roleService.removeRoleFromUser(userId, oldRoleId, tenantId);
    const userRole = await this.roleService.assignRoleToUser(
      userId,
      body.new_role_id,
      tenantId,
    );

    return {
      message: 'Role replaced successfully',
      user_role: userRole,
    };
  }

  @Delete(':userId/roles/:roleId')
  @RequirePermissions({ entityType: 'User', action: 'Update' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove role from user',
    description: 'Removes a role from a user in the current tenant',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID to remove' })
  @ApiResponse({
    status: 200,
    description: 'Role removed successfully',
    schema: {
      example: {
        message: 'Role removed successfully',
      },
    },
  })
  async removeRoleFromUser(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    await this.roleService.removeRoleFromUser(userId, roleId, tenantId);

    return {
      message: 'Role removed successfully',
    };
  }
}
