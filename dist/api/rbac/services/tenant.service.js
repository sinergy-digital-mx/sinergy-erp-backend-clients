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
var TenantService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const tenant_entity_1 = require("../../../entities/rbac/tenant.entity");
const role_entity_1 = require("../../../entities/rbac/role.entity");
const user_role_entity_1 = require("../../../entities/rbac/user-role.entity");
const role_permission_entity_1 = require("../../../entities/rbac/role-permission.entity");
const audit_log_entity_1 = require("../../../entities/rbac/audit-log.entity");
const role_template_service_1 = require("./role-template.service");
const audit_log_service_1 = require("./audit-log.service");
const config_1 = require("@nestjs/config");
let TenantService = TenantService_1 = class TenantService {
    tenantRepository;
    roleRepository;
    userRoleRepository;
    rolePermissionRepository;
    auditLogRepository;
    roleTemplateService;
    auditLogService;
    configService;
    logger = new common_1.Logger(TenantService_1.name);
    constructor(tenantRepository, roleRepository, userRoleRepository, rolePermissionRepository, auditLogRepository, roleTemplateService, auditLogService, configService) {
        this.tenantRepository = tenantRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.auditLogRepository = auditLogRepository;
        this.roleTemplateService = roleTemplateService;
        this.auditLogService = auditLogService;
        this.configService = configService;
    }
    async createTenant(options) {
        this.logger.debug(`Creating tenant: ${options.name} (${options.subdomain})`);
        this.validateTenantOptions(options);
        await this.checkTenantUniqueness(options.name, options.subdomain);
        const result = {
            tenant: null,
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
            const tenant = this.tenantRepository.create({
                name: options.name,
                subdomain: options.subdomain,
                is_active: options.isActive ?? true,
            });
            result.tenant = await this.tenantRepository.save(tenant);
            this.logger.debug(`Created tenant ${options.name} with ID ${result.tenant.id}`);
            if (!options.skipSystemRoles) {
                try {
                    result.systemRoles = await this.roleTemplateService.createSystemRolesForTenant(result.tenant.id, true);
                    this.logger.debug(`Created ${result.systemRoles.totalRoles} system roles for tenant ${result.tenant.id}`);
                }
                catch (error) {
                    this.logger.error(`Failed to create system roles for tenant ${result.tenant.id}:`, error);
                    result.warnings.push(`Failed to create system roles: ${error.message}`);
                }
            }
            const configCustomRoles = this.getCustomRoleTemplatesFromConfig();
            const allCustomRoles = [...configCustomRoles, ...(options.customRoleTemplates || [])];
            if (allCustomRoles.length > 0) {
                try {
                    result.customRoles = await this.createCustomRolesForTenant(result.tenant.id, allCustomRoles);
                    this.logger.debug(`Created ${result.customRoles.totalRoles} custom roles for tenant ${result.tenant.id}`);
                }
                catch (error) {
                    this.logger.error(`Failed to create custom roles for tenant ${result.tenant.id}:`, error);
                    result.warnings.push(`Failed to create custom roles: ${error.message}`);
                }
            }
            this.logger.log(`Tenant creation completed for ${options.name}: ` +
                `${result.systemRoles.totalRoles} system roles, ` +
                `${result.customRoles.totalRoles} custom roles, ` +
                `${result.systemRoles.totalPermissions + result.customRoles.totalPermissions} total permissions`);
            return result;
        }
        catch (error) {
            if (result.tenant) {
                try {
                    await this.tenantRepository.remove(result.tenant);
                    this.logger.debug(`Cleaned up tenant ${result.tenant.id} after creation failure`);
                }
                catch (cleanupError) {
                    this.logger.error(`Failed to cleanup tenant after creation failure:`, cleanupError);
                }
            }
            throw error;
        }
    }
    async getTenantById(tenantId) {
        return await this.tenantRepository.findOne({
            where: { id: tenantId },
        });
    }
    async getTenantBySubdomain(subdomain) {
        return await this.tenantRepository.findOne({
            where: { subdomain },
        });
    }
    async initializeRolesForTenant(tenantId, skipExisting = true) {
        this.logger.debug(`Initializing roles for existing tenant ${tenantId}`);
        const tenant = await this.getTenantById(tenantId);
        if (!tenant) {
            throw new common_1.BadRequestException(`Tenant with ID ${tenantId} not found`);
        }
        const result = {
            systemRoles: { roles: [], totalRoles: 0, totalPermissions: 0, errors: [] },
            customRoles: { roles: [], totalRoles: 0, totalPermissions: 0, errors: [] },
            warnings: [],
        };
        try {
            result.systemRoles = await this.roleTemplateService.createSystemRolesForTenant(tenantId, skipExisting);
            this.logger.debug(`Created ${result.systemRoles.totalRoles} system roles for tenant ${tenantId}`);
        }
        catch (error) {
            this.logger.error(`Failed to create system roles for tenant ${tenantId}:`, error);
            result.warnings.push(`Failed to create system roles: ${error.message}`);
        }
        try {
            const customRoleTemplates = this.getCustomRoleTemplatesFromConfig();
            result.customRoles = await this.createCustomRolesForTenant(tenantId, customRoleTemplates);
            this.logger.debug(`Created ${result.customRoles.totalRoles} custom roles for tenant ${tenantId}`);
        }
        catch (error) {
            this.logger.error(`Failed to create custom roles for tenant ${tenantId}:`, error);
            result.warnings.push(`Failed to create custom roles: ${error.message}`);
        }
        this.logger.log(`Role initialization completed for tenant ${tenantId}: ` +
            `${result.systemRoles.totalRoles} system roles, ${result.customRoles.totalRoles} custom roles`);
        return result;
    }
    async updateTenantStatus(tenantId, isActive) {
        const tenant = await this.getTenantById(tenantId);
        if (!tenant) {
            throw new common_1.BadRequestException(`Tenant with ID ${tenantId} not found`);
        }
        tenant.is_active = isActive;
        return await this.tenantRepository.save(tenant);
    }
    async deleteTenant(tenantId, actorId) {
        const tenant = await this.getTenantById(tenantId);
        if (!tenant) {
            throw new common_1.BadRequestException(`Tenant with ID ${tenantId} not found`);
        }
        this.logger.debug(`Starting cascade deletion for tenant ${tenantId}`);
        const deletionResult = {
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
            const counts = await this.getTenantDataCounts(tenantId);
            await this.validateTenantDeletion(tenantId, deletionResult);
            await this.performCascadeDeletion(tenantId, deletionResult);
            await this.tenantRepository.remove(tenant);
            if (actorId) {
                await this.logTenantDeletion(tenantId, actorId, deletionResult);
            }
            this.logger.log(`Successfully deleted tenant ${tenantId} (${tenant.name}) and all associated data: ` +
                `${deletionResult.cascadeResults.userRoles} user roles, ` +
                `${deletionResult.cascadeResults.rolePermissions} role permissions, ` +
                `${deletionResult.cascadeResults.roles} roles, ` +
                `${deletionResult.cascadeResults.auditLogs} audit logs`);
            return deletionResult;
        }
        catch (error) {
            this.logger.error(`Failed to delete tenant ${tenantId}:`, error);
            deletionResult.warnings.push(`Deletion failed: ${error.message}`);
            throw error;
        }
    }
    async deleteTenantLegacy(tenantId) {
        await this.deleteTenant(tenantId);
    }
    validateTenantOptions(options) {
        if (!options.name || options.name.trim().length === 0) {
            throw new common_1.BadRequestException('Tenant name is required');
        }
        if (!options.subdomain || options.subdomain.trim().length === 0) {
            throw new common_1.BadRequestException('Tenant subdomain is required');
        }
        const subdomainRegex = /^[a-z0-9-]+$/;
        if (!subdomainRegex.test(options.subdomain)) {
            throw new common_1.BadRequestException('Subdomain must contain only lowercase letters, numbers, and hyphens');
        }
        if (options.name.length > 100) {
            throw new common_1.BadRequestException('Tenant name must be 100 characters or less');
        }
        if (options.subdomain.length > 50) {
            throw new common_1.BadRequestException('Tenant subdomain must be 50 characters or less');
        }
    }
    async checkTenantUniqueness(name, subdomain) {
        const existingByName = await this.tenantRepository.findOne({
            where: { name },
        });
        if (existingByName) {
            throw new common_1.ConflictException(`Tenant with name '${name}' already exists`);
        }
        const existingBySubdomain = await this.tenantRepository.findOne({
            where: { subdomain },
        });
        if (existingBySubdomain) {
            throw new common_1.ConflictException(`Tenant with subdomain '${subdomain}' already exists`);
        }
    }
    getCustomRoleTemplatesFromConfig() {
        try {
            const customTemplates = this.configService.get('rbac.customRoleTemplates', []);
            if (!Array.isArray(customTemplates)) {
                this.logger.warn('Custom role templates configuration is not an array, trying environment variable');
                const envTemplates = this.configService.get('RBAC_CUSTOM_ROLE_TEMPLATES');
                if (envTemplates) {
                    try {
                        const parsed = JSON.parse(envTemplates);
                        if (Array.isArray(parsed)) {
                            return this.validateCustomTemplates(parsed);
                        }
                    }
                    catch (parseError) {
                        this.logger.warn('Failed to parse RBAC_CUSTOM_ROLE_TEMPLATES from environment:', parseError);
                    }
                }
                return [];
            }
            return this.validateCustomTemplates(customTemplates);
        }
        catch (error) {
            this.logger.warn('Failed to load custom role templates from configuration:', error);
            return [];
        }
    }
    validateCustomTemplates(templates) {
        const validTemplates = templates.filter((template) => {
            if (!template.name || !template.description || !Array.isArray(template.permissions)) {
                this.logger.warn(`Invalid custom role template structure, skipping: ${JSON.stringify(template)}`);
                return false;
            }
            const validPermissions = template.permissions.every((perm) => {
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
    async createCustomRolesForTenant(tenantId, customRoleTemplates) {
        const result = {
            roles: [],
            totalRoles: 0,
            totalPermissions: 0,
            errors: [],
        };
        for (const template of customRoleTemplates) {
            try {
                const roleResult = await this.roleTemplateService.createRoleFromCustomTemplate(template.name, template.description, template.permissions, tenantId, false);
                result.roles.push(roleResult);
                result.totalRoles++;
                result.totalPermissions += roleResult.permissionsAssigned;
            }
            catch (error) {
                this.logger.error(`Failed to create custom role ${template.name} for tenant ${tenantId}:`, error);
                result.errors.push(`Failed to create role ${template.name}: ${error.message}`);
            }
        }
        return result;
    }
    async getTenantDataCounts(tenantId) {
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
    async validateTenantDeletion(tenantId, deletionResult) {
        const counts = await this.getTenantDataCounts(tenantId);
        if (counts.activeUsers > 0) {
            deletionResult.warnings.push(`Tenant has ${counts.activeUsers} active users. All user assignments will be removed.`);
        }
        if (counts.roles > 0) {
            deletionResult.warnings.push(`Tenant has ${counts.roles} roles that will be deleted.`);
        }
        if (counts.auditLogs > 0) {
            deletionResult.warnings.push(`Tenant has ${counts.auditLogs} audit log entries that will be deleted.`);
        }
    }
    async performCascadeDeletion(tenantId, deletionResult) {
        this.logger.debug(`Performing cascade deletion for tenant ${tenantId}`);
        try {
            const userRoleDeleteResult = await this.userRoleRepository.delete({ tenant_id: tenantId });
            deletionResult.cascadeResults.userRoles = userRoleDeleteResult.affected || 0;
            this.logger.debug(`Deleted ${deletionResult.cascadeResults.userRoles} user role assignments`);
            const rolePermissionDeleteResult = await this.rolePermissionRepository
                .createQueryBuilder()
                .delete()
                .where('role_id IN (SELECT id FROM rbac_roles WHERE tenant_id = :tenantId)', { tenantId })
                .execute();
            deletionResult.cascadeResults.rolePermissions = rolePermissionDeleteResult.affected || 0;
            this.logger.debug(`Deleted ${deletionResult.cascadeResults.rolePermissions} role permission assignments`);
            const roleDeleteResult = await this.roleRepository.delete({ tenant_id: tenantId });
            deletionResult.cascadeResults.roles = roleDeleteResult.affected || 0;
            this.logger.debug(`Deleted ${deletionResult.cascadeResults.roles} roles`);
            const deleteAuditLogs = this.configService.get('RBAC_DELETE_AUDIT_LOGS_ON_TENANT_DELETION', 'true') === 'true';
            if (deleteAuditLogs) {
                const auditLogDeleteResult = await this.auditLogRepository.delete({ tenantId });
                deletionResult.cascadeResults.auditLogs = auditLogDeleteResult.affected || 0;
                this.logger.debug(`Deleted ${deletionResult.cascadeResults.auditLogs} audit log entries`);
            }
            else {
                this.logger.debug('Audit logs preserved as per configuration');
                deletionResult.warnings.push('Audit logs were preserved as per system configuration');
            }
        }
        catch (error) {
            this.logger.error(`Error during cascade deletion for tenant ${tenantId}:`, error);
            throw new common_1.BadRequestException(`Failed to perform cascade deletion: ${error.message}`);
        }
    }
    async logTenantDeletion(tenantId, actorId, deletionResult) {
        try {
            await this.auditLogService.logTenantManagement(audit_log_service_1.AuditAction.TENANT_DELETED, actorId, tenantId, `Tenant '${deletionResult.tenantName}' deleted with cascade cleanup: ` +
                `${deletionResult.cascadeResults.userRoles} user roles, ` +
                `${deletionResult.cascadeResults.rolePermissions} role permissions, ` +
                `${deletionResult.cascadeResults.roles} roles, ` +
                `${deletionResult.cascadeResults.auditLogs} audit logs`, {
                cascadeResults: deletionResult.cascadeResults,
                warnings: deletionResult.warnings,
                deletedAt: deletionResult.deletedAt,
            });
        }
        catch (error) {
            this.logger.warn(`Failed to log tenant deletion audit entry: ${error.message}`);
        }
    }
    async validateOrphanedReferences(tenantId) {
        const warnings = [];
        try {
            const orphanedUserRoles = await this.userRoleRepository
                .createQueryBuilder('ur')
                .leftJoin('ur.tenant', 't')
                .where('ur.tenant_id = :tenantId', { tenantId })
                .andWhere('t.id IS NULL')
                .getCount();
            if (orphanedUserRoles > 0) {
                warnings.push(`Found ${orphanedUserRoles} orphaned user role assignments`);
            }
            const orphanedRolePermissions = await this.rolePermissionRepository
                .createQueryBuilder('rp')
                .leftJoin('rp.role', 'r')
                .where('r.tenant_id = :tenantId', { tenantId })
                .andWhere('r.id IS NULL')
                .getCount();
            if (orphanedRolePermissions > 0) {
                warnings.push(`Found ${orphanedRolePermissions} orphaned role permission assignments`);
            }
            const orphanedRoles = await this.roleRepository
                .createQueryBuilder('r')
                .leftJoin('r.tenant', 't')
                .where('r.tenant_id = :tenantId', { tenantId })
                .andWhere('t.id IS NULL')
                .getCount();
            if (orphanedRoles > 0) {
                warnings.push(`Found ${orphanedRoles} orphaned roles`);
            }
        }
        catch (error) {
            this.logger.error(`Error validating orphaned references for tenant ${tenantId}:`, error);
            warnings.push(`Failed to validate orphaned references: ${error.message}`);
        }
        return warnings;
    }
};
exports.TenantService = TenantService;
exports.TenantService = TenantService = TenantService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tenant_entity_1.RBACTenant)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(2, (0, typeorm_1.InjectRepository)(user_role_entity_1.UserRole)),
    __param(3, (0, typeorm_1.InjectRepository)(role_permission_entity_1.RolePermission)),
    __param(4, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        role_template_service_1.RoleTemplateService,
        audit_log_service_1.AuditLogService,
        config_1.ConfigService])
], TenantService);
//# sourceMappingURL=tenant.service.js.map