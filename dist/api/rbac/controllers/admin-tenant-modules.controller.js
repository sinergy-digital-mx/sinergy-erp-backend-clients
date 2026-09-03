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
exports.AdminTenantModulesController = void 0;
const common_1 = require("@nestjs/common");
const module_service_1 = require("../services/module.service");
const tenant_service_1 = require("../services/tenant.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const tenant_entity_1 = require("../../../entities/rbac/tenant.entity");
const module_entity_1 = require("../../../entities/rbac/module.entity");
const tenant_module_entity_1 = require("../../../entities/rbac/tenant-module.entity");
const permission_entity_1 = require("../../../entities/rbac/permission.entity");
const uuid_1 = require("uuid");
let AdminTenantModulesController = class AdminTenantModulesController {
    moduleService;
    tenantService;
    tenantRepository;
    moduleRepository;
    tenantModuleRepository;
    permissionRepository;
    constructor(moduleService, tenantService, tenantRepository, moduleRepository, tenantModuleRepository, permissionRepository) {
        this.moduleService = moduleService;
        this.tenantService = tenantService;
        this.tenantRepository = tenantRepository;
        this.moduleRepository = moduleRepository;
        this.tenantModuleRepository = tenantModuleRepository;
        this.permissionRepository = permissionRepository;
    }
    async getAllTenants() {
        const tenants = await this.tenantRepository.find({
            order: { name: 'ASC' },
        });
        return {
            tenants: tenants.map(t => ({
                id: t.id,
                name: t.name,
                subdomain: t.subdomain,
                isActive: t.is_active,
                createdAt: t.created_at,
            })),
        };
    }
    async getAllModules() {
        return await this.moduleService.getAllModules();
    }
    async getTenantModules(tenantId) {
        const tenant = await this.tenantRepository.findOne({
            where: { id: tenantId },
        });
        if (!tenant) {
            return { error: 'Tenant not found' };
        }
        const allModules = await this.moduleRepository.find({
            order: { category: 'ASC', sort_order: 'ASC', name: 'ASC' },
        });
        const tenantModules = await this.tenantModuleRepository.find({
            where: { tenant_id: tenantId },
        });
        const tenantModuleMap = new Map(tenantModules.map(tm => [tm.module_id, tm.is_enabled]));
        return {
            tenant: {
                id: tenant.id,
                name: tenant.name,
                subdomain: tenant.subdomain,
            },
            modules: allModules.map(m => ({
                id: m.id,
                name: m.name,
                code: m.code,
                description: m.description,
                category: m.category,
                sort_order: m.sort_order,
                isEnabled: tenantModuleMap.get(m.id) || false,
            })),
        };
    }
    async enableModule(tenantId, moduleId) {
        try {
            await this.moduleService.enableModuleForTenant(tenantId, moduleId);
            return { message: 'Module enabled successfully' };
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async disableModule(tenantId, moduleId) {
        try {
            await this.moduleService.disableModuleForTenant(tenantId, moduleId);
            return { message: 'Module disabled successfully' };
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async enableAllModules(tenantId) {
        try {
            const allModules = await this.moduleRepository.find();
            let enabledCount = 0;
            for (const module of allModules) {
                try {
                    await this.moduleService.enableModuleForTenant(tenantId, module.id, {
                        skipPermissionRefresh: true,
                    });
                    enabledCount++;
                }
                catch (error) {
                }
            }
            if (enabledCount > 0) {
                await this.moduleService.refreshTenantUserPermissionVersions(tenantId);
            }
            return {
                message: `Enabled ${enabledCount} modules successfully`,
                total: allModules.length,
            };
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async getAllPermissions() {
        const permissions = await this.permissionRepository.find({
            relations: ['module'],
            order: { entity_type: 'ASC', action: 'ASC' },
        });
        return {
            permissions: permissions.map(p => ({
                id: p.id,
                entityType: p.entity_type,
                action: p.action,
                description: p.description,
                moduleId: p.module_id,
                moduleName: p.module?.name,
                moduleCode: p.module?.code,
                isSystemPermission: p.is_system_permission,
            })),
        };
    }
    async getModulePermissions(moduleId) {
        const module = await this.moduleRepository.findOne({
            where: { id: moduleId },
            relations: ['permissions'],
        });
        if (!module) {
            return { error: 'Module not found' };
        }
        return {
            module: {
                id: module.id,
                name: module.name,
                code: module.code,
            },
            permissions: module.permissions.map(p => ({
                id: p.id,
                entityType: p.entity_type,
                action: p.action,
                description: p.description,
                isSystemPermission: p.is_system_permission,
            })),
        };
    }
    async createPermission(moduleId, body) {
        try {
            const module = await this.moduleRepository.findOne({
                where: { id: moduleId },
            });
            if (!module) {
                return { error: 'Module not found' };
            }
            const existing = await this.permissionRepository.findOne({
                where: {
                    module_id: moduleId,
                    action: body.action,
                },
            });
            if (existing) {
                return { error: `Permission '${body.action}' already exists for this module` };
            }
            const entityRegistryRepo = this.permissionRepository.manager.getRepository('EntityRegistry');
            const entityRegistry = await entityRegistryRepo
                .createQueryBuilder('er')
                .where('er.code = :code', { code: module.code })
                .getOne();
            if (!entityRegistry) {
                return {
                    error: `Entity registry not found for module code: ${module.code}. Please create it first.`,
                    hint: `Run: INSERT INTO entity_registry (code, name) VALUES ('${module.code}', '${module.name}');`
                };
            }
            const permissionId = (0, uuid_1.v4)();
            await this.permissionRepository
                .createQueryBuilder()
                .insert()
                .into('rbac_permissions')
                .values({
                id: permissionId,
                module_id: moduleId,
                entity_registry_id: entityRegistry.id,
                action: body.action,
                description: body.description || `${body.action} permission for ${module.name}`,
                is_system_permission: false,
            })
                .execute();
            const saved = await this.permissionRepository.findOne({
                where: { id: permissionId },
            });
            if (!saved) {
                return { error: 'Permission created but could not be retrieved' };
            }
            return {
                message: 'Permission created successfully',
                permission: {
                    id: saved.id,
                    entityType: module.code,
                    action: saved.action,
                    description: saved.description,
                },
            };
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async updatePermission(permissionId, body) {
        try {
            const permission = await this.permissionRepository.findOne({
                where: { id: permissionId },
            });
            if (!permission) {
                return { error: 'Permission not found' };
            }
            const updateData = {};
            if (body.action !== undefined) {
                updateData.action = body.action;
            }
            if (body.description !== undefined) {
                updateData.description = body.description;
            }
            if (Object.keys(updateData).length === 0) {
                return { error: 'No fields to update' };
            }
            await this.permissionRepository
                .createQueryBuilder()
                .update()
                .set(updateData)
                .where('id = :id', { id: permissionId })
                .execute();
            const updated = await this.permissionRepository.findOne({
                where: { id: permissionId },
                relations: ['entity_registry', 'module'],
            });
            if (!updated) {
                return { error: 'Permission updated but could not be retrieved' };
            }
            return {
                message: 'Permission updated successfully',
                permission: {
                    id: updated.id,
                    entityType: updated.entity_registry?.code || updated.module?.code || '',
                    action: updated.action,
                    description: updated.description,
                },
            };
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async deletePermission(permissionId) {
        try {
            const permission = await this.permissionRepository.findOne({
                where: { id: permissionId },
            });
            if (!permission) {
                return { error: 'Permission not found' };
            }
            await this.permissionRepository.remove(permission);
            const message = permission.is_system_permission
                ? 'System permission deleted (use with caution)'
                : 'Permission deleted successfully';
            return { message };
        }
        catch (error) {
            return { error: error.message };
        }
    }
};
exports.AdminTenantModulesController = AdminTenantModulesController;
__decorate([
    (0, common_1.Get)('tenants'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminTenantModulesController.prototype, "getAllTenants", null);
__decorate([
    (0, common_1.Get)('modules'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminTenantModulesController.prototype, "getAllModules", null);
__decorate([
    (0, common_1.Get)('tenants/:tenantId/modules'),
    __param(0, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminTenantModulesController.prototype, "getTenantModules", null);
__decorate([
    (0, common_1.Post)('tenants/:tenantId/modules/:moduleId/enable'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('moduleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminTenantModulesController.prototype, "enableModule", null);
__decorate([
    (0, common_1.Post)('tenants/:tenantId/modules/:moduleId/disable'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('moduleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminTenantModulesController.prototype, "disableModule", null);
__decorate([
    (0, common_1.Post)('tenants/:tenantId/modules/enable-all'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminTenantModulesController.prototype, "enableAllModules", null);
__decorate([
    (0, common_1.Get)('permissions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminTenantModulesController.prototype, "getAllPermissions", null);
__decorate([
    (0, common_1.Get)('modules/:moduleId/permissions'),
    __param(0, (0, common_1.Param)('moduleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminTenantModulesController.prototype, "getModulePermissions", null);
__decorate([
    (0, common_1.Post)('modules/:moduleId/permissions'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('moduleId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminTenantModulesController.prototype, "createPermission", null);
__decorate([
    (0, common_1.Put)('permissions/:permissionId'),
    __param(0, (0, common_1.Param)('permissionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminTenantModulesController.prototype, "updatePermission", null);
__decorate([
    (0, common_1.Delete)('permissions/:permissionId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('permissionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminTenantModulesController.prototype, "deletePermission", null);
exports.AdminTenantModulesController = AdminTenantModulesController = __decorate([
    (0, common_1.Controller)('admin/tenant-modules'),
    __param(2, (0, typeorm_1.InjectRepository)(tenant_entity_1.RBACTenant)),
    __param(3, (0, typeorm_1.InjectRepository)(module_entity_1.Module)),
    __param(4, (0, typeorm_1.InjectRepository)(tenant_module_entity_1.TenantModule)),
    __param(5, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __metadata("design:paramtypes", [module_service_1.ModuleService,
        tenant_service_1.TenantService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminTenantModulesController);
//# sourceMappingURL=admin-tenant-modules.controller.js.map