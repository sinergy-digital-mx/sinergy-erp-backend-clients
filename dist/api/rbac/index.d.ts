export * from './rbac.module';
export * from './services/permission.service';
export * from './services/role.service';
export * from './services/role-template.service';
export * from './services/tenant-context.service';
export * from './services/tenant.service';
export * from './services/permission-cache.service';
export * from './services/query-cache.service';
export * from './services/audit-log.service';
export * from './services/migration.service';
export * from './services/data-cleanup.service';
export * from './guards';
export * from './decorators';
export * from './errors';
export * from './middleware/tenant-context.middleware';
export * from './controllers/tenant.controller';
export * from './controllers/audit-log.controller';
export * from './controllers/data-cleanup.controller';
export * from './templates';
export { default as rbacConfig } from './config/rbac.config';
export * from './filters/rbac-exception.filter';
export { Permission } from '../../entities/rbac/permission.entity';
export { Role } from '../../entities/rbac/role.entity';
export { UserRole } from '../../entities/rbac/user-role.entity';
export { RolePermission } from '../../entities/rbac/role-permission.entity';
export { RBACTenant } from '../../entities/rbac/tenant.entity';
export { AuditLog } from '../../entities/rbac/audit-log.entity';
export interface RBACModuleOptions {
    enableCaching?: boolean;
    cacheTTL?: number;
    enableAuditLogging?: boolean;
    enableRoleTemplates?: boolean;
    customRoleTemplates?: any[];
}
export interface RBACHealthStatus {
    status: 'healthy' | 'degraded' | 'critical';
    services: {
        database: 'healthy' | 'degraded' | 'critical';
        cache: 'healthy' | 'degraded' | 'critical';
        entityRegistry: 'healthy' | 'degraded' | 'critical';
    };
    issues: string[];
    timestamp: string;
}
export interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    evictions: number;
    size: number;
}
export declare class RBACUtils {
    static createPermissionString(entityType: string, action: string): string;
    static parsePermissionString(permissionString: string): {
        entityType: string;
        action: string;
    };
    static isValidPermissionString(permissionString: string): boolean;
    static generateRoleName(templateName: string, tenantName?: string): string;
    static isSystemRole(roleName: string): boolean;
    static normalizeEntityType(entityType: string): string;
    static normalizeAction(action: string): string;
}
export declare const RBAC_CONSTANTS: {
    readonly DEFAULT_CACHE_TTL: 300;
    readonly MAX_ROLES_PER_USER: 50;
    readonly MAX_PERMISSIONS_PER_ROLE: 200;
    readonly SYSTEM_ROLES: {
        readonly ADMIN: "Admin";
        readonly OPERATOR: "Operator";
        readonly VIEWER: "Viewer";
    };
    readonly ENTITY_TYPES: {
        readonly USER: "User";
        readonly CUSTOMER: "Customer";
        readonly LEAD: "Lead";
        readonly ORDER: "Order";
        readonly PRODUCT: "Product";
        readonly INVOICE: "Invoice";
        readonly REPORT: "Report";
    };
    readonly ACTIONS: {
        readonly CREATE: "Create";
        readonly READ: "Read";
        readonly UPDATE: "Update";
        readonly DELETE: "Delete";
        readonly EXPORT: "Export";
        readonly IMPORT: "Import";
        readonly DOWNLOAD_REPORT: "Download_Report";
        readonly BULK_UPDATE: "Bulk_Update";
        readonly BULK_DELETE: "Bulk_Delete";
    };
    readonly HEADERS: {
        readonly TENANT_ID: "X-Tenant-ID";
        readonly USER_ID: "X-User-ID";
    };
    readonly METADATA_KEYS: {
        readonly PERMISSIONS: "permissions";
        readonly ROLES: "roles";
        readonly TENANT_REQUIRED: "tenant_required";
    };
};
