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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModulesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const permission_guard_1 = require("../guards/permission.guard");
const require_permissions_decorator_1 = require("../decorators/require-permissions.decorator");
const module_service_1 = require("../services/module.service");
const menu_permission_service_1 = require("../services/menu-permission.service");
let ModulesController = class ModulesController {
    moduleService;
    menuPermissionService;
    constructor(moduleService, menuPermissionService) {
        this.moduleService = moduleService;
        this.menuPermissionService = menuPermissionService;
    }
    async getEnabledModules() {
        return await this.moduleService.getEnabledModulesForCurrentTenant();
    }
    async getVisibleMenuItems() {
        return await this.menuPermissionService.getAuthorizedMenuStructure();
    }
    async getMenuPermissions() {
        return await this.menuPermissionService.getVisibleModulesForCurrentUser();
    }
};
exports.ModulesController = ModulesController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Lead', action: 'Read' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get enabled modules for current tenant',
        description: 'Returns all modules enabled for the current tenant with their available permissions',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of enabled modules with permissions',
        schema: {
            example: {
                modules: [
                    {
                        id: 'uuid',
                        name: 'Leads',
                        code: 'leads',
                        description: 'Lead management module',
                        is_enabled: true,
                        permissions: [
                            { id: 'uuid', action: 'Create', description: 'Create new leads' },
                            { id: 'uuid', action: 'Read', description: 'View leads' },
                            { id: 'uuid', action: 'Update', description: 'Update leads' },
                            { id: 'uuid', action: 'Delete', description: 'Delete leads' },
                        ],
                    },
                ],
            },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ModulesController.prototype, "getEnabledModules", null);
__decorate([
    (0, common_1.Get)('visible-menu'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener items de menú visibles para el usuario actual',
        description: 'Retorna solo los módulos que el usuario actual tiene permiso Ver_Menu. Use este endpoint para construir la navegación del sidebar.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Lista de módulos visibles en el menú para el usuario actual',
        schema: {
            example: {
                modules: [
                    {
                        code: 'customers',
                        name: 'Customers',
                        description: 'Customer management module',
                        permissions: ['Create', 'Read', 'Update', 'Delete', 'Ver_Menu'],
                    },
                    {
                        code: 'leads',
                        name: 'Leads',
                        description: 'Lead management module',
                        permissions: ['Read', 'Ver_Menu'],
                    },
                ],
            },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ModulesController.prototype, "getVisibleMenuItems", null);
__decorate([
    (0, common_1.Get)('menu-permissions'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener permisos de menú detallados para el usuario actual',
        description: 'Retorna todos los módulos habilitados con el estado del permiso Ver_Menu y permisos disponibles',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Permisos de menú detallados para todos los módulos',
        schema: {
            example: [
                {
                    moduleCode: 'customers',
                    moduleName: 'Customers',
                    hasViewPermission: true,
                    permissions: ['Create', 'Read', 'Update', 'Delete', 'Ver_Menu'],
                },
                {
                    moduleCode: 'reports',
                    moduleName: 'Reports',
                    hasViewPermission: false,
                    permissions: [],
                },
            ],
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ModulesController.prototype, "getMenuPermissions", null);
exports.ModulesController = ModulesController = __decorate([
    (0, swagger_1.ApiTags)('Tenant - Modules'),
    (0, common_1.Controller)('tenant/modules'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [module_service_1.ModuleService,
        menu_permission_service_1.MenuPermissionService])
], ModulesController);
//# sourceMappingURL=modules.controller.js.map