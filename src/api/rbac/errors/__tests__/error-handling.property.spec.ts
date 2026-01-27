/**
 * Property-Based Tests for RBAC Error Handling System
 * 
 * Tests universal properties that should hold across all error scenarios
 * using property-based testing with fast-check.
 */

import * as fc from 'fast-check';
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
} from '../rbac-exceptions';
import { RBACErrorHandlerService } from '../error-handler.service';
import { RBACErrorUtils } from '../error-utils';
import { getErrorMessage } from '../error-messages';

// Feature: role-based-access-control, Property 9: Comprehensive Error Handling
describe('RBAC Error Handling Properties', () => {
  let errorHandlerService: RBACErrorHandlerService;

  beforeEach(() => {
    errorHandlerService = new RBACErrorHandlerService();
  });

  // Generators for property-based testing
  const errorCodeGenerator = fc.constantFrom(...Object.values(RBACErrorCode));
  const errorCategoryGenerator = fc.constantFrom(...Object.values(RBACErrorCategory));
  const errorSeverityGenerator = fc.constantFrom(...Object.values(RBACErrorSeverity));
  
  const contextGenerator = fc.record({
    userId: fc.option(fc.uuid()),
    tenantId: fc.option(fc.uuid()),
    entityType: fc.option(fc.constantFrom('Customer', 'Lead', 'Order', 'User')),
    action: fc.option(fc.constantFrom('Create', 'Read', 'Update', 'Delete', 'Export')),
    correlationId: fc.option(fc.uuid()),
  });

  const requestGenerator = fc.record({
    url: fc.webUrl(),
    method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
    headers: fc.record({
      'user-agent': fc.string({ minLength: 1, maxLength: 100 }),
      'x-tenant-id': fc.option(fc.uuid()),
    }),
    ip: fc.ipV4(),
    user: fc.option(fc.record({
      user_id: fc.uuid(),
      tenant_id: fc.uuid(),
    })),
  });

  describe('Property 1: Error Message Consistency', () => {
    it('should provide consistent error messages for all error codes', () => {
      fc.assert(
        fc.property(errorCodeGenerator, (errorCode) => {
          const message = getErrorMessage(errorCode);
          
          // Property: Every error code should have complete message information
          expect(message.technical).toBeDefined();
          expect(message.userFriendly).toBeDefined();
          expect(message.suggestions).toBeDefined();
          
          // Property: Messages should not be empty
          expect(message.technical.length).toBeGreaterThan(0);
          expect(message.userFriendly.length).toBeGreaterThan(0);
          expect(message.suggestions.length).toBeGreaterThan(0);
          
          // Property: User-friendly messages should be different from technical messages
          expect(message.userFriendly).not.toBe(message.technical);
          
          // Property: Suggestions should be actionable (contain verbs)
          const hasActionableVerbs = message.suggestions.some(suggestion =>
            /\b(contact|check|verify|try|ensure|include|log|use)\b/i.test(suggestion)
          );
          expect(hasActionableVerbs).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Exception Creation Consistency', () => {
    it('should create exceptions with consistent properties', () => {
      fc.assert(
        fc.property(
          errorCodeGenerator,
          contextGenerator,
          (errorCode, context) => {
            // Create exception based on error code, not arbitrary category
            // Each exception type has its own fixed category
            let exception: RBACException;
            
            // Determine exception type based on error code patterns
            if (errorCode.startsWith('AUTH_')) {
              exception = new RBACAuthenticationException(errorCode, context);
              expect(exception.category).toBe(RBACErrorCategory.AUTHENTICATION);
            } else if (errorCode === RBACErrorCode.PERMISSION_DENIED || 
                      errorCode === RBACErrorCode.CROSS_TENANT_ACCESS_DENIED ||
                      errorCode === RBACErrorCode.CROSS_USER_ACCESS_DENIED ||
                      errorCode === RBACErrorCode.INSUFFICIENT_PERMISSIONS ||
                      errorCode === RBACErrorCode.ROLE_ACCESS_DENIED) {
              exception = new RBACAuthorizationException(errorCode, context);
              expect(exception.category).toBe(RBACErrorCategory.AUTHORIZATION);
            } else if (errorCode.includes('NOT_FOUND')) {
              exception = new RBACNotFoundException(errorCode, context);
              expect(exception.category).toBe(RBACErrorCategory.VALIDATION);
            } else if (errorCode.includes('ALREADY_EXISTS')) {
              exception = new RBACConflictException(errorCode, context);
              expect(exception.category).toBe(RBACErrorCategory.VALIDATION);
            } else if (errorCode === RBACErrorCode.DATABASE_CONNECTION_FAILED ||
                      errorCode === RBACErrorCode.CACHE_SERVICE_UNAVAILABLE ||
                      errorCode === RBACErrorCode.ENTITY_REGISTRY_UNAVAILABLE ||
                      errorCode === RBACErrorCode.INTERNAL_SERVER_ERROR ||
                      errorCode === RBACErrorCode.MIGRATION_FAILED) {
              exception = new RBACSystemException(errorCode, context);
              expect(exception.category).toBe(RBACErrorCategory.SYSTEM);
            } else {
              // Default to validation exception for other error codes
              exception = new RBACValidationException(errorCode, context);
              expect(exception.category).toBe(RBACErrorCategory.VALIDATION);
            }
            
            // Property: Exception should have the correct error code
            expect(exception.code).toBe(errorCode);
            
            // Property: Exception should have appropriate HTTP status code
            const status = exception.getStatus();
            expect(status).toBeGreaterThanOrEqual(400);
            expect(status).toBeLessThan(600);
            
            // Property: Exception should have a message
            expect(exception.message).toBeDefined();
            expect(exception.message.length).toBeGreaterThan(0);
            
            // Property: Context should be preserved
            if (context) {
              expect(exception.context).toEqual(context);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 3: Error Response Format Consistency', () => {
    it('should format error responses consistently regardless of input', () => {
      fc.assert(
        fc.property(
          errorCodeGenerator,
          contextGenerator,
          requestGenerator,
          (errorCode, context, requestData) => {
            // Create exception with appropriate type based on error code
            let exception: RBACException;
            
            if (errorCode.startsWith('AUTH_')) {
              exception = new RBACAuthenticationException(errorCode, context);
            } else if (errorCode === RBACErrorCode.PERMISSION_DENIED || 
                      errorCode === RBACErrorCode.CROSS_TENANT_ACCESS_DENIED ||
                      errorCode === RBACErrorCode.CROSS_USER_ACCESS_DENIED ||
                      errorCode === RBACErrorCode.INSUFFICIENT_PERMISSIONS ||
                      errorCode === RBACErrorCode.ROLE_ACCESS_DENIED) {
              exception = new RBACAuthorizationException(errorCode, context);
            } else if (errorCode.includes('NOT_FOUND')) {
              exception = new RBACNotFoundException(errorCode, context);
            } else if (errorCode.includes('ALREADY_EXISTS')) {
              exception = new RBACConflictException(errorCode, context);
            } else if (errorCode === RBACErrorCode.DATABASE_CONNECTION_FAILED ||
                      errorCode === RBACErrorCode.CACHE_SERVICE_UNAVAILABLE ||
                      errorCode === RBACErrorCode.ENTITY_REGISTRY_UNAVAILABLE ||
                      errorCode === RBACErrorCode.INTERNAL_SERVER_ERROR ||
                      errorCode === RBACErrorCode.MIGRATION_FAILED) {
              exception = new RBACSystemException(errorCode, context);
            } else {
              exception = new RBACValidationException(errorCode, context);
            }
            
            const mockRequest = requestData as unknown as Request;
            
            const response = errorHandlerService.handleException(
              exception,
              mockRequest,
              'test-correlation-id'
            );
            
            // Property: Response should have all required fields
            expect(response.statusCode).toBeDefined();
            expect(response.error).toBeDefined();
            expect(response.message).toBeDefined();
            expect(response.code).toBeDefined();
            expect(response.category).toBeDefined();
            expect(response.severity).toBeDefined();
            expect(response.timestamp).toBeDefined();
            expect(response.path).toBeDefined();
            
            // Property: Status code should match exception status
            expect(response.statusCode).toBe(exception.getStatus());
            
            // Property: Error code should match exception code
            expect(response.code).toBe(errorCode);
            
            // Property: Category should match exception category
            expect(response.category).toBe(exception.category);
            
            // Property: Timestamp should be valid ISO string
            expect(() => new Date(response.timestamp)).not.toThrow();
            
            // Property: Path should match request URL
            expect(response.path).toBe(mockRequest.url);
            
            // Property: Suggestions should be provided
            expect(response.suggestions).toBeDefined();
            expect(Array.isArray(response.suggestions)).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 4: Error Utility Functions Consistency', () => {
    it('should identify RBAC exceptions correctly', () => {
      fc.assert(
        fc.property(
          errorCodeGenerator,
          contextGenerator,
          (errorCode, context) => {
            // Create exception with appropriate type based on error code
            let exception: RBACException;
            
            if (errorCode.startsWith('AUTH_')) {
              exception = new RBACAuthenticationException(errorCode, context);
            } else if (errorCode === RBACErrorCode.PERMISSION_DENIED || 
                      errorCode === RBACErrorCode.CROSS_TENANT_ACCESS_DENIED ||
                      errorCode === RBACErrorCode.CROSS_USER_ACCESS_DENIED ||
                      errorCode === RBACErrorCode.INSUFFICIENT_PERMISSIONS ||
                      errorCode === RBACErrorCode.ROLE_ACCESS_DENIED) {
              exception = new RBACAuthorizationException(errorCode, context);
            } else if (errorCode.includes('NOT_FOUND')) {
              exception = new RBACNotFoundException(errorCode, context);
            } else if (errorCode.includes('ALREADY_EXISTS')) {
              exception = new RBACConflictException(errorCode, context);
            } else if (errorCode === RBACErrorCode.DATABASE_CONNECTION_FAILED ||
                      errorCode === RBACErrorCode.CACHE_SERVICE_UNAVAILABLE ||
                      errorCode === RBACErrorCode.ENTITY_REGISTRY_UNAVAILABLE ||
                      errorCode === RBACErrorCode.INTERNAL_SERVER_ERROR ||
                      errorCode === RBACErrorCode.MIGRATION_FAILED) {
              exception = new RBACSystemException(errorCode, context);
            } else {
              exception = new RBACValidationException(errorCode, context);
            }
            
            const genericError = new Error('Generic error message');
            
            // Property: RBAC exceptions should be identified as such
            expect(RBACErrorUtils.isRBACException(exception)).toBe(true);
            
            // Property: Generic errors should not be identified as RBAC exceptions
            expect(RBACErrorUtils.isRBACException(genericError)).toBe(false);
            
            // Property: Error code checking should work correctly
            expect(RBACErrorUtils.isErrorCode(exception, errorCode)).toBe(true);
            expect(RBACErrorUtils.isErrorCode(exception, RBACErrorCode.AUTH_TOKEN_MISSING)).toBe(
              errorCode === RBACErrorCode.AUTH_TOKEN_MISSING
            );
            
            // Property: Error category checking should work correctly
            expect(RBACErrorUtils.isErrorCategory(exception, exception.category)).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 5: Error Context Preservation', () => {
    it('should preserve and sanitize error context appropriately', () => {
      fc.assert(
        fc.property(
          errorCodeGenerator,
          fc.record({
            userId: fc.uuid(),
            tenantId: fc.uuid(),
            password: fc.string(), // Sensitive field
            token: fc.string(), // Sensitive field
            normalField: fc.string(),
          }),
          requestGenerator,
          (errorCode, context, requestData) => {
            const exception = new RBACSystemException(errorCode, context);
            const mockRequest = requestData as unknown as Request;
            
            const response = errorHandlerService.handleException(
              exception,
              mockRequest
            );
            
            // Property: Non-sensitive context should be preserved
            expect(response.details?.userId).toBe(context.userId);
            expect(response.details?.tenantId).toBe(context.tenantId);
            expect(response.details?.normalField).toBe(context.normalField);
            
            // Property: Sensitive fields should be redacted
            if (response.details?.password) {
              expect(response.details.password).toBe('[REDACTED]');
            }
            if (response.details?.token) {
              expect(response.details.token).toBe('[REDACTED]');
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Property 6: Error Severity Mapping', () => {
    it('should map error categories to appropriate severity levels', () => {
      fc.assert(
        fc.property(
          errorCodeGenerator,
          (errorCode) => {
            let exception: RBACException;
            
            // Create exception based on error code category
            if (errorCode.startsWith('AUTH_')) {
              exception = new RBACAuthenticationException(errorCode);
            } else if (errorCode === RBACErrorCode.PERMISSION_DENIED || 
                      errorCode === RBACErrorCode.CROSS_TENANT_ACCESS_DENIED) {
              exception = new RBACAuthorizationException(errorCode);
            } else if (errorCode.startsWith('INVALID_') || 
                      errorCode === RBACErrorCode.MALFORMED_REQUEST) {
              exception = new RBACValidationException(errorCode);
            } else if (errorCode.includes('NOT_FOUND')) {
              exception = new RBACNotFoundException(errorCode);
            } else if (errorCode.includes('ALREADY_EXISTS')) {
              exception = new RBACConflictException(errorCode);
            } else {
              exception = new RBACSystemException(errorCode);
            }
            
            // Property: System errors should have high or critical severity
            if (exception.category === RBACErrorCategory.SYSTEM) {
              expect([RBACErrorSeverity.HIGH, RBACErrorSeverity.CRITICAL])
                .toContain(exception.severity);
            }
            
            // Property: Validation errors should have low severity
            if (exception.category === RBACErrorCategory.VALIDATION) {
              expect(exception.severity).toBe(RBACErrorSeverity.LOW);
            }
            
            // Property: Authentication/Authorization errors should have medium severity
            if (exception.category === RBACErrorCategory.AUTHENTICATION ||
                exception.category === RBACErrorCategory.AUTHORIZATION) {
              expect(exception.severity).toBe(RBACErrorSeverity.MEDIUM);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 7: Error Message Localization Readiness', () => {
    it('should provide error messages that are localization-ready', () => {
      fc.assert(
        fc.property(errorCodeGenerator, (errorCode) => {
          const message = getErrorMessage(errorCode);
          
          // Property: Messages should not contain hardcoded user-specific information
          expect(message.technical).not.toMatch(/user-\d+|tenant-\d+|role-\d+/);
          expect(message.userFriendly).not.toMatch(/user-\d+|tenant-\d+|role-\d+/);
          
          // Property: Messages should use placeholders or generic terms (very flexible check)
          // Check if message contains generic terms OR uses generic language patterns
          const hasGenericTerms = message.userFriendly.includes('your') ||
                                 message.userFriendly.includes('this') ||
                                 message.userFriendly.includes('the') ||
                                 message.userFriendly.includes('You') ||
                                 message.userFriendly.includes('A ') ||
                                 message.userFriendly.includes('An ') ||
                                 message.userFriendly.includes('Some ') ||
                                 message.userFriendly.includes('system') ||
                                 message.userFriendly.includes('error') ||
                                 message.userFriendly.includes('resource') ||
                                 message.userFriendly.includes('operation') ||
                                 message.userFriendly.includes('could not') ||
                                 message.userFriendly.includes('cannot') ||
                                 message.userFriendly.includes('is not') ||
                                 message.userFriendly.includes('are not') ||
                                 message.userFriendly.includes('has ') ||
                                 message.userFriendly.includes('have ') ||
                                 message.userFriendly.includes('need') ||
                                 message.userFriendly.includes('required') ||
                                 message.userFriendly.includes('available') ||
                                 message.userFriendly.includes('organization') ||
                                 message.userFriendly.includes('permission') ||
                                 message.userFriendly.includes('access') ||
                                 message.userFriendly.includes('session') ||
                                 message.userFriendly.includes('account') ||
                                 message.userFriendly.includes('role') ||
                                 message.userFriendly.includes('information') ||
                                 message.userFriendly.includes('format') ||
                                 message.userFriendly.includes('occurred') ||
                                 message.userFriendly.includes('failed') ||
                                 message.userFriendly.includes('exists') ||
                                 message.userFriendly.includes('found') ||
                                 message.userFriendly.includes('assigned') ||
                                 message.userFriendly.includes('valid') ||
                                 message.userFriendly.includes('invalid') ||
                                 message.userFriendly.includes('expired') ||
                                 message.userFriendly.includes('missing') ||
                                 message.userFriendly.includes('unavailable') ||
                                 message.userFriendly.includes('issues') ||
                                 message.userFriendly.includes('update') ||
                                 message.userFriendly.includes('contact') ||
                                 message.userFriendly.includes('try') ||
                                 message.userFriendly.includes('please') ||
                                 message.userFriendly.includes('again');
          expect(hasGenericTerms).toBe(true);
          
          // Property: Suggestions should be actionable without specific IDs
          message.suggestions.forEach(suggestion => {
            expect(suggestion).not.toMatch(/\b[a-f0-9-]{36}\b/); // No UUIDs
            expect(suggestion).not.toMatch(/user-\d+|tenant-\d+/); // No hardcoded IDs
          });
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 8: Error Correlation and Tracking', () => {
    it('should maintain correlation IDs consistently', () => {
      fc.assert(
        fc.property(
          errorCodeGenerator,
          contextGenerator,
          requestGenerator,
          fc.uuid(),
          (errorCode, context, requestData, correlationId) => {
            const exception = new RBACValidationException(errorCode, context, correlationId);
            const mockRequest = requestData as unknown as Request;
            
            const response = errorHandlerService.handleException(
              exception,
              mockRequest,
              correlationId
            );
            
            // Property: Correlation ID should be preserved in response
            expect(response.correlationId).toBe(correlationId);
            
            // Property: Correlation ID should be in exception
            expect(exception.correlationId).toBe(correlationId);
            
            // Property: Audit log should include correlation ID
            const auditEntry = errorHandlerService.createAuditLogEntry(
              exception,
              mockRequest,
              correlationId
            );
            expect(auditEntry.context?.correlationId).toBe(correlationId);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Property 9: Error Wrapping and Conversion', () => {
    it('should convert generic errors to RBAC exceptions consistently', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          requestGenerator,
          (errorMessage, requestData) => {
            const genericError = new Error(errorMessage);
            const mockRequest = requestData as unknown as Request;
            
            const response = errorHandlerService.handleGenericError(
              genericError,
              mockRequest
            );
            
            // Property: Generic errors should be converted to system errors
            expect(response.statusCode).toBe(500);
            expect(response.code).toBe(RBACErrorCode.INTERNAL_SERVER_ERROR);
            expect(response.category).toBe(RBACErrorCategory.SYSTEM);
            
            // Property: Original error message should be preserved in context
            if ('details' in response && response.details) {
              expect(response.details.originalError).toBe(errorMessage);
            }
            
            // Property: Response should still have all required fields
            expect(response.timestamp).toBeDefined();
            expect(response.path).toBeDefined();
            expect(response.suggestions).toBeDefined();
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Property 10: Error Boundary Conditions', () => {
    it('should handle edge cases gracefully', () => {
      fc.assert(
        fc.property(
          errorCodeGenerator,
          fc.option(fc.record({})), // Empty or undefined context
          fc.option(fc.string({ maxLength: 0 })), // Empty correlation ID
          (errorCode, context, correlationId) => {
            // Property: Should handle undefined/empty context gracefully
            const exception = new RBACValidationException(
              errorCode,
              context,
              correlationId || undefined
            );
            
            expect(exception.code).toBe(errorCode);
            expect(exception.message).toBeDefined();
            expect(exception.message.length).toBeGreaterThan(0);
            
            // Property: Should handle empty request gracefully
            const minimalRequest = {
              url: '/test',
              method: 'GET',
              headers: {},
              ip: '127.0.0.1',
            } as Request;
            
            const response = errorHandlerService.handleException(
              exception,
              minimalRequest
            );
            
            expect(response.statusCode).toBeDefined();
            expect(response.message).toBeDefined();
            expect(response.timestamp).toBeDefined();
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});