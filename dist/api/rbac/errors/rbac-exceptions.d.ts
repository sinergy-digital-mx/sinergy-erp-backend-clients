import { HttpException, HttpStatus } from '@nestjs/common';
import { RBACErrorCode, RBACErrorCategory, RBACErrorSeverity, PermissionErrorDetails, SystemErrorDetails } from './rbac-error.types';
export declare abstract class RBACException extends HttpException {
    readonly code: RBACErrorCode;
    readonly category: RBACErrorCategory;
    readonly severity: RBACErrorSeverity;
    readonly correlationId?: string;
    readonly context?: Record<string, any>;
    constructor(code: RBACErrorCode, category: RBACErrorCategory, severity: RBACErrorSeverity, statusCode: HttpStatus, context?: Record<string, any>, correlationId?: string);
    getUserFriendlyMessage(): string;
    getSuggestions(): string[];
}
export declare class RBACAuthenticationException extends RBACException {
    constructor(code: RBACErrorCode, context?: Record<string, any>, correlationId?: string);
}
export declare class RBACAuthorizationException extends RBACException {
    constructor(code: RBACErrorCode, context?: PermissionErrorDetails['context'], correlationId?: string);
}
export declare class RBACValidationException extends RBACException {
    constructor(code: RBACErrorCode, context?: Record<string, any>, correlationId?: string);
}
export declare class RBACNotFoundException extends RBACException {
    constructor(code: RBACErrorCode, context?: Record<string, any>, correlationId?: string);
}
export declare class RBACConflictException extends RBACException {
    constructor(code: RBACErrorCode, context?: Record<string, any>, correlationId?: string);
}
export declare class RBACSystemException extends RBACException {
    constructor(code: RBACErrorCode, context?: SystemErrorDetails['context'], correlationId?: string);
}
export declare function createPermissionDeniedException(entityType: string, action: string, userId?: string, tenantId?: string, userPermissions?: string[], correlationId?: string): RBACAuthorizationException;
export declare function createCrossTenantAccessDeniedException(requestedTenantId: string, currentTenantId: string, userId?: string, correlationId?: string): RBACAuthorizationException;
export declare function createInvalidEntityTypeException(entityType: string, availableEntities?: string[], correlationId?: string): RBACValidationException;
export declare function createRoleNotFoundException(roleId: string, tenantId?: string, correlationId?: string): RBACNotFoundException;
export declare function createRoleAlreadyExistsException(roleName: string, tenantId: string, existingRoleId?: string, correlationId?: string): RBACConflictException;
export declare function createTenantNotFoundException(tenantId: string, correlationId?: string): RBACNotFoundException;
export declare function createAuthenticationRequiredException(reason?: string, correlationId?: string): RBACAuthenticationException;
export declare function createSystemErrorException(service: string, operation: string, originalError?: Error, correlationId?: string): RBACSystemException;
