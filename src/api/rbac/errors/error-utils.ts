/**
 * RBAC Error Utilities
 * 
 * Utility functions for common error handling scenarios in the RBAC system.
 * Provides convenient methods for creating and throwing specific RBAC exceptions.
 */

import {
  RBACErrorCode,
  RBACErrorCategory,
  RBACErrorSeverity,
} from './rbac-error.types';
import {
  RBACException,
  RBACAuthenticationException,
  RBACAuthorizationException,
  RBACValidationException,
  RBACNotFoundException,
  RBACConflictException,
  RBACSystemException,
  createPermissionDeniedException,
  createCrossTenantAccessDeniedException,
  createInvalidEntityTypeException,
  createRoleNotFoundException,
  createRoleAlreadyExistsException,
  createTenantNotFoundException,
  createAuthenticationRequiredException,
  createSystemErrorException,
} from './rbac-exceptions';

/**
 * Utility class for common RBAC error scenarios
 */
export class RBACErrorUtils {
  /**
   * Throw permission denied error with detailed context
   */
  static throwPermissionDenied(
    entityType: string,
    action: string,
    userId?: string,
    tenantId?: string,
    userPermissions?: string[],
  ): never {
    throw createPermissionDeniedException(
      entityType,
      action,
      userId,
      tenantId,
      userPermissions,
    );
  }

  /**
   * Throw cross-tenant access denied error
   */
  static throwCrossTenantAccessDenied(
    requestedTenantId: string,
    currentTenantId: string,
    userId?: string,
  ): never {
    throw createCrossTenantAccessDeniedException(
      requestedTenantId,
      currentTenantId,
      userId,
    );
  }

  /**
   * Throw invalid entity type error
   */
  static throwInvalidEntityType(
    entityType: string,
    availableEntities?: string[],
  ): never {
    throw createInvalidEntityTypeException(entityType, availableEntities);
  }

  /**
   * Throw role not found error
   */
  static throwRoleNotFound(roleId: string, tenantId?: string): never {
    throw createRoleNotFoundException(roleId, tenantId);
  }

  /**
   * Throw role already exists error
   */
  static throwRoleAlreadyExists(
    roleName: string,
    tenantId: string,
    existingRoleId?: string,
  ): never {
    throw createRoleAlreadyExistsException(roleName, tenantId, existingRoleId);
  }

  /**
   * Throw tenant not found error
   */
  static throwTenantNotFound(tenantId: string): never {
    throw createTenantNotFoundException(tenantId);
  }

  /**
   * Throw authentication required error
   */
  static throwAuthenticationRequired(reason?: string): never {
    throw createAuthenticationRequiredException(reason);
  }

  /**
   * Throw system error
   */
  static throwSystemError(
    service: string,
    operation: string,
    originalError?: Error,
  ): never {
    throw createSystemErrorException(service, operation, originalError);
  }

  /**
   * Throw invalid action type error
   */
  static throwInvalidActionType(
    action: string,
    supportedActions?: string[],
  ): never {
    throw new RBACValidationException(RBACErrorCode.INVALID_ACTION_TYPE, {
      invalidAction: action,
      supportedActions,
    });
  }

  /**
   * Throw permission not found error
   */
  static throwPermissionNotFound(
    permissionId: string,
    entityType?: string,
    action?: string,
  ): never {
    throw new RBACNotFoundException(RBACErrorCode.PERMISSION_NOT_FOUND, {
      permissionId,
      entityType,
      action,
    });
  }

  /**
   * Throw user role not found error
   */
  static throwUserRoleNotFound(
    userId: string,
    roleId: string,
    tenantId: string,
  ): never {
    throw new RBACNotFoundException(RBACErrorCode.USER_ROLE_NOT_FOUND, {
      userId,
      roleId,
      tenantId,
    });
  }

  /**
   * Throw permission already exists error
   */
  static throwPermissionAlreadyExists(
    entityType: string,
    action: string,
    existingPermissionId?: string,
  ): never {
    throw new RBACConflictException(RBACErrorCode.PERMISSION_ALREADY_EXISTS, {
      entityType,
      action,
      existingPermissionId,
    });
  }

  /**
   * Throw user role already exists error
   */
  static throwUserRoleAlreadyExists(
    userId: string,
    roleId: string,
    tenantId: string,
    roleName?: string,
  ): never {
    throw new RBACConflictException(RBACErrorCode.USER_ROLE_ALREADY_EXISTS, {
      userId,
      roleId,
      tenantId,
      roleName,
    });
  }

  /**
   * Throw role permission already exists error
   */
  static throwRolePermissionAlreadyExists(
    roleId: string,
    permissionId: string,
    entityType?: string,
    action?: string,
  ): never {
    throw new RBACConflictException(
      RBACErrorCode.ROLE_PERMISSION_ALREADY_EXISTS,
      {
        roleId,
        permissionId,
        entityType,
        action,
      },
    );
  }

