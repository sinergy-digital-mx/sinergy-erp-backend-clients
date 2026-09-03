"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACErrorUtils = void 0;
exports.HandleRBACErrors = HandleRBACErrors;
exports.isRetryableError = isRetryableError;
exports.getRetryDelay = getRetryDelay;
const rbac_error_types_1 = require("./rbac-error.types");
const rbac_exceptions_1 = require("./rbac-exceptions");
class RBACErrorUtils {
    static throwPermissionDenied(entityType, action, userId, tenantId, userPermissions) {
        throw (0, rbac_exceptions_1.createPermissionDeniedException)(entityType, action, userId, tenantId, userPermissions);
    }
    static throwCrossTenantAccessDenied(requestedTenantId, currentTenantId, userId) {
        throw (0, rbac_exceptions_1.createCrossTenantAccessDeniedException)(requestedTenantId, currentTenantId, userId);
    }
    static throwInvalidEntityType(entityType, availableEntities) {
        throw (0, rbac_exceptions_1.createInvalidEntityTypeException)(entityType, availableEntities);
    }
    static throwRoleNotFound(roleId, tenantId) {
        throw (0, rbac_exceptions_1.createRoleNotFoundException)(roleId, tenantId);
    }
    static throwRoleAlreadyExists(roleName, tenantId, existingRoleId) {
        throw (0, rbac_exceptions_1.createRoleAlreadyExistsException)(roleName, tenantId, existingRoleId);
    }
    static throwTenantNotFound(tenantId) {
        throw (0, rbac_exceptions_1.createTenantNotFoundException)(tenantId);
    }
    static throwAuthenticationRequired(reason) {
        throw (0, rbac_exceptions_1.createAuthenticationRequiredException)(reason);
    }
    static throwSystemError(service, operation, originalError) {
        throw (0, rbac_exceptions_1.createSystemErrorException)(service, operation, originalError);
    }
    static throwInvalidActionType(action, supportedActions) {
        throw new rbac_exceptions_1.RBACValidationException(rbac_error_types_1.RBACErrorCode.INVALID_ACTION_TYPE, {
            invalidAction: action,
            supportedActions,
        });
    }
    static throwPermissionNotFound(permissionId, entityType, action) {
        throw new rbac_exceptions_1.RBACNotFoundException(rbac_error_types_1.RBACErrorCode.PERMISSION_NOT_FOUND, {
            permissionId,
            entityType,
            action,
        });
    }
    static throwUserRoleNotFound(userId, roleId, tenantId) {
        throw new rbac_exceptions_1.RBACNotFoundException(rbac_error_types_1.RBACErrorCode.USER_ROLE_NOT_FOUND, {
            userId,
            roleId,
            tenantId,
        });
    }
    static throwPermissionAlreadyExists(entityType, action, existingPermissionId) {
        throw new rbac_exceptions_1.RBACConflictException(rbac_error_types_1.RBACErrorCode.PERMISSION_ALREADY_EXISTS, {
            entityType,
            action,
            existingPermissionId,
        });
    }
    static throwUserRoleAlreadyExists(userId, roleId, tenantId, roleName) {
        throw new rbac_exceptions_1.RBACConflictException(rbac_error_types_1.RBACErrorCode.USER_ROLE_ALREADY_EXISTS, {
            userId,
            roleId,
            tenantId,
            roleName,
        });
    }
    static throwRolePermissionAlreadyExists(roleId, permissionId, entityType, action) {
        throw new rbac_exceptions_1.RBACConflictException(rbac_error_types_1.RBACErrorCode.ROLE_PERMISSION_ALREADY_EXISTS, {
            roleId,
            permissionId,
            entityType,
            action,
        });
    }
    static throwTenantAlreadyExists(tenantName, subdomain, existingTenantId) {
        throw new rbac_exceptions_1.RBACConflictException(rbac_error_types_1.RBACErrorCode.TENANT_ALREADY_EXISTS, {
            tenantName,
            subdomain,
            existingTenantId,
        });
    }
    static throwDatabaseConnectionFailed(operation, originalError) {
        throw new rbac_exceptions_1.RBACSystemException(rbac_error_types_1.RBACErrorCode.DATABASE_CONNECTION_FAILED, {
            operation,
            originalError: originalError?.message,
            stackTrace: originalError?.stack,
        });
    }
    static throwCacheServiceUnavailable(operation, originalError) {
        throw new rbac_exceptions_1.RBACSystemException(rbac_error_types_1.RBACErrorCode.CACHE_SERVICE_UNAVAILABLE, {
            operation,
            originalError: originalError?.message,
        });
    }
    static throwEntityRegistryUnavailable(operation, originalError) {
        throw new rbac_exceptions_1.RBACSystemException(rbac_error_types_1.RBACErrorCode.ENTITY_REGISTRY_UNAVAILABLE, {
            operation,
            originalError: originalError?.message,
        });
    }
    static throwMigrationFailed(migrationName, originalError) {
        throw new rbac_exceptions_1.RBACSystemException(rbac_error_types_1.RBACErrorCode.MIGRATION_FAILED, {
            migrationName,
            originalError: originalError?.message,
            stackTrace: originalError?.stack,
        });
    }
    static isRBACException(error) {
        return error instanceof rbac_exceptions_1.RBACException;
    }
    static isErrorCode(error, code) {
        return this.isRBACException(error) && error.code === code;
    }
    static isErrorCategory(error, category) {
        return this.isRBACException(error) && error.category === category;
    }
    static isErrorSeverity(error, severity) {
        return this.isRBACException(error) && error.severity === severity;
    }
    static extractErrorDetails(error) {
        if (!this.isRBACException(error)) {
            return {
                message: error?.message || 'Unknown error',
            };
        }
        return {
            code: error.code,
            category: error.category,
            severity: error.severity,
            message: error.message,
            context: error.context,
        };
    }
    static async wrapWithErrorHandling(operation, service, operationName) {
        try {
            return await operation();
        }
        catch (error) {
            if (this.isRBACException(error)) {
                throw error;
            }
            throw (0, rbac_exceptions_1.createSystemErrorException)(service, operationName, error);
        }
    }
    static throwValidationError(validationErrors) {
        throw new rbac_exceptions_1.RBACValidationException(rbac_error_types_1.RBACErrorCode.MALFORMED_REQUEST, {
            validationErrors,
        });
    }
    static throwTokenError(tokenError) {
        const errorCodeMap = {
            missing: rbac_error_types_1.RBACErrorCode.AUTH_TOKEN_MISSING,
            invalid: rbac_error_types_1.RBACErrorCode.AUTH_TOKEN_INVALID,
            expired: rbac_error_types_1.RBACErrorCode.AUTH_TOKEN_EXPIRED,
        };
        throw new rbac_exceptions_1.RBACAuthenticationException(errorCodeMap[tokenError]);
    }
    static throwUserNotFound(userId) {
        throw new rbac_exceptions_1.RBACAuthenticationException(rbac_error_types_1.RBACErrorCode.AUTH_USER_NOT_FOUND, {
            userId,
        });
    }
}
exports.RBACErrorUtils = RBACErrorUtils;
function HandleRBACErrors(service) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = async function (...args) {
            return RBACErrorUtils.wrapWithErrorHandling(() => method.apply(this, args), service, propertyName);
        };
    };
}
function isRetryableError(error) {
    if (!RBACErrorUtils.isRBACException(error)) {
        return false;
    }
    return (error.category === rbac_error_types_1.RBACErrorCategory.SYSTEM &&
        error.code !== rbac_error_types_1.RBACErrorCode.MIGRATION_FAILED);
}
function getRetryDelay(error, attempt) {
    if (!isRetryableError(error)) {
        return 0;
    }
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    const jitter = delay * 0.25 * (Math.random() - 0.5);
    return Math.max(0, delay + jitter);
}
//# sourceMappingURL=error-utils.js.map