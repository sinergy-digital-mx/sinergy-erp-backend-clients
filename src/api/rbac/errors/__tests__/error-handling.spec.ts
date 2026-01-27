/**
 * RBAC Error Handling System Tests
 * 
 * Comprehensive tests for the RBAC error handling system including
 * error types, exceptions, response formatting, and error utilities.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import {
  RBACErrorCode,
  RBACErrorCategory,
  RBACErrorSeverity,
} from '../rbac-error.types';
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
} from '../rbac-exceptions';
import { RBACErrorHandlerService } from '../error-handler.service';
import { RBACErrorUtils } from '../error-utils';
import { getErrorMessage, getUserFriendlyMessage } from '../error-messages';

describe('RBAC Error Handling System', () => {
  let errorHandlerService: RBACErrorHandlerService;
  let mockRequest: Partial<Request>;

  beforeEach(async () => {
    // Create error handler service with default configuration
    errorHandlerService = new RBACErrorHandlerService();
    
    mockRequest = {
      url: '/api/test',
      method: 'GET',
      headers: {
        'user-agent': 'test-agent',
        'x-tenant-id': 'test-tenant-id',
      },
      ip: '127.0.0.1',
      user: {
        user_id: 'test-user-id',
        tenant_id: 'test-tenant-id',
      },
    } as Partial<Request>;
  });

  describe('Error Types and Classifications', () => {
    it('should have all required error categories', () => {
      expect(RBACErrorCategory.AUTHENTICATION).toBeDefined();
      expect(RBACErrorCategory.AUTHORIZATION).toBeDefined();
      expect(RBACErrorCategory.VALIDATION).toBeDefined();
      expect(RBACErrorCategory.SYSTEM).toBeDefined();
      expect(RBACErrorCategory.TENANT).toBeDefined();
      expect(RBACErrorCategory.ROLE).toBeDefined();
      expect(RBACErrorCategory.PERMISSION).toBeDefined();
      expect(RBACErrorCategory.CACHE).toBeDefined();
    });

    it('should have all required error codes', () => {
      // Authentication errors
      expect(RBACErrorCode.AUTH_TOKEN_MISSING).toBeDefined();
      expect(RBACErrorCode.AUTH_TOKEN_INVALID).toBeDefined();
      expect(RBACErrorCode.AUTH_TOKEN_EXPIRED).toBeDefined();
      expect(RBACErrorCode.AUTH_USER_NOT_FOUND).toBeDefined();
      expect(RBACErrorCode.AUTH_CONTEXT_REQUIRED).toBeDefined();

      // Authorization errors
      expect(RBACErrorCode.PERMISSION_DENIED).toBeDefined();
      expect(RBACErrorCode.CROSS_TENANT_ACCESS_DENIED).toBeDefined();
      expect(RBACErrorCode.CROSS_USER_ACCESS_DENIED).toBeDefined();

      // Validation errors
      expect(RBACErrorCode.INVALID_ENTITY_TYPE).toBeDefined();
      expect(RBACErrorCode.INVALID_ACTION_TYPE).toBeDefined();
      expect(RBACErrorCode.MALFORMED_REQUEST).toBeDefined();

      // System errors
      expect(RBACErrorCode.DATABASE_CONNECTION_FAILED).toBeDefined();
      expect(RBACErrorCode.CACHE_SERVICE_UNAVAILABLE).toBeDefined();
      expect(RBACErrorCode.INTERNAL_SERVER_ERROR).toBeDefined();
    });

    it('should have appropriate severity levels', () => {
      expect(RBACErrorSeverity.LOW).toBeDefined();
      expect(RBACErrorSeverity.MEDIUM).toBeDefined();
      expect(RBACErrorSeverity.HIGH).toBeDefined();
      expect(RBACErrorSeverity.CRITICAL).toBeDefined();
    });
  });

  describe('RBAC Exceptions', () => {
    it('should create authentication exceptions correctly', () => {
      const exception = new RBACAuthenticationException(
        RBACErrorCode.AUTH_TOKEN_MISSING,
        { reason: 'No token provided' },
        'test-correlation-id',
      );

      expect(exception.code).toBe(RBACErrorCode.AUTH_TOKEN_MISSING);
      expect(exception.category).toBe(RBACErrorCategory.AUTHENTICATION);
      expect(exception.severity).toBe(RBACErrorSeverity.MEDIUM);
      expect(exception.getStatus()).toBe(401);
      expect(exception.correlationId).toBe('test-correlation-id');
    });

    it('should create authorization exceptions correctly', () => {
      const exception = new RBACAuthorizationException(
        RBACErrorCode.PERMISSION_DENIED,
        {
          requiredPermission: { entityType: 'Customer', action: 'Read' },
          userId: 'user-123',
          tenantId: 'tenant-123',
        },
      );

      expect(exception.code).toBe(RBACErrorCode.PERMISSION_DENIED);
      expect(exception.category).toBe(RBACErrorCategory.AUTHORIZATION);
      expect(exception.getStatus()).toBe(403);
    });

    it('should create validation exceptions correctly', () => {
      const exception = new RBACValidationException(
        RBACErrorCode.INVALID_ENTITY_TYPE,
        { invalidEntityType: 'InvalidEntity' },
      );

      expect(exception.code).toBe(RBACErrorCode.INVALID_ENTITY_TYPE);
      expect(exception.category).toBe(RBACErrorCategory.VALIDATION);
      expect(exception.getStatus()).toBe(400);
    });

    it('should create system exceptions correctly', () => {
      const exception = new RBACSystemException(
        RBACErrorCode.DATABASE_CONNECTION_FAILED,
        {
          service: 'PermissionService',
          operation: 'getUserPermissions',
        },
      );

      expect(exception.code).toBe(RBACErrorCode.DATABASE_CONNECTION_FAILED);
      expect(exception.category).toBe(RBACErrorCategory.SYSTEM);
      expect(exception.getStatus()).toBe(500);
    });
  });

  describe('Exception Factory Functions', () => {
    it('should create permission denied exception with context', () => {
      const exception = createPermissionDeniedException(
        'Customer',
        'Delete',
        'user-123',
        'tenant-123',
        ['Customer:Read', 'Customer:Update'],
      );

      expect(exception.code).toBe(RBACErrorCode.PERMISSION_DENIED);
      expect(exception.context?.requiredPermission).toEqual({
        entityType: 'Customer',
        action: 'Delete',
      });
      expect(exception.context?.userId).toBe('user-123');
      expect(exception.context?.tenantId).toBe('tenant-123');
      expect(exception.context?.userPermissions).toEqual([
        'Customer:Read',
        'Customer:Update',
      ]);
    });

    it('should create cross-tenant access denied exception', () => {
      const exception = createCrossTenantAccessDeniedException(
        'requested-tenant',
        'current-tenant',
        'user-123',
      );

      expect(exception.code).toBe(RBACErrorCode.CROSS_TENANT_ACCESS_DENIED);
      expect(exception.context?.requestedTenantId).toBe('requested-tenant');
      expect(exception.context?.tenantId).toBe('current-tenant');
      expect(exception.context?.userId).toBe('user-123');
    });

    it('should create invalid entity type exception', () => {
      const exception = createInvalidEntityTypeException(
        'InvalidEntity',
        ['Customer', 'Lead', 'Order'],
      );

      expect(exception.code).toBe(RBACErrorCode.INVALID_ENTITY_TYPE);
      expect(exception.context?.invalidEntityType).toBe('InvalidEntity');
      expect(exception.context?.availableEntities).toEqual([
        'Customer',
        'Lead',
        'Order',
      ]);
    });
  });

  describe('Error Messages', () => {
    it('should provide technical and user-friendly messages', () => {
      const message = getErrorMessage(RBACErrorCode.PERMISSION_DENIED);

      expect(message.technical).toContain('lacks the required permission');
      expect(message.userFriendly).toContain('don\'t have permission');
      expect(message.suggestions).toBeInstanceOf(Array);
      expect(message.suggestions.length).toBeGreaterThan(0);
    });

    it('should provide user-friendly messages for all error codes', () => {
      const errorCodes = Object.values(RBACErrorCode);
      
      errorCodes.forEach(code => {
        const userMessage = getUserFriendlyMessage(code);
        expect(userMessage).toBeDefined();
        expect(userMessage.length).toBeGreaterThan(0);
        expect(userMessage).not.toContain('undefined');
      });
    });

    it('should provide helpful suggestions for common errors', () => {
      const permissionDeniedMessage = getErrorMessage(RBACErrorCode.PERMISSION_DENIED);
      expect(permissionDeniedMessage.suggestions).toContain(
        'Contact your administrator to request the necessary permissions',
      );

      const invalidEntityMessage = getErrorMessage(RBACErrorCode.INVALID_ENTITY_TYPE);
      expect(invalidEntityMessage.suggestions).toContain(
        'Check the entity type against the available entities',
      );
    });
  });

  describe('Error Handler Service', () => {
    it('should handle RBAC exceptions and create detailed responses', () => {
      const exception = createPermissionDeniedException(
        'Customer',
        'Delete',
        'user-123',
        'tenant-123',
      );

      const response = errorHandlerService.handleException(
        exception,
        mockRequest as Request,
        'test-correlation-id',
      );

      expect(response.statusCode).toBe(403);
      expect(response.code).toBe(RBACErrorCode.PERMISSION_DENIED);
      expect(response.category).toBe(RBACErrorCategory.AUTHORIZATION);
      expect(response.correlationId).toBe('test-correlation-id');
      expect(response.path).toBe('/api/test');
      expect(response.details?.requiredPermission).toEqual({
        entityType: 'Customer',
        action: 'Delete',
      });
    });

    it('should handle generic errors and convert them', () => {
      const genericError = new Error('Database connection failed');

      const response = errorHandlerService.handleGenericError(
        genericError,
        mockRequest as Request,
      );

      expect(response.statusCode).toBe(500);
      expect(response.message).toContain('unexpected error');
    });

    it('should sanitize sensitive information from context', () => {
      const exception = new RBACSystemException(
        RBACErrorCode.INTERNAL_SERVER_ERROR,
        {
          password: 'secret123',
          token: 'jwt-token',
          normalField: 'normal-value',
        },
      );

      const response = errorHandlerService.handleException(
        exception,
        mockRequest as Request,
      );

      expect(response.details?.password).toBe('[REDACTED]');
      expect(response.details?.token).toBe('[REDACTED]');
      expect(response.details?.normalField).toBe('normal-value');
    });
  });

  describe('Error Utilities', () => {
    it('should provide convenient throw methods', () => {
      expect(() => {
        RBACErrorUtils.throwPermissionDenied('Customer', 'Delete');
      }).toThrow(RBACAuthorizationException);

      expect(() => {
        RBACErrorUtils.throwInvalidEntityType('InvalidEntity');
      }).toThrow(RBACValidationException);

      expect(() => {
        RBACErrorUtils.throwRoleNotFound('role-123');
      }).toThrow(RBACNotFoundException);
    });

    it('should identify RBAC exceptions correctly', () => {
      const rbacException = new RBACAuthenticationException(
        RBACErrorCode.AUTH_TOKEN_MISSING,
      );
      const genericError = new Error('Generic error');

      expect(RBACErrorUtils.isRBACException(rbacException)).toBe(true);
      expect(RBACErrorUtils.isRBACException(genericError)).toBe(false);
    });

    it('should check error codes and categories correctly', () => {
      const exception = new RBACAuthorizationException(
        RBACErrorCode.PERMISSION_DENIED,
      );

      expect(
        RBACErrorUtils.isErrorCode(exception, RBACErrorCode.PERMISSION_DENIED),
      ).toBe(true);
      expect(
        RBACErrorUtils.isErrorCode(exception, RBACErrorCode.AUTH_TOKEN_MISSING),
      ).toBe(false);

      expect(
        RBACErrorUtils.isErrorCategory(exception, RBACErrorCategory.AUTHORIZATION),
      ).toBe(true);
      expect(
        RBACErrorUtils.isErrorCategory(exception, RBACErrorCategory.AUTHENTICATION),
      ).toBe(false);
    });

    it('should extract error details correctly', () => {
      const exception = new RBACValidationException(
        RBACErrorCode.INVALID_ENTITY_TYPE,
        { invalidEntityType: 'TestEntity' },
      );

      const details = RBACErrorUtils.extractErrorDetails(exception);

      expect(details.code).toBe(RBACErrorCode.INVALID_ENTITY_TYPE);
      expect(details.category).toBe(RBACErrorCategory.VALIDATION);
      expect(details.context?.invalidEntityType).toBe('TestEntity');
    });

    it('should wrap operations with error handling', async () => {
      const successOperation = async () => 'success';
      const failingOperation = async () => {
        throw new Error('Operation failed');
      };

      const result = await RBACErrorUtils.wrapWithErrorHandling(
        successOperation,
        'TestService',
        'testOperation',
      );
      expect(result).toBe('success');

      await expect(
        RBACErrorUtils.wrapWithErrorHandling(
          failingOperation,
          'TestService',
          'testOperation',
        ),
      ).rejects.toThrow(RBACSystemException);
    });
  });

  describe('Error Response Formatting', () => {
    it('should format error responses consistently', () => {
      const exception = createPermissionDeniedException(
        'Customer',
        'Read',
        'user-123',
        'tenant-123',
        ['Customer:Update'],
      );

      const response = errorHandlerService.handleException(
        exception,
        mockRequest as Request,
        'correlation-123',
      );

      // Check required fields
      expect(response.statusCode).toBeDefined();
      expect(response.error).toBeDefined();
      expect(response.message).toBeDefined();
      expect(response.timestamp).toBeDefined();
      expect(response.path).toBeDefined();

      // Check RBAC-specific fields
      expect(response.code).toBe(RBACErrorCode.PERMISSION_DENIED);
      expect(response.category).toBe(RBACErrorCategory.AUTHORIZATION);
      expect(response.severity).toBe(RBACErrorSeverity.MEDIUM);
      expect(response.correlationId).toBe('correlation-123');

      // Check context details
      expect(response.details?.requiredPermission).toEqual({
        entityType: 'Customer',
        action: 'Read',
      });
      expect(response.details?.userId).toBe('user-123');
      expect(response.details?.tenantId).toBe('tenant-123');
      expect(response.details?.userPermissions).toEqual(['Customer:Update']);

      // Check suggestions
      expect(response.suggestions).toBeInstanceOf(Array);
      expect(response.suggestions?.length).toBeGreaterThan(0);
    });

    it('should include appropriate suggestions based on error type', () => {
      const authException = new RBACAuthenticationException(
        RBACErrorCode.AUTH_TOKEN_EXPIRED,
      );

      const response = errorHandlerService.handleException(
        authException,
        mockRequest as Request,
      );

      expect(response.suggestions).toContain(
        'Log in again to obtain a new authentication token',
      );
    });
  });

  describe('Error Logging and Monitoring', () => {
    it('should create audit log entries with complete context', () => {
      const exception = createPermissionDeniedException(
        'Customer',
        'Delete',
        'user-123',
        'tenant-123',
      );

      const auditEntry = errorHandlerService.createAuditLogEntry(
        exception,
        mockRequest as Request,
        'correlation-123',
      );

      expect(auditEntry.code).toBe(RBACErrorCode.PERMISSION_DENIED);
      expect(auditEntry.category).toBe(RBACErrorCategory.AUTHORIZATION);
      expect(auditEntry.severity).toBe(RBACErrorSeverity.MEDIUM);
      expect(auditEntry.context?.correlationId).toBe('correlation-123');
      expect(auditEntry.context?.path).toBe('/api/test');
      expect(auditEntry.context?.userId).toBe('test-user-id');
      expect(auditEntry.context?.tenantId).toBe('test-tenant-id');
      expect(auditEntry.timestamp).toBeInstanceOf(Date);
    });
  });
});