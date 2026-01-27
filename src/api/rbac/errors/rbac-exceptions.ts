/**
 * RBAC Custom Exceptions
 * 
 * Custom exception classes that extend NestJS built-in exceptions
 * with RBAC-specific error details and consistent formatting.
 */

import {
  HttpException,
  HttpStatus,
  UnauthorizedException as NestUnauthorizedException,
  ForbiddenException as NestForbiddenException,
  BadRequestException as NestBadRequestException,
  NotFoundException as NestNotFoundException,
  ConflictException as NestConflictException,
  InternalServerErrorException as NestInternalServerErrorException,
} from '@nestjs/common';

import {
  RBACErrorCode,
  RBACErrorCategory,
  RBACErrorSeverity,
  PermissionErrorDetails,
  RoleErrorDetails,
  TenantErrorDetails,
  SystemErrorDetails,
} from './rbac-error.types';
import { RBACErrorResponse } from './error-response.interface';
import { getErrorMessage } from './error-messages';

/**
 * Base RBAC Exception class that all other RBAC exceptions extend
 */
export abstract class RBACException extends HttpException {
  public readonly code: RBACErrorCode;
  public readonly category: RBACErrorCategory;
  public readonly severity: RBACErrorSeverity;
  public readonly correlationId?: string;
  public readonly context?: Record<string, any>;

