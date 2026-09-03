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
var ModuleService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const module_entity_1 = require("../../../entities/rbac/module.entity");
const tenant_module_entity_1 = require("../../../entities/rbac/tenant-module.entity");
const permission_entity_1 = require("../../../entities/rbac/permission.entity");
const tenant_context_service_1 = require("./tenant-context.service");
const permission_version_service_1 = require("./permission-version.service");
const permission_cache_service_1 = require("./permission-cache.service");
const module_categories_constants_1 = require("../constants/module-categories.constants");
const divino_dashboard_constants_1 = require("../../divino-dashboard/divino-dashboard.constants");
const DIVINO_EXCLUDED_MODULE_CODES = ['warehouse_control'];
let ModuleService = ModuleService_1 = class ModuleService {
    moduleRepository;
    tenantModuleRepository;
    permissionRepository;
    tenantContextService;
    permissionVersionService;
    permissionCacheService;
    logger = new common_1.Logger(ModuleService_1.name);
    constructor(moduleRepository, tenantModuleRepository, permissionRepository, tenantContextService, permissionVersionService, permissionCacheService) {
        this.moduleRepository = moduleRepository;
        this.tenantModuleRepository = tenantModuleRepository;
        this.permissionRepository = permissionRepository;
        this.tenantContextService = tenantContextService;
        this.permissionVersionService = permissionVersionService;
        this.permissionCacheService = permissionCacheService;
    }
    async refreshTenantUserPermissionVersions(tenantId) {
        await this.permissionVersionService.incrementVersionForUsersInTenant(tenantId);
        try {
            await this.permissionCacheService.invalidateTenantPermissions(tenantId);
        }
        catch (error) {
            this.logger.warn(`Failed to invalidate permission cache for tenant ${tenantId}: ${error.message}`);
        }
    }
    async getEnabledModulesForCurrentTenant() {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        const tenantModules = await this.tenantModuleRepository
            .createQueryBuilder('tm')
            .leftJoinAndSelect('tm.module', 'module')
            .leftJoinAndSelect('module.permissions', 'permissions')
            .where('tm.tenant_id = :tenantId', { tenantId })
            .andWhere('tm.is_enabled = :isEnabled', { isEnabled: true })
            .orderBy('module.category', 'ASC')
            .addOrderBy('module.sort_order', 'ASC')
            .addOrderBy('module.name', 'ASC')
            .addOrderBy('permissions.action', 'ASC')
            .getMany();
        return {
            modules: tenantModules.map(tm => ({
                id: tm.module.id,
                name: tm.module.name,
                code: tm.module.code,
                description: tm.module.description,
                category: tm.module.category,
                category_label: (0, module_categories_constants_1.getModuleCategoryLabel)(tm.module.category),
                sort_order: tm.module.sort_order,
                is_enabled: tm.is_enabled,
                permissions: tm.module.permissions.map(p => ({
                    id: p.id,
                    action: p.action,
                    description: p.description,
                })),
            })),
        };
    }
    async getAllModules() {
        const modules = await this.moduleRepository
            .createQueryBuilder('m')
            .leftJoinAndSelect('m.permissions', 'permissions')
            .orderBy('m.category', 'ASC')
            .addOrderBy('m.sort_order', 'ASC')
            .addOrderBy('m.name', 'ASC')
            .addOrderBy('permissions.action', 'ASC')
            .getMany();
        return {
            modules: modules.map(m => ({
                id: m.id,
                name: m.name,
                code: m.code,
                description: m.description,
                category: m.category,
                category_label: (0, module_categories_constants_1.getModuleCategoryLabel)(m.category),
                sort_order: m.sort_order,
                permissions: m.permissions.map(p => ({
                    id: p.id,
                    action: p.action,
                    description: p.description,
                })),
            })),
        };
    }
    async createModule(data) {
        const existingModule = await this.moduleRepository.findOne({
            where: { code: data.code },
        });
        if (existingModule) {
            throw new common_1.ConflictException(`Module with code '${data.code}' already exists`);
        }
        const module = this.moduleRepository.create(data);
        return await this.moduleRepository.save(module);
    }
    async createPermissionForModule(moduleId, data) {
        const module = await this.moduleRepository.findOne({
            where: { id: moduleId },
        });
        if (!module) {
            throw new common_1.NotFoundException(`Module with ID ${moduleId} not found`);
        }
        const existingPermission = await this.permissionRepository.findOne({
            where: {
                module_id: moduleId,
                action: data.action,
            },
        });
        if (existingPermission) {
            throw new common_1.ConflictException(`Permission '${data.action}' already exists for module '${module.name}'`);
        }
        const permission = this.permissionRepository.create({
            module_id: moduleId,
            entity_type: module.code,
            action: data.action,
            description: data.description,
            is_system_permission: true,
        });
        return await this.permissionRepository.save(permission);
    }
    async enableModuleForTenant(tenantId, moduleId, options) {
        const module = await this.moduleRepository.findOne({
            where: { id: moduleId },
        });
        if (!module) {
            throw new common_1.NotFoundException(`Module with ID ${moduleId} not found`);
        }
        if (tenantId === divino_dashboard_constants_1.DIVINO_DASHBOARD_ALLOWED_TENANT_ID &&
            DIVINO_EXCLUDED_MODULE_CODES.includes(module.code)) {
            throw new common_1.BadRequestException('Este módulo no aplica a esta organización');
        }
        const existingTenantModule = await this.tenantModuleRepository.findOne({
            where: { tenant_id: tenantId, module_id: moduleId },
        });
        let savedTenantModule;
        if (existingTenantModule) {
            if (existingTenantModule.is_enabled) {
                throw new common_1.ConflictException(`Module '${module.name}' is already enabled for this tenant`);
            }
            existingTenantModule.is_enabled = true;
            savedTenantModule = await this.tenantModuleRepository.save(existingTenantModule);
        }
        else {
            const tenantModule = this.tenantModuleRepository.create({
                tenant_id: tenantId,
                module_id: moduleId,
                is_enabled: true,
            });
            savedTenantModule = await this.tenantModuleRepository.save(tenantModule);
        }
        if (!options?.skipPermissionRefresh) {
            await this.refreshTenantUserPermissionVersions(tenantId);
        }
        return savedTenantModule;
    }
    async disableModuleForTenant(tenantId, moduleId) {
        const tenantModule = await this.tenantModuleRepository.findOne({
            where: { tenant_id: tenantId, module_id: moduleId },
        });
        if (!tenantModule) {
            throw new common_1.NotFoundException(`Module is not assigned to this tenant`);
        }
        tenantModule.is_enabled = false;
        const savedTenantModule = await this.tenantModuleRepository.save(tenantModule);
        await this.refreshTenantUserPermissionVersions(tenantId);
        return savedTenantModule;
    }
    async getModuleByCode(code) {
        const module = await this.moduleRepository.findOne({
            where: { code },
            relations: ['permissions'],
        });
        if (!module) {
            throw new common_1.NotFoundException(`Module with code '${code}' not found`);
        }
        return module;
    }
};
exports.ModuleService = ModuleService;
exports.ModuleService = ModuleService = ModuleService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(module_entity_1.Module)),
    __param(1, (0, typeorm_1.InjectRepository)(tenant_module_entity_1.TenantModule)),
    __param(2, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        tenant_context_service_1.TenantContextService,
        permission_version_service_1.PermissionVersionService,
        permission_cache_service_1.PermissionCacheService])
], ModuleService);
//# sourceMappingURL=module.service.js.map