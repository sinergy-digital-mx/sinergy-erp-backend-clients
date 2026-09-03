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
var MenuPermissionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuPermissionService = void 0;
const common_1 = require("@nestjs/common");
const permission_service_1 = require("./permission.service");
const tenant_context_service_1 = require("./tenant-context.service");
const module_service_1 = require("./module.service");
let MenuPermissionService = MenuPermissionService_1 = class MenuPermissionService {
    permissionService;
    tenantContextService;
    moduleService;
    logger = new common_1.Logger(MenuPermissionService_1.name);
    constructor(permissionService, tenantContextService, moduleService) {
        this.permissionService = permissionService;
        this.tenantContextService = tenantContextService;
        this.moduleService = moduleService;
    }
    async canViewMenu(moduleCode) {
        try {
            const tenantId = this.tenantContextService.getCurrentTenantId();
            const userId = this.tenantContextService.getCurrentUserId();
            if (!tenantId || !userId) {
                this.logger.warn('No tenant or user context available');
                return false;
            }
            return await this.permissionService.hasPermission(userId, tenantId, moduleCode, 'ViewMenu');
        }
        catch (error) {
            this.logger.error(`Error checking Ver_Menu permission for module ${moduleCode}:`, error);
            return false;
        }
    }
    async getVisibleModulesForCurrentUser() {
        try {
            const tenantId = this.tenantContextService.getCurrentTenantId();
            const userId = this.tenantContextService.getCurrentUserId();
            if (!tenantId || !userId) {
                this.logger.warn('No tenant or user context available');
                return [];
            }
            const { modules } = await this.moduleService.getEnabledModulesForCurrentTenant();
            const visibleModules = [];
            for (const module of modules) {
                const hasViewPermission = await this.permissionService.hasPermission(userId, tenantId, module.code, 'ViewMenu');
                const userPermissions = await this.permissionService.getUserPermissions(userId, tenantId);
                const modulePermissions = userPermissions
                    .filter(p => p.entity_type?.toLowerCase() === module.code.toLowerCase())
                    .map(p => p.action);
                visibleModules.push({
                    moduleCode: module.code,
                    moduleName: module.name,
                    hasViewPermission,
                    permissions: modulePermissions,
                });
            }
            return visibleModules;
        }
        catch (error) {
            this.logger.error('Error getting visible modules:', error);
            return [];
        }
    }
    async getAuthorizedMenuStructure() {
        try {
            const visibleModules = await this.getVisibleModulesForCurrentUser();
            const authorizedModules = visibleModules
                .filter(m => m.hasViewPermission)
                .map(m => ({
                code: m.moduleCode,
                name: m.moduleName,
                permissions: m.permissions,
            }));
            this.logger.debug(`User has access to ${authorizedModules.length} menu items`);
            return { modules: authorizedModules };
        }
        catch (error) {
            this.logger.error('Error getting authorized menu structure:', error);
            return { modules: [] };
        }
    }
    async checkMultipleMenuPermissions(moduleCodes) {
        const results = new Map();
        for (const moduleCode of moduleCodes) {
            const hasPermission = await this.canViewMenu(moduleCode);
            results.set(moduleCode, hasPermission);
        }
        return results;
    }
    async canViewMenuInCurrentContext(moduleCode) {
        return this.canViewMenu(moduleCode);
    }
};
exports.MenuPermissionService = MenuPermissionService;
exports.MenuPermissionService = MenuPermissionService = MenuPermissionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [permission_service_1.PermissionService,
        tenant_context_service_1.TenantContextService,
        module_service_1.ModuleService])
], MenuPermissionService);
//# sourceMappingURL=menu-permission.service.js.map