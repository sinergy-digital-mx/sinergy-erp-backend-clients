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
exports.UsersRolesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const permission_guard_1 = require("../guards/permission.guard");
const require_permissions_decorator_1 = require("../decorators/require-permissions.decorator");
const role_service_1 = require("../services/role.service");
const permission_service_1 = require("../services/permission.service");
const tenant_context_service_1 = require("../services/tenant-context.service");
const users_service_1 = require("../../users/users.service");
const create_user_dto_1 = require("../../users/dto/create-user.dto");
const update_user_dto_1 = require("../../users/dto/update-user.dto");
const assign_user_branch_dto_1 = require("../../users/dto/assign-user-branch.dto");
const set_active_branch_dto_1 = require("../../users/dto/set-active-branch.dto");
const assign_user_warehouses_dto_1 = require("../../users/dto/assign-user-warehouses.dto");
const assign_user_report_dto_1 = require("../../users/dto/assign-user-report.dto");
const change_password_dto_1 = require("../../users/dto/change-password.dto");
const query_users_dto_1 = require("../../users/dto/query-users.dto");
const update_user_status_dto_1 = require("../../users/dto/update-user-status.dto");
let UsersRolesController = class UsersRolesController {
    roleService;
    permissionService;
    tenantContextService;
    usersService;
    constructor(roleService, permissionService, tenantContextService, usersService) {
        this.roleService = roleService;
        this.permissionService = permissionService;
        this.tenantContextService = tenantContextService;
        this.usersService = usersService;
    }
    async createUser(dto, req) {
        const tenantId = this.tenantContextService.getCurrentTenantId() ||
            req?.user?.tenant_id ||
            req?.user?.tenantId ||
            null;
        if (!tenantId) {
            throw new common_1.BadRequestException('Contexto de organización requerido');
        }
        const user = await this.usersService.create(dto, tenantId);
        return {
            message: 'User created successfully',
            user: this.usersService.mapUserResponse(user),
        };
    }
    async getUserStatuses() {
        return this.usersService.findAllStatuses();
    }
    async getMyBranches(req) {
        const { userId, tenantId } = this.resolveSessionContext(req);
        const user = await this.usersService.findOne(userId, tenantId);
        if (!user) {
            throw new Error('User not found');
        }
        return this.usersService.mapUserBranchResponse(user);
    }
    async setMyActiveBranch(req, dto) {
        const { userId, tenantId } = this.resolveSessionContext(req);
        const branch = await this.usersService.setActiveBranch(userId, tenantId, dto.billing_branch_id);
        return {
            message: 'Sucursal activa actualizada',
            ...branch,
        };
    }
    async getTenantUsers(query) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const users = await this.usersService.findAll(tenantId, query);
        return {
            users: users.map((u) => this.usersService.mapUserResponse(u)),
        };
    }
    async getUserById(userId) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const user = await this.usersService.findOne(userId, tenantId);
        if (!user) {
            throw new Error('User not found');
        }
        return this.usersService.mapUserResponse(user);
    }
    async updateUserStatus(userId, dto) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        const currentUserId = this.tenantContextService.getCurrentUserId();
        if (!tenantId || !currentUserId) {
            throw new Error('User context is required');
        }
        const user = await this.usersService.updateStatus(userId, tenantId, dto.status_id, currentUserId);
        return {
            message: 'Estatus actualizado',
            user: this.usersService.mapUserResponse(user),
        };
    }
    async deleteUser(userId) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        const currentUserId = this.tenantContextService.getCurrentUserId();
        if (!tenantId || !currentUserId) {
            throw new Error('User context is required');
        }
        const user = await this.usersService.softDelete(userId, tenantId, currentUserId);
        return {
            message: 'Usuario eliminado',
            user: this.usersService.mapUserResponse(user),
        };
    }
    async getUserBranch(userId) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.usersService.getUserBranch(userId, tenantId);
    }
    async getManagerReports(userId) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.usersService.getManagerReports(userId, tenantId);
    }
    async addManagerReport(userId, dto) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const report = await this.usersService.addManagerReport(userId, dto.user_id, tenantId);
        return {
            message: 'Usuario asignado al gerente',
            report,
        };
    }
    async removeManagerReport(userId, reportUserId) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        await this.usersService.removeManagerReport(userId, reportUserId, tenantId);
        return {
            message: 'Usuario desasignado del gerente',
        };
    }
    async getUserWarehouses(userId) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        return this.usersService.getAssignedWarehouses(userId, tenantId);
    }
    async assignUserWarehouses(userId, dto) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const warehouses = await this.usersService.replaceAssignedWarehouses(userId, tenantId, dto.warehouse_ids);
        return {
            message: 'Almacenes de Mesa de Control actualizados',
            ...warehouses,
        };
    }
    async assignUserBranch(userId, dto) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const branch = await this.usersService.assignBranch(userId, tenantId, dto);
        return {
            message: 'Branch assignment updated successfully',
            ...branch,
        };
    }
    async changePassword(userId, dto) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        const currentUserId = this.tenantContextService.getCurrentUserId();
        if (!tenantId || !currentUserId) {
            throw new Error('User context is required');
        }
        const canResetOthers = await this.permissionService.hasPermission(currentUserId, tenantId, 'User', 'Reset_Password');
        return this.usersService.changePassword(userId, dto, tenantId, currentUserId, canResetOthers);
    }
    async updateUser(userId, updateData, req) {
        const tenantId = this.tenantContextService.getCurrentTenantId() ||
            req?.user?.tenant_id ||
            req?.user?.tenantId ||
            null;
        if (!tenantId) {
            throw new common_1.BadRequestException('Contexto de organización requerido');
        }
        const user = await this.usersService.update(userId, updateData, tenantId);
        return {
            message: 'User updated successfully',
            user: this.usersService.mapUserResponse(user),
        };
    }
    async getUserPermissions(userId) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const permissions = await this.permissionService.getUserPermissions(userId, tenantId);
        return {
            user: {
                id: userId,
            },
            permissions: permissions.map((p) => `${p.entity_type.toLowerCase()}:${p.action.toLowerCase()}`),
        };
    }
    async getUserRoles(userId) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const roles = await this.roleService.getUserRoles(userId, tenantId);
        const rolesWithPermissions = await Promise.all(roles.map(async (role) => {
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
        }));
        return {
            user: {
                id: userId,
            },
            roles: rolesWithPermissions,
        };
    }
    async assignRoleToUser(userId, roleId) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        const userRole = await this.roleService.assignRoleToUser(userId, roleId, tenantId);
        return {
            message: 'Role assigned successfully',
            user_role: userRole,
        };
    }
    async replaceUserRole(userId, oldRoleId, body) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        await this.roleService.removeRoleFromUser(userId, oldRoleId, tenantId);
        const userRole = await this.roleService.assignRoleToUser(userId, body.new_role_id, tenantId);
        return {
            message: 'Role replaced successfully',
            user_role: userRole,
        };
    }
    async removeRoleFromUser(userId, roleId) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new Error('Tenant context is required');
        }
        await this.roleService.removeRoleFromUser(userId, roleId, tenantId);
        return {
            message: 'Role removed successfully',
        };
    }
    resolveSessionContext(req) {
        const user = req?.user;
        const userId = (typeof user?.id === 'string' && user.id) ||
            (typeof user?.user_id === 'string' && user.user_id) ||
            this.tenantContextService.getCurrentUserId();
        const tenantId = (typeof user?.tenant_id === 'string' && user.tenant_id) ||
            (typeof user?.tenantId === 'string' && user.tenantId) ||
            this.tenantContextService.getCurrentTenantId();
        if (!userId || !tenantId) {
            throw new common_1.UnauthorizedException('Se requiere sesión');
        }
        return { userId, tenantId };
    }
};
exports.UsersRolesController = UsersRolesController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Create' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new user',
        description: 'Creates a new user in the current tenant',
    }),
    (0, swagger_1.ApiBody)({ type: create_user_dto_1.CreateUserDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'User created successfully',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto, Object]),
    __metadata("design:returntype", Promise)
], UsersRolesController.prototype, "createUser", null);
__decorate([
    (0, common_1.Get)('statuses'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'List user statuses',
        description: 'Catálogo de estatus para el detalle y el filtro del listado',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersRolesController.prototype, "getUserStatuses", null);
__decorate([
    (0, common_1.Get)('me/branches'),
    (0, swagger_1.ApiOperation)({
        summary: 'Sucursales del usuario en sesión',
        description: 'Devuelve sucursales asignadas, principal, activa y si puede cambiar de sucursal en POS.',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersRolesController.prototype, "getMyBranches", null);
__decorate([
    (0, common_1.Put)('me/active-branch'),
    (0, swagger_1.ApiOperation)({
        summary: 'Cambiar sucursal activa',
        description: 'El usuario elige en qué sucursal opera (POS: inventario y corte). Debe estar asignada. El corte de la sucursal anterior no se cierra.',
    }),
    (0, swagger_1.ApiBody)({ type: set_active_branch_dto_1.SetActiveBranchDto }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, set_active_branch_dto_1.SetActiveBranchDto]),
    __metadata("design:returntype", Promise)
], UsersRolesController.prototype, "setMyActiveBranch", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'List all users in tenant',
        description: 'Returns users of the current organization. Supports search, status_id and role_id filters.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'status_id', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'role_id', required: false, type: String }),
    (0, swagger_1.ApiResponse)({
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
                        status: { id: 1, code: 'active', name: 'Activo' },
                        language_code: 'es',
                        last_login_at: '2024-01-27T14:30:00Z',
                        created_at: '2024-01-01T00:00:00Z',
                    },
                ],
            },
        },
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_users_dto_1.QueryUsersDto]),
    __metadata("design:returntype", Promise)
], UsersRolesController.prototype, "getTenantUsers", null);
__decorate([
    (0, common_1.Get)(':userId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get user details',
        description: 'Returns details of a specific user in the current tenant',
    }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User details',
    }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersRolesController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Put)(':userId/status'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Update user status',
        description: 'Cambia el estatus del usuario (activo / inactivo). No usar para eliminar; eso va por DELETE.',
    }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID' }),
    (0, swagger_1.ApiBody)({ type: update_user_status_dto_1.UpdateUserStatusDto }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_status_dto_1.UpdateUserStatusDto]),
    __metadata("design:returntype", Promise)
], UsersRolesController.prototype, "updateUserStatus", null);
__decorate([
    (0, common_1.Delete)(':userId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Delete' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Soft-delete a user',
        description: 'Marca al usuario como eliminado. No borra el registro.',
    }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersRolesController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Get)(':userId/branch'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get user branch assignment',
        description: 'Returns assigned branches, primary, active branch, or all-access when none are assigned',
    }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersRolesController.prototype, "getUserBranch", null);
