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
var RoleTemplateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleTemplateService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const role_entity_1 = require("../../../entities/rbac/role.entity");
const permission_entity_1 = require("../../../entities/rbac/permission.entity");
const role_permission_entity_1 = require("../../../entities/rbac/role-permission.entity");
const entity_registry_entity_1 = require("../../../entities/entity-registry/entity-registry.entity");
const role_templates_1 = require("../templates/role-templates");
const permission_service_1 = require("./permission.service");
let RoleTemplateService = RoleTemplateService_1 = class RoleTemplateService {
    roleRepository;
    permissionRepository;
    rolePermissionRepository;
    entityRegistryRepository;
    permissionService;
    logger = new common_1.Logger(RoleTemplateService_1.name);
    constructor(roleRepository, permissionRepository, rolePermissionRepository, entityRegistryRepository, permissionService) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.entityRegistryRepository = entityRegistryRepository;
        this.permissionService = permissionService;
    }
    async createRoleFromTemplate(template, tenantId, skipExisting = true) {
        this.logger.debug(`Creating role from template: ${template.name} for tenant ${tenantId}`);
        if (!(0, role_templates_1.validateRoleTemplate)(template)) {
            throw new common_1.BadRequestException(`Invalid role template structure for ${template.name}`);
        }
        const result = {
            role: null,
            permissionsCreated: 0,
            permissionsAssigned: 0,
            warnings: [],
        };
        const existingRole = await this.roleRepository.findOne({
            where: { name: template.name, tenant_id: tenantId },
        });
        if (existingRole) {
            if (skipExisting) {
                this.logger.debug(`Role ${template.name} already exists in tenant ${tenantId}, skipping`);
                result.role = existingRole;
                result.warnings.push(`Role ${template.name} already exists`);
                return result;
            }
            else {
                throw new common_1.ConflictException(`Role ${template.name} already exists in tenant ${tenantId}`);
            }
        }
        const role = this.roleRepository.create({
            name: template.name,
            description: template.description,
            tenant_id: tenantId,
            is_system_role: template.isSystemRole || false,
        });
        result.role = await this.roleRepository.save(role);
        this.logger.debug(`Created role ${template.name} with ID ${result.role.id}`);
        const availableEntityTypes = await this.getAvailableEntityTypes();
        const expandedTemplate = (0, role_templates_1.expandWildcardPermissions)(template, availableEntityTypes);
        for (const permissionSpec of expandedTemplate.permissions) {
            try {
                const permissionResults = await this.createAndAssignPermissions(result.role.id, permissionSpec.entityType, permissionSpec.actions);
                result.permissionsCreated += permissionResults.created;
                result.permissionsAssigned += permissionResults.assigned;
                result.warnings.push(...permissionResults.warnings);
            }
            catch (error) {
                this.logger.warn(`Failed to create permissions for ${permissionSpec.entityType}:`, error);
                result.warnings.push(`Failed to create permissions for ${permissionSpec.entityType}: ${error.message}`);
            }
        }
        this.logger.debug(`Role template creation completed for ${template.name}: ` +
            `${result.permissionsCreated} permissions created, ` +
            `${result.permissionsAssigned} permissions assigned`);
        return result;
    }
    async createSystemRolesForTenant(tenantId, skipExisting = true) {
        this.logger.debug(`Creating system roles for tenant ${tenantId}`);
        const result = {
            roles: [],
            totalRoles: 0,
            totalPermissions: 0,
            errors: [],
        };
        const systemTemplates = (0, role_templates_1.getSystemRoleTemplates)();
        for (const template of systemTemplates) {
            try {
                const roleResult = await this.createRoleFromTemplate(template, tenantId, skipExisting);
                result.roles.push(roleResult);
                result.totalRoles++;
                result.totalPermissions += roleResult.permissionsAssigned;
            }
            catch (error) {
                this.logger.error(`Failed to create system role ${template.name} for tenant ${tenantId}:`, error);
                result.errors.push(`Failed to create role ${template.name}: ${error.message}`);
            }
        }
        this.logger.debug(`System role creation completed for tenant ${tenantId}: ` +
            `${result.totalRoles} roles created, ${result.totalPermissions} permissions assigned`);
        return result;
    }
    async createRoleFromSystemTemplate(templateName, tenantId, skipExisting = true) {
        const template = (0, role_templates_1.getRoleTemplateByName)(templateName);
        if (!template) {
            throw new common_1.BadRequestException(`System role template '${templateName}' not found`);
        }
        return this.createRoleFromTemplate(template, tenantId, skipExisting);
    }
    async createRoleFromCustomTemplate(name, description, permissions, tenantId, isSystemRole = false) {
        const template = (0, role_templates_1.createCustomRoleTemplate)(name, description, permissions, isSystemRole);
        return this.createRoleFromTemplate(template, tenantId, false);
    }
    getSystemRoleTemplates() {
        return (0, role_templates_1.getSystemRoleTemplates)();
    }
    getSystemRoleTemplate(name) {
        return (0, role_templates_1.getRoleTemplateByName)(name);
    }
    async updateRoleToMatchTemplate(roleId, template) {
        this.logger.debug(`Updating role ${roleId} to match template ${template.name}`);
        if (!(0, role_templates_1.validateRoleTemplate)(template)) {
            throw new common_1.BadRequestException(`Invalid role template structure for ${template.name}`);
        }
        const role = await this.roleRepository.findOne({
            where: { id: roleId },
        });
        if (!role) {
            throw new common_1.BadRequestException(`Role with ID ${roleId} not found`);
        }
        const result = {
            role,
            permissionsCreated: 0,
            permissionsAssigned: 0,
            warnings: [],
        };
        let roleUpdated = false;
        if (role.description !== template.description) {
            role.description = template.description;
            roleUpdated = true;
        }
        if (roleUpdated) {
            await this.roleRepository.save(role);
            this.logger.debug(`Updated role metadata for ${template.name}`);
        }
        const availableEntityTypes = await this.getAvailableEntityTypes();
        const expandedTemplate = (0, role_templates_1.expandWildcardPermissions)(template, availableEntityTypes);
        const existingPermissions = await this.getRolePermissions(roleId);
        const existingPermissionKeys = new Set(existingPermissions.map(p => `${p.entity_type}:${p.action}`));
        for (const permissionSpec of expandedTemplate.permissions) {
            try {
                const permissionResults = await this.createAndAssignPermissions(roleId, permissionSpec.entityType, permissionSpec.actions, existingPermissionKeys);
                result.permissionsCreated += permissionResults.created;
                result.permissionsAssigned += permissionResults.assigned;
                result.warnings.push(...permissionResults.warnings);
            }
            catch (error) {
                this.logger.warn(`Failed to update permissions for ${permissionSpec.entityType}:`, error);
                result.warnings.push(`Failed to update permissions for ${permissionSpec.entityType}: ${error.message}`);
            }
        }
        this.logger.debug(`Role template update completed for ${template.name}: ` +
            `${result.permissionsCreated} permissions created, ` +
            `${result.permissionsAssigned} permissions assigned`);
        return result;
    }
    async validateRoleAgainstTemplate(roleId, template) {
        const rolePermissions = await this.getRolePermissions(roleId);
        const rolePermissionKeys = new Set(rolePermissions.map(p => `${p.entity_type}:${p.action}`));
        const availableEntityTypes = await this.getAvailableEntityTypes();
        const expandedTemplate = (0, role_templates_1.expandWildcardPermissions)(template, availableEntityTypes);
        const templatePermissionKeys = new Set();
        for (const permissionSpec of expandedTemplate.permissions) {
            for (const action of permissionSpec.actions) {
                templatePermissionKeys.add(`${permissionSpec.entityType}:${action}`);
            }
        }
        const missingPermissions = Array.from(templatePermissionKeys).filter(key => !rolePermissionKeys.has(key));
        const extraPermissions = Array.from(rolePermissionKeys).filter(key => !templatePermissionKeys.has(key));
        return {
            matches: missingPermissions.length === 0 && extraPermissions.length === 0,
            missingPermissions,
            extraPermissions,
        };
    }
    async createAndAssignPermissions(roleId, entityType, actions, existingPermissions) {
        const result = {
            created: 0,
            assigned: 0,
            warnings: []
        };
        const isValidEntity = await this.permissionService.validateEntityType(entityType);
        if (!isValidEntity) {
            result.warnings.push(`Entity type ${entityType} not found in Entity Registry`);
            return result;
        }
        for (const action of actions) {
            if (!(0, role_templates_1.validateAction)(action)) {
                result.warnings.push(`Invalid action: ${action}`);
                continue;
            }
            const permissionKey = `${entityType}:${action}`;
            if (existingPermissions && existingPermissions.has(permissionKey)) {
                continue;
            }
            try {
                let permission = await this.permissionService.findPermission(entityType, action);
                if (!permission) {
                    permission = await this.permissionService.createPermission(entityType, action, `${action} permission for ${entityType}`);
                    result.created++;
                    this.logger.debug(`Created permission ${entityType}:${action}`);
                }
                const existingRolePermission = await this.rolePermissionRepository.findOne({
                    where: { role_id: roleId, permission_id: permission.id },
                });
                if (!existingRolePermission) {
                    const rolePermission = this.rolePermissionRepository.create({
                        role_id: roleId,
                        permission_id: permission.id,
                    });
                    await this.rolePermissionRepository.save(rolePermission);
                    result.assigned++;
                    this.logger.debug(`Assigned permission ${entityType}:${action} to role ${roleId}`);
                }
            }
            catch (error) {
                this.logger.warn(`Failed to create/assign permission ${entityType}:${action}:`, error);
                result.warnings.push(`Failed to create/assign permission ${entityType}:${action}: ${error.message}`);
            }
        }
        return result;
    }
    async getRolePermissions(roleId) {
        return await this.permissionRepository
            .createQueryBuilder('p')
            .innerJoin('p.role_permissions', 'rp')
            .where('rp.role_id = :roleId', { roleId })
            .getMany();
    }
    async getAvailableEntityTypes() {
        const entities = await this.entityRegistryRepository.find({
            select: ['code'],
        });
        return entities.map(entity => entity.code);
    }
};
exports.RoleTemplateService = RoleTemplateService;
exports.RoleTemplateService = RoleTemplateService = RoleTemplateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(1, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __param(2, (0, typeorm_1.InjectRepository)(role_permission_entity_1.RolePermission)),
    __param(3, (0, typeorm_1.InjectRepository)(entity_registry_entity_1.EntityRegistry)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        permission_service_1.PermissionService])
], RoleTemplateService);
//# sourceMappingURL=role-template.service.js.map