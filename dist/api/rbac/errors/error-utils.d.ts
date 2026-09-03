import { RBACErrorCode, RBACErrorCategory, RBACErrorSeverity } from './rbac-error.types';
import { RBACException } from './rbac-exceptions';
export declare class RBACErrorUtils {
    static throwPermissionDenied(entityType: string, action: string, userId?: string, tenantId?: string, userPermissions?: string[]): never;
    static throwCrossTenantAccessDenied(requestedTenantId: string, currentTenantId: string, userId?: string): never;
    static throwInvalidEntityType(entityType: string, availableEntities?: string[]): never;
    static throwRoleNotFound(roleId: string, tenantId?: string): never;
    static throwRoleAlreadyExists(roleName: string, tenantId: string, existingRoleId?: string): never;
    static throwTenantNotFound(tenantId: string): never;
    static throwAuthenticationRequired(reason?: string): never;
    static throwSystemError(service: string, operation: string, originalError?: Error): never;
    static throwInvalidActionType(action: string, supportedActions?: string[]): never;
    static throwPermissionNotFound(permissionId: string, entityType?: string, action?: string): never;
    static throwUserRoleNotFound(userId: string, roleId: string, tenantId: string): never;
    static throwPermissionAlreadyExists(entityType: string, action: string, existingPermissionId?: string): never;
    static throwUserRoleAlreadyExists(userId: string, roleId: string, tenantId: string, roleName?: string): never;
    static throwRolePermissionAlreadyExists(roleId: string, permissionId: string, entityType?: string, action?: string): never;
    static throwTenantAlreadyExists(tenantName: string, subdomain?: string, existingTenantId?: string): never;
    static throwDatabaseConnectionFailed(operation: string, originalError?: Error): never;
    static throwCacheServiceUnavailable(operation: string, originalError?: Error): never;
    static throwEntityRegistryUnavailable(operation: string, originalError?: Error): never;
    static throwMigrationFailed(migrationName: string, originalError?: Error): never;
    static isRBACException(error: any): error is RBACException;
    static isErrorCode(error: any, code: RBACErrorCode): boolean;
    static isErrorCategory(error: any, category: RBACErrorCategory): boolean;
    static isErrorSeverity(error: any, severity: RBACErrorSeverity): boolean;
    static extractErrorDetails(error: any): {
        code?: RBACErrorCode;
        category?: RBACErrorCategory;
        severity?: RBACErrorSeverity;
        message?: string;
        context?: Record<string, any>;
    };
    static wrapWithErrorHandling<T>(operation: () => Promise<T>, service: string, operationName: string): Promise<T>;
    static throwValidationError(validationErrors: Array<{
        field: string;
        message: string;
        value?: any;
    }>): never;
    static throwTokenError(tokenError: 'missing' | 'invalid' | 'expired'): never;
    static throwUserNotFound(userId?: string): never;
}
export declare function HandleRBACErrors(service: string): (target: any, propertyName: string, descriptor: PropertyDescriptor) => void;
export declare function isRetryableError(error: any): boolean;
export declare function getRetryDelay(error: any, attempt: number): number;
