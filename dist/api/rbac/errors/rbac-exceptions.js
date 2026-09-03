"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACSystemException = exports.RBACConflictException = exports.RBACNotFoundException = exports.RBACValidationException = exports.RBACAuthorizationException = exports.RBACAuthenticationException = exports.RBACException = void 0;
exports.createPermissionDeniedException = createPermissionDeniedException;
exports.createCrossTenantAccessDeniedException = createCrossTenantAccessDeniedException;
exports.createInvalidEntityTypeException = createInvalidEntityTypeException;
exports.createRoleNotFoundException = createRoleNotFoundException;
exports.createRoleAlreadyExistsException = createRoleAlreadyExistsException;
exports.createTenantNotFoundException = createTenantNotFoundException;
exports.createAuthenticationRequiredException = createAuthenticationRequiredException;
exports.createSystemErrorException = createSystemErrorException;
const common_1 = require("@nestjs/common");
const rbac_error_types_1 = require("./rbac-error.types");
const error_messages_1 = require("./error-messages");
class RBACException extends common_1.HttpException {
    code;
    category;
    severity;
    correlationId;
    context;
    constructor(code, category, severity, statusCode, context, correlationId) {
        const errorMessage = (0, error_messages_1.getErrorMessage)(code);
        const response = {
            statusCode,
            error: common_1.HttpException.createBody('', '', statusCode).error || 'Unknown Error',
            message: errorMessage.technical,
            code,
            category,
            severity,
            suggestions: errorMessage.suggestions,
            timestamp: new Date().toISOString(),
            path: '',
            correlationId,
            details: context,
        };
        super(response, statusCode);
        this.code = code;
        this.category = category;
        this.severity = severity;
        this.correlationId = correlationId;
        this.context = context;
    }
    getUserFriendlyMessage() {
        return (0, error_messages_1.getErrorMessage)(this.code).userFriendly;
    }
    getSuggestions() {
        return (0, error_messages_1.getErrorMessage)(this.code).suggestions;
    }
}
exports.RBACException = RBACException;
class RBACAuthenticationException extends RBACException {
    constructor(code, context, correlationId) {
        super(code, rbac_error_types_1.RBACErrorCategory.AUTHENTICATION, rbac_error_types_1.RBACErrorSeverity.MEDIUM, common_1.HttpStatus.UNAUTHORIZED, context, correlationId);
    }
}
exports.RBACAuthenticationException = RBACAuthenticationException;
class RBACAuthorizationException extends RBACException {
    constructor(code, context, correlationId) {
        super(code, rbac_error_types_1.RBACErrorCategory.AUTHORIZATION, rbac_error_types_1.RBACErrorSeverity.MEDIUM, common_1.HttpStatus.FORBIDDEN, context, correlationId);
    }
}
exports.RBACAuthorizationException = RBACAuthorizationException;
class RBACValidationException extends RBACException {
    constructor(code, context, correlationId) {
        super(code, rbac_error_types_1.RBACErrorCategory.VALIDATION, rbac_error_types_1.RBACErrorSeverity.LOW, common_1.HttpStatus.BAD_REQUEST, context, correlationId);
    }
}
exports.RBACValidationException = RBACValidationException;
class RBACNotFoundException extends RBACException {
    constructor(code, context, correlationId) {
        super(code, rbac_error_types_1.RBACErrorCategory.VALIDATION, rbac_error_types_1.RBACErrorSeverity.LOW, common_1.HttpStatus.NOT_FOUND, context, correlationId);
    }
}
exports.RBACNotFoundException = RBACNotFoundException;
class RBACConflictException extends RBACException {
    constructor(code, context, correlationId) {
        super(code, rbac_error_types_1.RBACErrorCategory.VALIDATION, rbac_error_types_1.RBACErrorSeverity.LOW, common_1.HttpStatus.CONFLICT, context, correlationId);
    }
}
exports.RBACConflictException = RBACConflictException;
class RBACSystemException extends RBACException {
    constructor(code, context, correlationId) {
        super(code, rbac_error_types_1.RBACErrorCategory.SYSTEM, rbac_error_types_1.RBACErrorSeverity.HIGH, common_1.HttpStatus.INTERNAL_SERVER_ERROR, context, correlationId);
    }
}
exports.RBACSystemException = RBACSystemException;
function createPermissionDeniedException(entityType, action, userId, tenantId, userPermissions, correlationId) {
    return new RBACAuthorizationException(rbac_error_types_1.RBACErrorCode.PERMISSION_DENIED, {
        requiredPermission: { entityType, action },
        userId,
        tenantId,
        userPermissions,
    }, correlationId);
}
function createCrossTenantAccessDeniedException(requestedTenantId, currentTenantId, userId, correlationId) {
    return new RBACAuthorizationException(rbac_error_types_1.RBACErrorCode.CROSS_TENANT_ACCESS_DENIED, {
        requestedTenantId,
        tenantId: currentTenantId,
        userId,
    }, correlationId);
}
function createInvalidEntityTypeException(entityType, availableEntities, correlationId) {
    return new RBACValidationException(rbac_error_types_1.RBACErrorCode.INVALID_ENTITY_TYPE, {
        invalidEntityType: entityType,
        availableEntities,
    }, correlationId);
}
function createRoleNotFoundException(roleId, tenantId, correlationId) {
    return new RBACNotFoundException(rbac_error_types_1.RBACErrorCode.ROLE_NOT_FOUND, {
        roleId,
        tenantId,
    }, correlationId);
}
function createRoleAlreadyExistsException(roleName, tenantId, existingRoleId, correlationId) {
    return new RBACConflictException(rbac_error_types_1.RBACErrorCode.ROLE_ALREADY_EXISTS, {
        roleName,
        tenantId,
        existingRoleId,
    }, correlationId);
}
function createTenantNotFoundException(tenantId, correlationId) {
    return new RBACNotFoundException(rbac_error_types_1.RBACErrorCode.TENANT_NOT_FOUND, {
        tenantId,
    }, correlationId);
}
function createAuthenticationRequiredException(reason, correlationId) {
    return new RBACAuthenticationException(rbac_error_types_1.RBACErrorCode.AUTH_CONTEXT_REQUIRED, {
        reason,
    }, correlationId);
}
function createSystemErrorException(service, operation, originalError, correlationId) {
    return new RBACSystemException(rbac_error_types_1.RBACErrorCode.INTERNAL_SERVER_ERROR, {
        service,
        operation,
        originalError: originalError?.message,
        stackTrace: originalError?.stack,
    }, correlationId);
}
//# sourceMappingURL=rbac-exceptions.js.map