  /**
   * Throw tenant already exists error
   */
  static throwTenantAlreadyExists(
    tenantName: string,
    subdomain?: string,
    existingTenantId?: string,
  ): never {
    throw new RBACConflictException(RBACErrorCode.TENANT_ALREADY_EXISTS, {
      tenantName,
      subdomain,
      existingTenantId,
    });
  }

  /**
   * Throw database connection failed error
   */
  static throwDatabaseConnectionFailed(
    operation: string,
    originalError?: Error,
  ): never {
    throw new RBACSystemException(RBACErrorCode.DATABASE_CONNECTION_FAILED, {
      operation,
      originalError: originalError?.message,
      stackTrace: originalError?.stack,
    });
  }

  /**
   * Throw cache service unavailable error
   */
  static throwCacheServiceUnavailable(
    operation: string,
    originalError?: Error,
  ): never {
    throw new RBACSystemException(RBACErrorCode.CACHE_SERVICE_UNAVAILABLE, {
      operation,
      originalError: originalError?.message,
    });
  }

  /**
   * Throw entity registry unavailable error
   */
  static throwEntityRegistryUnavailable(
    operation: string,
    originalError?: Error,
  ): never {
    throw new RBACSystemException(RBACErrorCode.ENTITY_REGISTRY_UNAVAILABLE, {
      operation,
      originalError: originalError?.message,
    });
  }

  /**
   * Throw migration failed error
   */
  static throwMigrationFailed(
    migrationName: string,
    originalError?: Error,
  ): never {
    throw new RBACSystemException(RBACErrorCode.MIGRATION_FAILED, {
      migrationName,
      originalError: originalError?.message,
      stackTrace: originalError?.stack,
    });
  }

  /**
   * Check if error is an RBAC exception
   */
  static isRBACException(error: any): error is RBACException {
    return error instanceof RBACException;
  }

  /**
   * Check if error is a specific RBAC error code
   */
  static isErrorCode(error: any, code: RBACErrorCode): boolean {
    return this.isRBACException(error) && error.code === code;
  }

  /**
   * Check if error is in a specific category
   */
  static isErrorCategory(error: any, category: RBACErrorCategory): boolean {
    return this.isRBACException(error) && error.category === category;
  }

  /**
   * Check if error has a specific severity
   */
  static isErrorSeverity(error: any, severity: RBACErrorSeverity): boolean {
    return this.isRBACException(error) && error.severity === severity;
  }

  /**
   * Extract error details from an RBAC exception
   */
  static extractErrorDetails(error: any): {
    code?: RBACErrorCode;
    category?: RBACErrorCategory;
    severity?: RBACErrorSeverity;
    message?: string;
    context?: Record<string, any>;
  } {
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

  /**
   * Wrap a function call with error handling
   */
  static async wrapWithErrorHandling<T>(
    operation: () => Promise<T>,
    service: string,
    operationName: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (this.isRBACException(error)) {
        throw error;
      }

      // Convert generic errors to RBAC system exceptions
      throw createSystemErrorException(service, operationName, error as Error);
    }
  }

  /**
   * Create a validation error for multiple field errors
   */
  static throwValidationError(
    validationErrors: Array<{
      field: string;
      message: string;
      value?: any;
    }>,
  ): never {
    throw new RBACValidationException(RBACErrorCode.MALFORMED_REQUEST, {
      validationErrors,
    });
  }

  /**
   * Create an authentication error based on token issues
   */
  static throwTokenError(tokenError: 'missing' | 'invalid' | 'expired'): never {
    const errorCodeMap = {
      missing: RBACErrorCode.AUTH_TOKEN_MISSING,
      invalid: RBACErrorCode.AUTH_TOKEN_INVALID,
      expired: RBACErrorCode.AUTH_TOKEN_EXPIRED,
    };

    throw new RBACAuthenticationException(errorCodeMap[tokenError]);
  }

  /**
   * Create a user not found authentication error
   */
  static throwUserNotFound(userId?: string): never {
    throw new RBACAuthenticationException(RBACErrorCode.AUTH_USER_NOT_FOUND, {
      userId,
    });
  }
}

/**
 * Decorator for automatic error handling in service methods
 */
export function HandleRBACErrors(service: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return RBACErrorUtils.wrapWithErrorHandling(
        () => method.apply(this, args),
        service,
        propertyName,
      );
    };
  };
}

/**
 * Type guard for checking if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  if (!RBACErrorUtils.isRBACException(error)) {
    return false;
  }

  // Only retry system errors, not user/validation errors
  return (
    error.category === RBACErrorCategory.SYSTEM &&
    error.code !== RBACErrorCode.MIGRATION_FAILED // Don't retry migrations
  );
}

/**
 * Get retry delay based on error type and attempt number
 */
export function getRetryDelay(error: any, attempt: number): number {
  if (!isRetryableError(error)) {
    return 0;
  }

  // Exponential backoff with jitter
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  
  // Add jitter (±25%)
  const jitter = delay * 0.25 * (Math.random() - 0.5);
  
  return Math.max(0, delay + jitter);
}