export declare enum RBACErrorCategory {
    AUTHENTICATION = "AUTHENTICATION",
    AUTHORIZATION = "AUTHORIZATION",
    VALIDATION = "VALIDATION",
    SYSTEM = "SYSTEM",
    TENANT = "TENANT",
    ROLE = "ROLE",
    PERMISSION = "PERMISSION",
    CACHE = "CACHE"
}
export declare enum RBACErrorCode {
    AUTH_TOKEN_MISSING = "AUTH_TOKEN_MISSING",
    AUTH_TOKEN_INVALID = "AUTH_TOKEN_INVALID",
    AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED",
    AUTH_USER_NOT_FOUND = "AUTH_USER_NOT_FOUND",
    AUTH_CONTEXT_REQUIRED = "AUTH_CONTEXT_REQUIRED",
    PERMISSION_DENIED = "PERMISSION_DENIED",
    CROSS_TENANT_ACCESS_DENIED = "CROSS_TENANT_ACCESS_DENIED",
    CROSS_USER_ACCESS_DENIED = "CROSS_USER_ACCESS_DENIED",
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
    ROLE_ACCESS_DENIED = "ROLE_ACCESS_DENIED",
    INVALID_ENTITY_TYPE = "INVALID_ENTITY_TYPE",
    INVALID_ACTION_TYPE = "INVALID_ACTION_TYPE",
    INVALID_ROLE_DATA = "INVALID_ROLE_DATA",
    INVALID_PERMISSION_DATA = "INVALID_PERMISSION_DATA",
    INVALID_TENANT_DATA = "INVALID_TENANT_DATA",
    MALFORMED_REQUEST = "MALFORMED_REQUEST",
    ROLE_ALREADY_EXISTS = "ROLE_ALREADY_EXISTS",
    PERMISSION_ALREADY_EXISTS = "PERMISSION_ALREADY_EXISTS",
    USER_ROLE_ALREADY_EXISTS = "USER_ROLE_ALREADY_EXISTS",
    ROLE_PERMISSION_ALREADY_EXISTS = "ROLE_PERMISSION_ALREADY_EXISTS",
    TENANT_ALREADY_EXISTS = "TENANT_ALREADY_EXISTS",
    ROLE_NOT_FOUND = "ROLE_NOT_FOUND",
    PERMISSION_NOT_FOUND = "PERMISSION_NOT_FOUND",
    USER_ROLE_NOT_FOUND = "USER_ROLE_NOT_FOUND",
    TENANT_NOT_FOUND = "TENANT_NOT_FOUND",
    ENTITY_NOT_FOUND = "ENTITY_NOT_FOUND",
    DATABASE_CONNECTION_FAILED = "DATABASE_CONNECTION_FAILED",
    CACHE_SERVICE_UNAVAILABLE = "CACHE_SERVICE_UNAVAILABLE",
    ENTITY_REGISTRY_UNAVAILABLE = "ENTITY_REGISTRY_UNAVAILABLE",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
    MIGRATION_FAILED = "MIGRATION_FAILED"
}
export declare enum RBACErrorSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export interface RBACErrorDetails {
    code: RBACErrorCode;
    category: RBACErrorCategory;
    severity: RBACErrorSeverity;
    message: string;
    userMessage?: string;
    context?: Record<string, any>;
    suggestions?: string[];
    timestamp: Date;
}
export interface PermissionErrorDetails extends RBACErrorDetails {
    requiredPermission?: {
        entityType: string;
        action: string;
    };
    userPermissions?: string[];
    tenantId?: string;
    userId?: string;
}
export interface RoleErrorDetails extends RBACErrorDetails {
    roleId?: string;
    roleName?: string;
    tenantId?: string;
    conflictingRoles?: string[];
}
export interface TenantErrorDetails extends RBACErrorDetails {
    tenantId?: string;
    tenantName?: string;
    requestedTenantId?: string;
}
export interface SystemErrorDetails extends RBACErrorDetails {
    service?: string;
    operation?: string;
    stackTrace?: string;
    correlationId?: string;
}