__decorate([
    (0, common_1.Get)(':userId/reports'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'List users assigned to a manager',
        description: 'Returns the users for whom this manager is the responsible person',
    }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'Manager user ID' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersRolesController.prototype, "getManagerReports", null);
__decorate([
    (0, common_1.Post)(':userId/reports'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Update' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Assign a user to a manager',
        description: 'Adds a user to the manager team. The manager becomes their responsible person.',
    }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'Manager user ID' }),
    (0, swagger_1.ApiBody)({ type: assign_user_report_dto_1.AssignUserReportDto }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_user_report_dto_1.AssignUserReportDto]),
    __metadata("design:returntype", Promise)
], UsersRolesController.prototype, "addManagerReport", null);
__decorate([
    (0, common_1.Delete)(':userId/reports/:reportUserId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Update' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Remove a user from a manager',
        description: 'Removes the responsible relationship between manager and user',
    }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'Manager user ID' }),
    (0, swagger_1.ApiParam)({ name: 'reportUserId', description: 'Assigned user ID' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('reportUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersRolesController.prototype, "removeManagerReport", null);
__decorate([
    (0, common_1.Get)(':userId/warehouses'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'List warehouses assigned to the user for Mesa de Control',
    }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersRolesController.prototype, "getUserWarehouses", null);
__decorate([
    (0, common_1.Put)(':userId/warehouses'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Replace Mesa de Control warehouse assignments',
    }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID' }),
    (0, swagger_1.ApiBody)({ type: assign_user_warehouses_dto_1.AssignUserWarehousesDto }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_user_warehouses_dto_1.AssignUserWarehousesDto]),
    __metadata("design:returntype", Promise)
], UsersRolesController.prototype, "assignUserWarehouses", null);
__decorate([
    (0, common_1.Put)(':userId/branch'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Assign branches to user',
        description: 'Assigns one or more branches. Send billing_branch_ids empty and billing_branch_id null for access to all (non-POS). POS requires at least one. primary_billing_branch_id marks the default.',
    }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID' }),
    (0, swagger_1.ApiBody)({ type: assign_user_branch_dto_1.AssignUserBranchDto }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_user_branch_dto_1.AssignUserBranchDto]),
    __metadata("design:returntype", Promise)
], UsersRolesController.prototype, "assignUserBranch", null);
__decorate([
    (0, common_1.Put)(':userId/password'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Update' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Change or reset user password',
        description: 'Cambia la contraseña propia, o la de cualquier usuario si el actor tiene User:Reset_Password.',
    }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID' }),
    (0, swagger_1.ApiBody)({ type: change_password_dto_1.ChangePasswordDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Password updated successfully',
        schema: {
            example: { message: 'Contraseña actualizada correctamente' },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Passwords do not match' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Cannot change another user password without Reset_Password',
    }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, change_password_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], UsersRolesController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Put)(':userId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Update' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Update user',
        description: 'Updates user information in the current tenant',
    }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User updated successfully',
    }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto, Object]),
    __metadata("design:returntype", Promise)
], UsersRolesController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Get)(':userId/permissions'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get user permissions',
        description: 'Returns all permissions for a specific user in the current tenant',
    }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID' }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersRolesController.prototype, "getUserPermissions", null);
