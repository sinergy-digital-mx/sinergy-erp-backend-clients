"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RBACModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const permission_entity_1 = require("../../entities/rbac/permission.entity");
const role_entity_1 = require("../../entities/rbac/role.entity");
const user_role_entity_1 = require("../../entities/rbac/user-role.entity");
const role_permission_entity_1 = require("../../entities/rbac/role-permission.entity");
const tenant_entity_1 = require("../../entities/rbac/tenant.entity");
const audit_log_entity_1 = require("../../entities/rbac/audit-log.entity");
const module_entity_1 = require("../../entities/rbac/module.entity");
const tenant_module_entity_1 = require("../../entities/rbac/tenant-module.entity");
const entity_registry_entity_1 = require("../../entities/entity-registry/entity-registry.entity");
const user_entity_1 = require("../../entities/users/user.entity");
const user_status_entity_1 = require("../../entities/users/user-status.entity");
const permission_service_1 = require("./services/permission.service");
const role_service_1 = require("./services/role.service");
const role_template_service_1 = require("./services/role-template.service");
const tenant_context_service_1 = require("./services/tenant-context.service");
const tenant_service_1 = require("./services/tenant.service");
const module_service_1 = require("./services/module.service");
const menu_permission_service_1 = require("./services/menu-permission.service");
const permission_cache_service_1 = require("./services/permission-cache.service");
const permission_version_service_1 = require("./services/permission-version.service");
const query_cache_service_1 = require("./services/query-cache.service");
const audit_log_service_1 = require("./services/audit-log.service");
const migration_service_1 = require("./services/migration.service");
const data_cleanup_service_1 = require("./services/data-cleanup.service");
const permission_guard_1 = require("./guards/permission.guard");
const tenant_controller_1 = require("./controllers/tenant.controller");
const audit_log_controller_1 = require("./controllers/audit-log.controller");
const data_cleanup_controller_1 = require("./controllers/data-cleanup.controller");
const modules_controller_1 = require("./controllers/modules.controller");
const roles_controller_1 = require("./controllers/roles.controller");
const admin_tenant_modules_controller_1 = require("./controllers/admin-tenant-modules.controller");
const error_handler_service_1 = require("./errors/error-handler.service");
const rbac_exception_filter_1 = require("./filters/rbac-exception.filter");
const tenant_context_middleware_1 = require("./middleware/tenant-context.middleware");
const rbac_config_1 = __importDefault(require("./config/rbac.config"));
let RBACModule = RBACModule_1 = class RBACModule {
    static forRoot(options) {
        return {
            module: RBACModule_1,
            providers: [
                {
                    provide: 'RBAC_OPTIONS',
                    useValue: {
                        enableCaching: true,
                        cacheTTL: 300,
                        enableAuditLogging: true,
                        enableRoleTemplates: true,
                        customRoleTemplates: [],
                        ...options,
                    },
                },
            ],
            exports: [
                'RBAC_OPTIONS',
                permission_service_1.PermissionService,
                role_service_1.RoleService,
                role_template_service_1.RoleTemplateService,
                tenant_context_service_1.TenantContextService,
                tenant_service_1.TenantService,
                permission_cache_service_1.PermissionCacheService,
                permission_version_service_1.PermissionVersionService,
                query_cache_service_1.QueryCacheService,
                audit_log_service_1.AuditLogService,
                migration_service_1.MigrationService,
                data_cleanup_service_1.DataCleanupService,
                permission_guard_1.PermissionGuard,
                error_handler_service_1.RBACErrorHandlerService,
                rbac_exception_filter_1.RBACExceptionFilter,
                tenant_context_middleware_1.TenantContextMiddleware,
            ],
        };
    }
    static forFeature() {
        return {
            module: RBACModule_1,
            exports: [
                permission_service_1.PermissionService,
                role_service_1.RoleService,
                tenant_context_service_1.TenantContextService,
                permission_guard_1.PermissionGuard,
                error_handler_service_1.RBACErrorHandlerService,
            ],
        };
    }
};
exports.RBACModule = RBACModule;
exports.RBACModule = RBACModule = RBACModule_1 = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                permission_entity_1.Permission,
                role_entity_1.Role,
                user_role_entity_1.UserRole,
                role_permission_entity_1.RolePermission,
                tenant_entity_1.RBACTenant,
                audit_log_entity_1.AuditLog,
                module_entity_1.Module,
                tenant_module_entity_1.TenantModule,
                entity_registry_entity_1.EntityRegistry,
                user_entity_1.User,
                user_status_entity_1.UserStatus,
            ]),
            jwt_1.JwtModule.register({}),
            config_1.ConfigModule.forFeature(rbac_config_1.default),
            schedule_1.ScheduleModule.forRoot(),
        ],
        controllers: [
            tenant_controller_1.TenantController,
            audit_log_controller_1.AuditLogController,
            data_cleanup_controller_1.DataCleanupController,
            modules_controller_1.ModulesController,
            roles_controller_1.RolesController,
            admin_tenant_modules_controller_1.AdminTenantModulesController,
        ],
        providers: [
            permission_service_1.PermissionService,
            role_service_1.RoleService,
            role_template_service_1.RoleTemplateService,
            tenant_context_service_1.TenantContextService,
            tenant_service_1.TenantService,
            module_service_1.ModuleService,
            menu_permission_service_1.MenuPermissionService,
            permission_cache_service_1.PermissionCacheService,
            permission_version_service_1.PermissionVersionService,
            query_cache_service_1.QueryCacheService,
            audit_log_service_1.AuditLogService,
            migration_service_1.MigrationService,
            data_cleanup_service_1.DataCleanupService,
            permission_guard_1.PermissionGuard,
            error_handler_service_1.RBACErrorHandlerService,
            rbac_exception_filter_1.RBACExceptionFilter,
            tenant_context_middleware_1.TenantContextMiddleware,
        ],
        exports: [
            permission_service_1.PermissionService,
            role_service_1.RoleService,
            role_template_service_1.RoleTemplateService,
            tenant_context_service_1.TenantContextService,
            tenant_service_1.TenantService,
            module_service_1.ModuleService,
            menu_permission_service_1.MenuPermissionService,
            permission_cache_service_1.PermissionCacheService,
            permission_version_service_1.PermissionVersionService,
            query_cache_service_1.QueryCacheService,
            audit_log_service_1.AuditLogService,
            migration_service_1.MigrationService,
            data_cleanup_service_1.DataCleanupService,
            permission_guard_1.PermissionGuard,
            error_handler_service_1.RBACErrorHandlerService,
            rbac_exception_filter_1.RBACExceptionFilter,
            tenant_context_middleware_1.TenantContextMiddleware,
            typeorm_1.TypeOrmModule,
        ],
    })
], RBACModule);
//# sourceMappingURL=rbac.module.js.map