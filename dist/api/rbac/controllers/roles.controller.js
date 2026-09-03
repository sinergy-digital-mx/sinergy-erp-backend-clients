"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const permission_guard_1 = require("../guards/permission.guard");
const require_permissions_decorator_1 = require("../decorators/require-permissions.decorator");
const role_service_1 = require("../services/role.service");
const tenant_context_service_1 = require("../services/tenant-context.service");
const create_role_dto_1 = require("../dto/create-role.dto");
const update_role_dto_1 = require("../dto/update-role.dto");
const assign_permissions_dto_1 = require("../dto/assign-permissions.dto");
const replace_role_permissions_dto_1 = require("../dto/replace-role-permissions.dto");
const group_modules_by_category_util_1 = require("../utils/group-modules-by-category.util");
let RolesController = class RolesController {
    roleService;
    tenantContextService;
    constructor(roleService, tenantContextService) {
        this.roleService = roleService;
        this.tenantContextService = tenantContextService;
    }
    async getRolesSummary() {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const roles = await this.roleService.getTenantRoles(tenantId);
        const rolesWithCounts = await Promise.all(roles.map(async (role) => {
            const userIds = await this.roleService.getUsersWithRole(role.id, tenantId);
            const permissions = await this.roleService.getRolePermissions(role.id);
            return {
                id: role.id,
                name: role.name,
                permission_count: permissions.length,
                user_count: userIds.length,
                is_system_role: role.is_system_role,
            };
        }));
        rolesWithCounts.sort((a, b) => b.permission_count - a.permission_count);
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
    async getAvailablePermissions() {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const enabledModules = await this.roleService.getEnabledModulesForTenant(tenantId);
        const enabledModuleIds = enabledModules.map(m => m.module_id);
        const allPermissions = await this.roleService.getAllPermissions();
        const tenantPermissions = allPermissions.filter(permission => {
            if (permission.module_id) {
                return enabledModuleIds.includes(permission.module_id);
            }
            return true;
        });
        const groupedByModule = (0, group_modules_by_category_util_1.buildGroupedModulesForPermissions)(enabledModules, tenantPermissions);
        const { modules, categories } = (0, group_modules_by_category_util_1.groupModulesByCategory)(groupedByModule);
        return {
            modules,
            categories,
        };
    }
    async getRoles() {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const roles = await this.roleService.getTenantRoles(tenantId);
        const rolesWithCounts = await Promise.all(roles.map(async (role) => {
            const userIds = await this.roleService.getUsersWithRole(role.id, tenantId);
            const permissions = await this.roleService.getRolePermissions(role.id);
            return {
                ...role,
                user_count: userIds.length,
                permission_count: permissions.length,
            };
        }));
        return { roles: rolesWithCounts };
    }
    async getAvailablePermissionsForRole(roleId) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const role = await this.roleService.getRoleById(roleId, tenantId);
        const enabledModules = await this.roleService.getEnabledModulesForTenant(tenantId);
        const enabledModuleIds = enabledModules.map(m => m.module_id);
        const allPermissions = await this.roleService.getAllPermissions();
        const rolePermissions = await this.roleService.getRolePermissions(roleId);
        const assignedPermissionIds = new Set(rolePermissions.map(p => p.id));
        const tenantPermissions = allPermissions.filter(permission => {
            if (permission.module_id) {
                return enabledModuleIds.includes(permission.module_id);
            }
            return true;
        });
        const groupedByModule = (0, group_modules_by_category_util_1.buildGroupedModulesForPermissions)(enabledModules, tenantPermissions, assignedPermissionIds);
        const { modules, categories } = (0, group_modules_by_category_util_1.groupModulesByCategory)(groupedByModule);
        return {
            role: {
                id: role.id,
                name: role.name,
            },
            modules,
            categories,
        };
    }
    async getRole(roleId) {
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
    async createRole(createRoleDto) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const role = await this.roleService.createRole(tenantId, createRoleDto.name, createRoleDto.description);
        if (createRoleDto.permission_ids && createRoleDto.permission_ids.length > 0) {
            await this.roleService.replaceRolePermissions(role.id, createRoleDto.permission_ids, tenantId);
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
    async updateRole(roleId, updateRoleDto) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        if (updateRoleDto.name || updateRoleDto.description) {
            await this.roleService.updateRole(roleId, tenantId, {
                name: updateRoleDto.name,
                description: updateRoleDto.description,
            });
        }
        if (updateRoleDto.permission_ids &&
            updateRoleDto.permission_ids.length >= 0) {
            await this.roleService.replaceRolePermissions(roleId, updateRoleDto.permission_ids, tenantId);
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
    async deleteRole(roleId) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        await this.roleService.deleteRole(roleId, tenantId);
    }
    async getRolePermissions(roleId) {
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
    async replaceRolePermissions(roleId, replaceRolePermissionsDto) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const role = await this.roleService.getRoleById(roleId, tenantId);
        await this.roleService.replaceRolePermissions(roleId, replaceRolePermissionsDto.permission_ids, tenantId);
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
    async assignPermissionsToRole(roleId, assignPermissionsDto) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        await this.roleService.getRoleById(roleId, tenantId);
        const currentPermissions = await this.roleService.getRolePermissions(roleId);
        const currentPermissionIds = new Set(currentPermissions.map(p => p.id));
        const allPermissionIds = [
            ...currentPermissionIds,
            ...assignPermissionsDto.permission_ids,
        ];
        await this.roleService.replaceRolePermissions(roleId, allPermissionIds, tenantId);
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
    async removePermissionFromRole(roleId, permissionId) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        await this.roleService.getRoleById(roleId, tenantId);
        await this.roleService.removePermissionFromRole(roleId, permissionId);
    }
};
exports.RolesController = RolesController;
__decorate([
    (0, common_1.Get)('summary/counts'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get roles summary with counts',
        description: 'Returns a summary of all roles with user and permission counts',
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "getRolesSummary", null);
__decorate([
    (0, common_1.Get)('permissions/available'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get available permissions for tenant grouped by module',
        description: 'Returns only permissions for modules enabled in the current tenant, grouped by module with their entities and actions',
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "getAvailablePermissions", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all roles for current tenant',
        description: 'Returns all roles available in the current tenant with permission counts',
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "getRoles", null);
__decorate([
    (0, common_1.Get)(':roleId/permissions/available'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get available permissions for a role with assignment status',
        description: 'Returns all permissions available for the tenant grouped by module, with indication of which ones are already assigned to the role',
    }),
    (0, swagger_1.ApiParam)({ name: 'roleId', description: 'Role ID' }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __param(0, (0, common_1.Param)('roleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "getAvailablePermissionsForRole", null);
__decorate([
    (0, common_1.Get)(':roleId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get role details',
        description: 'Returns detailed information about a specific role with permission count',
    }),
    (0, swagger_1.ApiParam)({ name: 'roleId', description: 'Role ID' }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __param(0, (0, common_1.Param)('roleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "getRole", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Create' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new role',
        description: 'Creates a new role in the current tenant',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Role created successfully',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_role_dto_1.CreateRoleDto]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "createRole", null);
__decorate([
    (0, common_1.Put)(':roleId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Update a role',
        description: 'Updates role information and/or permissions',
    }),
    (0, swagger_1.ApiParam)({ name: 'roleId', description: 'Role ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Role updated successfully',
    }),
    __param(0, (0, common_1.Param)('roleId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_role_dto_1.UpdateRoleDto]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Delete)(':roleId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Delete' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete a role',
        description: 'Deletes a role and removes it from all users',
    }),
    (0, swagger_1.ApiParam)({ name: 'roleId', description: 'Role ID' }),
    (0, swagger_1.ApiResponse)({
        status: 204,
        description: 'Role deleted successfully',
    }),
    __param(0, (0, common_1.Param)('roleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "deleteRole", null);
__decorate([
    (0, common_1.Get)(':roleId/permissions'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get role permissions',
        description: 'Returns all permissions assigned to a role',
    }),
    (0, swagger_1.ApiParam)({ name: 'roleId', description: 'Role ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of permissions',
    }),
    __param(0, (0, common_1.Param)('roleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "getRolePermissions", null);
__decorate([
    (0, common_1.Put)(':roleId/permissions'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Replace role permissions',
        description: 'Replaces all permissions assigned to a role with the provided list',
    }),
    (0, swagger_1.ApiParam)({ name: 'roleId', description: 'Role ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Permissions replaced successfully',
    }),
    __param(0, (0, common_1.Param)('roleId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, replace_role_permissions_dto_1.ReplaceRolePermissionsDto]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "replaceRolePermissions", null);
__decorate([
    (0, common_1.Post)(':roleId/permissions'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Update' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Assign permissions to role',
        description: 'Adds permissions to a role',
    }),
    (0, swagger_1.ApiParam)({ name: 'roleId', description: 'Role ID' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Permissions assigned successfully',
    }),
    __param(0, (0, common_1.Param)('roleId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_permissions_dto_1.AssignPermissionsDto]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "assignPermissionsToRole", null);
__decorate([
    (0, common_1.Delete)(':roleId/permissions/:permissionId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Update' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({
        summary: 'Remove permission from role',
        description: 'Removes a permission from a role',
    }),
    (0, swagger_1.ApiParam)({ name: 'roleId', description: 'Role ID' }),
    (0, swagger_1.ApiParam)({ name: 'permissionId', description: 'Permission ID' }),
    (0, swagger_1.ApiResponse)({
        status: 204,
        description: 'Permission removed successfully',
    }),
    __param(0, (0, common_1.Param)('roleId')),
    __param(1, (0, common_1.Param)('permissionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "removePermissionFromRole", null);
exports.RolesController = RolesController = __decorate([
    (0, swagger_1.ApiTags)('Tenant - Roles'),
    (0, common_1.Controller)('tenant/roles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [role_service_1.RoleService,
        tenant_context_service_1.TenantContextService])
], RolesController);
//# sourceMappingURL=roles.controller.js.map