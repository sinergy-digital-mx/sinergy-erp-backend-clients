import { PermissionService } from './services/permission.service';
import { RoleService } from './services/role.service';
import { RoleTemplateService } from './services/role-template.service';
import { TenantContextService } from './services/tenant-context.service';
import { TenantService } from './services/tenant.service';
import { PermissionCacheService } from './services/permission-cache.service';
import { PermissionVersionService } from './services/permission-version.service';
import { QueryCacheService } from './services/query-cache.service';
import { AuditLogService } from './services/audit-log.service';
import { MigrationService } from './services/migration.service';
import { DataCleanupService } from './services/data-cleanup.service';
import { PermissionGuard } from './guards/permission.guard';
import { RBACErrorHandlerService } from './errors/error-handler.service';
import { RBACExceptionFilter } from './filters/rbac-exception.filter';
import { TenantContextMiddleware } from './middleware/tenant-context.middleware';
export declare class RBACModule {
    static forRoot(options?: {
        enableCaching?: boolean;
        cacheTTL?: number;
        enableAuditLogging?: boolean;
        enableRoleTemplates?: boolean;
        customRoleTemplates?: any[];
    }): {
        module: typeof RBACModule;
        providers: {
            provide: string;
            useValue: {
                enableCaching: boolean;
                cacheTTL: number;
                enableAuditLogging: boolean;
                enableRoleTemplates: boolean;
                customRoleTemplates: any[];
            };
        }[];
        exports: (string | typeof PermissionGuard | typeof PermissionService | typeof RoleService | typeof RoleTemplateService | typeof TenantContextService | typeof TenantService | typeof PermissionCacheService | typeof PermissionVersionService | typeof QueryCacheService | typeof AuditLogService | typeof MigrationService | typeof DataCleanupService | typeof RBACErrorHandlerService | typeof RBACExceptionFilter | typeof TenantContextMiddleware)[];
    };
    static forFeature(): {
        module: typeof RBACModule;
        exports: (typeof PermissionGuard | typeof PermissionService | typeof RoleService | typeof TenantContextService | typeof RBACErrorHandlerService)[];
    };
}
