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
exports.RoleService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const role_entity_1 = require("../../../entities/rbac/role.entity");
const user_role_entity_1 = require("../../../entities/rbac/user-role.entity");
const role_permission_entity_1 = require("../../../entities/rbac/role-permission.entity");
const permission_entity_1 = require("../../../entities/rbac/permission.entity");
const tenant_entity_1 = require("../../../entities/rbac/tenant.entity");
const tenant_module_entity_1 = require("../../../entities/rbac/tenant-module.entity");
const tenant_context_service_1 = require("./tenant-context.service");
const permission_cache_service_1 = require("./permission-cache.service");
const permission_version_service_1 = require("./permission-version.service");
let RoleService = class RoleService {
    roleRepository;
    userRoleRepository;
    rolePermissionRepository;
    permissionRepository;
    tenantRepository;
    tenantModuleRepository;
    tenantContextService;
    permissionCacheService;
    permissionVersionService;
    constructor(roleRepository, userRoleRepository, rolePermissionRepository, permissionRepository, tenantRepository, tenantModuleRepository, tenantContextService, permissionCacheService, permissionVersionService) {
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.permissionRepository = permissionRepository;
        this.tenantRepository = tenantRepository;
        this.tenantModuleRepository = tenantModuleRepository;
        this.tenantContextService = tenantContextService;
        this.permissionCacheService = permissionCacheService;
        this.permissionVersionService = permissionVersionService;
    }
    async createRole(tenantId, name, description) {
        this.validateTenantContext(tenantId);
        const tenant = await this.tenantRepository.findOne({
            where: { id: tenantId },
        });
        if (!tenant) {
            throw new common_1.NotFoundException(`Tenant with ID ${tenantId} not found`);
        }
        const existingRole = await this.roleRepository.findOne({
            where: { name, tenant_id: tenantId },
        });
        if (existingRole) {
            throw new common_1.ConflictException(`Role with name '${name}' already exists in this tenant`);
        }
        const role = this.roleRepository.create({
            name,
            description,
            tenant_id: tenantId,
            is_system_role: false,
        });
        return await this.roleRepository.save(role);
    }
    async createRoleInCurrentContext(name, description) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        if (!tenantId) {
            throw new common_1.UnauthorizedException('Tenant context is required');
        }
        return this.createRole(tenantId, name, description);
    }
    async assignRoleToUser(userId, roleId, tenantId) {
        this.validateTenantContext(tenantId);
        await this.validateCrossTenantRoleAssignment(userId, roleId, tenantId);
        const role = await this.roleRepository.findOne({
            where: { id: roleId, tenant_id: tenantId },
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role with ID ${roleId} not found in tenant ${tenantId}`);
        }
        const existingUserRole = await this.userRoleRepository.findOne({
            where: { user_id: userId, role_id: roleId, tenant_id: tenantId },
        });
        if (existingUserRole) {
            throw new common_1.ConflictException(`User already has role '${role.name}' in this tenant`);
        }
        const userRole = this.userRoleRepository.create({
            user_id: userId,
            role_id: roleId,
            tenant_id: tenantId,
        });
        const savedUserRole = await this.userRoleRepository.save(userRole);
        await this.permissionVersionService.incrementUserVersion(userId);
        try {
            await this.permissionCacheService.invalidateUserPermissions(userId, tenantId);
        }
        catch (error) {
            console.warn(`Failed to invalidate cache for user ${userId}:`, error.message);
        }
        return savedUserRole;
    }
    async assignPermissionToRole(roleId, permissionId, tenantId) {
        const role = await this.roleRepository.findOne({
            where: { id: roleId },
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role with ID ${roleId} not found`);
        }
        const permission = await this.permissionRepository.findOne({
            where: { id: permissionId },
        });
        if (!permission) {
            throw new common_1.NotFoundException(`Permission with ID ${permissionId} not found`);
        }
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
                throw new common_1.BadRequestException(`Permission belongs to a module that is not enabled for this tenant`);
            }
        }
        const existingRolePermission = await this.rolePermissionRepository.findOne({
            where: { role_id: roleId, permission_id: permissionId },
        });
        if (existingRolePermission) {
            throw new common_1.ConflictException(`Role already has permission '${permission.entity_type}:${permission.action}'`);
        }
        const rolePermission = this.rolePermissionRepository.create({
            role_id: roleId,
            permission_id: permissionId,
        });
        const savedRolePermission = await this.rolePermissionRepository.save(rolePermission);
        await this.permissionVersionService.incrementVersionForUsersWithRole(roleId, role.tenant_id);
        const userIds = await this.getUsersWithRole(roleId, role.tenant_id);
        try {
            await this.permissionCacheService.invalidateRolePermissions(roleId, role.tenant_id, userIds);
        }
        catch (error) {
            console.warn(`Failed to invalidate role permissions cache for role ${roleId}:`, error.message);
        }
        return savedRolePermission;
    }
    async replaceRolePermissions(roleId, permissionIds, tenantId) {
        const role = await this.roleRepository.findOne({
            where: { id: roleId, tenant_id: tenantId },
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role with ID ${roleId} not found in tenant ${tenantId}`);
        }
        await this.rolePermissionRepository
            .createQueryBuilder()
            .delete()
            .where('role_id = :roleId', { roleId })
            .execute();
        if (permissionIds.length > 0) {
            await this.rolePermissionRepository
                .createQueryBuilder()
                .insert()
                .into(role_permission_entity_1.RolePermission)
                .values(permissionIds.map(permissionId => ({
                role_id: roleId,
                permission_id: permissionId,
            })))
                .execute();
        }
        await this.permissionVersionService.incrementVersionForUsersWithRole(roleId, tenantId);
        const userIds = await this.getUsersWithRole(roleId, tenantId);
        try {
            await this.permissionCacheService.invalidateRolePermissions(roleId, tenantId, userIds);
        }
        catch (error) {
            console.warn(`Failed to invalidate role permissions cache for role ${roleId}:`, error.message);
        }
    }
    async getUserRoles(userId, tenantId) {
        this.validateTenantContext(tenantId, userId);
        const roles = await this.roleRepository
            .createQueryBuilder('r')
            .innerJoin('r.user_roles', 'ur')
            .where('ur.user_id = :userId', { userId })
            .andWhere('ur.tenant_id = :tenantId', { tenantId })
            .getMany();
        return roles;
    }
    async getCurrentUserRoles() {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        const userId = this.tenantContextService.getCurrentUserId();
        if (!tenantId || !userId) {
            throw new common_1.UnauthorizedException('Tenant context is required');
        }
        return this.getUserRoles(userId, tenantId);
    }
    async getTenantRoles(tenantId) {
        return await this.roleRepository.find({
            where: { tenant_id: tenantId },
            order: { name: 'ASC' },
        });
    }
    async getRoleById(roleId, tenantId) {
        const role = await this.roleRepository.findOne({
            where: { id: roleId, tenant_id: tenantId },
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role with ID ${roleId} not found in tenant ${tenantId}`);
        }
        return role;
    }
    async getRolePermissions(roleId) {
        const permissions = await this.permissionRepository
            .createQueryBuilder('p')
            .innerJoin('p.role_permissions', 'rp')
            .where('rp.role_id = :roleId', { roleId })
            .getMany();
        return permissions;
    }
    async removeRoleFromUser(userId, roleId, tenantId) {
        const userRole = await this.userRoleRepository.findOne({
            where: { user_id: userId, role_id: roleId, tenant_id: tenantId },
        });
        if (!userRole) {
            throw new common_1.NotFoundException(`User role assignment not found for user ${userId}, role ${roleId} in tenant ${tenantId}`);
        }
        await this.userRoleRepository.remove(userRole);
        await this.permissionVersionService.incrementUserVersion(userId);
        try {
            await this.permissionCacheService.invalidateUserPermissions(userId, tenantId);
        }
        catch (error) {
            console.warn(`Failed to invalidate cache for user ${userId}:`, error.message);
        }
    }
    async removePermissionFromRole(roleId, permissionId) {
        const rolePermission = await this.rolePermissionRepository.findOne({
            where: { role_id: roleId, permission_id: permissionId },
        });
        if (!rolePermission) {
            throw new common_1.NotFoundException(`Role permission assignment not found for role ${roleId}, permission ${permissionId}`);
        }
        const role = await this.roleRepository.findOne({
            where: { id: roleId },
        });
        await this.rolePermissionRepository.remove(rolePermission);
        if (role) {
            await this.permissionVersionService.incrementVersionForUsersWithRole(roleId, role.tenant_id);
            const userIds = await this.getUsersWithRole(roleId, role.tenant_id);
            try {
                await this.permissionCacheService.invalidateRolePermissions(roleId, role.tenant_id, userIds);
            }
            catch (error) {
                console.warn(`Failed to invalidate role permissions cache for role ${roleId}:`, error.message);
            }
        }
    }
    async updateRole(roleId, tenantId, updates) {
        const role = await this.getRoleById(roleId, tenantId);
        if (updates.name && updates.name !== role.name) {
            const existingRole = await this.roleRepository.findOne({
                where: { name: updates.name, tenant_id: tenantId },
            });
            if (existingRole) {
                throw new common_1.ConflictException(`Role with name '${updates.name}' already exists in this tenant`);
            }
        }
        Object.assign(role, updates);
        return await this.roleRepository.save(role);
    }
    async deleteRole(roleId, tenantId) {
        const role = await this.getRoleById(roleId, tenantId);
        if (role.is_system_role) {
            throw new common_1.BadRequestException('System roles cannot be deleted');
        }
        const userIds = await this.getUsersWithRole(roleId, tenantId);
        await this.userRoleRepository.delete({ role_id: roleId });
        await this.rolePermissionRepository.delete({ role_id: roleId });
        await this.roleRepository.remove(role);
        try {
            await this.permissionCacheService.invalidateRolePermissions(roleId, tenantId, userIds);
        }
        catch (error) {
            console.warn(`Failed to invalidate role permissions cache for deleted role ${roleId}:`, error.message);
        }
    }
    async createSystemRoles(tenantId) {
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
        const createdRoles = [];
        for (const roleTemplate of systemRoles) {
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
            }
            else {
                createdRoles.push(existingRole);
            }
        }
        return createdRoles;
    }
    validateTenantContext(tenantId, userId) {
        const currentTenantId = this.tenantContextService.getCurrentTenantId();
        if (currentTenantId && currentTenantId !== tenantId) {
            throw new common_1.UnauthorizedException('Cross-tenant access denied: Tenant context mismatch');
        }
    }
    async validateCrossTenantRoleAssignment(userId, roleId, tenantId) {
        const role = await this.roleRepository.findOne({
            where: { id: roleId },
        });
        if (role && role.tenant_id !== tenantId) {
            throw new common_1.UnauthorizedException(`Cannot assign role from tenant ${role.tenant_id} to user in tenant ${tenantId}`);
        }
    }
    async getUsersWithRole(roleId, tenantId) {
        this.validateTenantContext(tenantId);
        const userRoles = await this.userRoleRepository.find({
            where: { role_id: roleId, tenant_id: tenantId },
            select: ['user_id'],
        });
        return userRoles?.map(ur => ur.user_id) || [];
    }
    async userHasRole(userId, roleId, tenantId) {
        this.validateTenantContext(tenantId, userId);
        const userRole = await this.userRoleRepository.findOne({
            where: { user_id: userId, role_id: roleId, tenant_id: tenantId },
        });
        return !!userRole;
    }
    async getEnabledModulesForTenant(tenantId) {
        return this.tenantModuleRepository.find({
            where: {
                tenant_id: tenantId,
                is_enabled: true
            },
            relations: ['module'],
        });
    }
    async getAllPermissions() {
        return await this.permissionRepository.find({
            relations: ['entity_registry'],
            order: { action: 'ASC' },
        });
    }
};
exports.RoleService = RoleService;
exports.RoleService = RoleService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(1, (0, typeorm_1.InjectRepository)(user_role_entity_1.UserRole)),
    __param(2, (0, typeorm_1.InjectRepository)(role_permission_entity_1.RolePermission)),
    __param(3, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __param(4, (0, typeorm_1.InjectRepository)(tenant_entity_1.RBACTenant)),
    __param(5, (0, typeorm_1.InjectRepository)(tenant_module_entity_1.TenantModule)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        tenant_context_service_1.TenantContextService,
        permission_cache_service_1.PermissionCacheService,
        permission_version_service_1.PermissionVersionService])
], RoleService);
//# sourceMappingURL=role.service.js.map