__decorate([
    (0, common_1.Get)(':userId/roles'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get user roles',
        description: 'Returns all roles assigned to a user in the current tenant',
    }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of user roles with permissions',
    }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersRolesController.prototype, "getUserRoles", null);
__decorate([
    (0, common_1.Post)(':userId/roles/:roleId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Update' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Assign role to user',
        description: 'Assigns a role to a user in the current tenant',
    }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID' }),
    (0, swagger_1.ApiParam)({ name: 'roleId', description: 'Role ID' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Role assigned successfully',
    }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('roleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersRolesController.prototype, "assignRoleToUser", null);
__decorate([
    (0, common_1.Put)(':userId/roles/:roleId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Update' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Replace user role',
        description: 'Replaces a user role with a new one in the current tenant',
    }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID' }),
    (0, swagger_1.ApiParam)({ name: 'roleId', description: 'Current Role ID to replace' }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('roleId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UsersRolesController.prototype, "replaceUserRole", null);
__decorate([
    (0, common_1.Delete)(':userId/roles/:roleId'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Update' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Remove role from user',
        description: 'Removes a role from a user in the current tenant',
    }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID' }),
    (0, swagger_1.ApiParam)({ name: 'roleId', description: 'Role ID to remove' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Role removed successfully',
        schema: {
            example: {
                message: 'Role removed successfully',
            },
        },
    }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('roleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersRolesController.prototype, "removeRoleFromUser", null);
exports.UsersRolesController = UsersRolesController = __decorate([
    (0, swagger_1.ApiTags)('Tenant - Users & Roles'),
    (0, common_1.Controller)('tenant/users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [role_service_1.RoleService,
        permission_service_1.PermissionService,
        tenant_context_service_1.TenantContextService,
        users_service_1.UsersService])
], UsersRolesController);
//# sourceMappingURL=users-roles.controller.js.map