  constructor(
    code: RBACErrorCode,
    category: RBACErrorCategory,
    severity: RBACErrorSeverity,
    statusCode: HttpStatus,
    context?: Record<string, any>,
    correlationId?: string,
  ) {
    const errorMessage = getErrorMessage(code);
    
    const response: RBACErrorResponse = {
      statusCode,
      error: HttpException.createBody('', '', statusCode).error || 'Unknown Error',
      message: errorMessage.technical,
      code,
      category,
      severity,
      suggestions: errorMessage.suggestions,
      timestamp: new Date().toISOString(),
      path: '', // Will be set by the exception filter
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

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(): string {
    return getErrorMessage(this.code).userFriendly;
  }

  /**
   * Get error suggestions
   */
  getSuggestions(): string[] {
    return getErrorMessage(this.code).suggestions;
  }
}

/**
 * Authentication-related exceptions (401 Unauthorized)
 */
export class RBACAuthenticationException extends RBACException {
  constructor(
    code: RBACErrorCode,
    context?: Record<string, any>,
    correlationId?: string,
  ) {
    super(
      code,
      RBACErrorCategory.AUTHENTICATION,
      RBACErrorSeverity.MEDIUM,
      HttpStatus.UNAUTHORIZED,
      context,
      correlationId,
    );
  }
}

/**
 * Authorization-related exceptions (403 Forbidden)
 */
export class RBACAuthorizationException extends RBACException {
  constructor(
    code: RBACErrorCode,
    context?: PermissionErrorDetails['context'],
    correlationId?: string,
  ) {
    super(
      code,
      RBACErrorCategory.AUTHORIZATION,
      RBACErrorSeverity.MEDIUM,
      HttpStatus.FORBIDDEN,
      context,
      correlationId,
    );
  }
}

/**
 * Validation-related exceptions (400 Bad Request)
 */
export class RBACValidationException extends RBACException {
  constructor(
    code: RBACErrorCode,
    context?: Record<string, any>,
    correlationId?: string,
  ) {
    super(
      code,
      RBACErrorCategory.VALIDATION,
      RBACErrorSeverity.LOW,
      HttpStatus.BAD_REQUEST,
      context,
      correlationId,
    );
  }
}

/**
 * Resource not found exceptions (404 Not Found)
 */
export class RBACNotFoundException extends RBACException {
  constructor(
    code: RBACErrorCode,
    context?: Record<string, any>,
    correlationId?: string,
  ) {
    super(
      code,
      RBACErrorCategory.VALIDATION,
      RBACErrorSeverity.LOW,
      HttpStatus.NOT_FOUND,
      context,
      correlationId,
    );
  }
}

/**
 * Conflict exceptions (409 Conflict)
 */
export class RBACConflictException extends RBACException {
  constructor(
    code: RBACErrorCode,
    context?: Record<string, any>,
    correlationId?: string,
  ) {
    super(
      code,
      RBACErrorCategory.VALIDATION,
      RBACErrorSeverity.LOW,
      HttpStatus.CONFLICT,
      context,
      correlationId,
    );
  }
}

/**
 * System-related exceptions (500 Internal Server Error)
 */
export class RBACSystemException extends RBACException {
  constructor(
    code: RBACErrorCode,
    context?: SystemErrorDetails['context'],
    correlationId?: string,
  ) {
    super(
      code,
      RBACErrorCategory.SYSTEM,
      RBACErrorSeverity.HIGH,
      HttpStatus.INTERNAL_SERVER_ERROR,
      context,
      correlationId,
    );
  }
}

// Convenience factory functions for common exceptions

/**
 * Create a permission denied exception with detailed context
 */
export function createPermissionDeniedException(
  entityType: string,
  action: string,
  userId?: string,
  tenantId?: string,
  userPermissions?: string[],
  correlationId?: string,
): RBACAuthorizationException {
  return new RBACAuthorizationException(
    RBACErrorCode.PERMISSION_DENIED,
    {
      requiredPermission: { entityType, action },
      userId,
      tenantId,
      userPermissions,
    },
    correlationId,
  );
}

/**
 * Create a cross-tenant access denied exception
 */
export function createCrossTenantAccessDeniedException(
  requestedTenantId: string,
  currentTenantId: string,
  userId?: string,
  correlationId?: string,
): RBACAuthorizationException {
  return new RBACAuthorizationException(
    RBACErrorCode.CROSS_TENANT_ACCESS_DENIED,
    {
      requestedTenantId,
      tenantId: currentTenantId,
      userId,
    },
    correlationId,
  );
}

/**
 * Create an invalid entity type exception
 */
export function createInvalidEntityTypeException(
  entityType: string,
  availableEntities?: string[],
  correlationId?: string,
): RBACValidationException {
  return new RBACValidationException(
    RBACErrorCode.INVALID_ENTITY_TYPE,
    {
      invalidEntityType: entityType,
      availableEntities,
    },
    correlationId,
  );
}

/**
 * Create a role not found exception
 */
export function createRoleNotFoundException(
  roleId: string,
  tenantId?: string,
  correlationId?: string,
): RBACNotFoundException {
  return new RBACNotFoundException(
    RBACErrorCode.ROLE_NOT_FOUND,
    {
      roleId,
      tenantId,
    },
    correlationId,
  );
}

/**
 * Create a role already exists exception
 */
export function createRoleAlreadyExistsException(
  roleName: string,
  tenantId: string,
  existingRoleId?: string,
  correlationId?: string,
): RBACConflictException {
  return new RBACConflictException(
    RBACErrorCode.ROLE_ALREADY_EXISTS,
    {
      roleName,
      tenantId,
      existingRoleId,
    },
    correlationId,
  );
}

/**
 * Create a tenant not found exception
 */
export function createTenantNotFoundException(
  tenantId: string,
  correlationId?: string,
): RBACNotFoundException {
  return new RBACNotFoundException(
    RBACErrorCode.TENANT_NOT_FOUND,
    {
      tenantId,
    },
    correlationId,
  );
}

/**
 * Create an authentication required exception
 */
export function createAuthenticationRequiredException(
  reason?: string,
  correlationId?: string,
): RBACAuthenticationException {
  return new RBACAuthenticationException(
    RBACErrorCode.AUTH_CONTEXT_REQUIRED,
    {
      reason,
    },
    correlationId,
  );
}

/**
 * Create a system error exception
 */
export function createSystemErrorException(
  service: string,
  operation: string,
  originalError?: Error,
  correlationId?: string,
): RBACSystemException {
  return new RBACSystemException(
    RBACErrorCode.INTERNAL_SERVER_ERROR,
    {
      service,
      operation,
      originalError: originalError?.message,
      stackTrace: originalError?.stack,
    },
    correlationId,
  );
}