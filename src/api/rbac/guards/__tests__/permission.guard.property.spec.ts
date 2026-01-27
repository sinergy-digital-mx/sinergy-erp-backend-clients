/**
 * Property-Based Tests for Permission Guard Authorization
 * 
 * Property 15: Guard and Decorator Integration
 * Validates: Requirements 5.2, 5.3
 * 
 * These tests verify that the PermissionGuard correctly enforces authorization
 * rules across various scenarios using property-based testing to ensure
 * comprehensive coverage of edge cases and combinations.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import * as fc from 'fast-check';
import { PermissionGuard } from '../permission.guard';
import { PermissionService } from '../../services/permission.service';
import { TenantContextService } from '../../services/tenant-context.service';
import { RequiredPermission, PERMISSIONS_KEY } from '../../decorators/require-permissions.decorator';
import { RBACException } from '../../errors/rbac-exceptions';
import { RBACErrorCode } from '../../errors/rbac-error.types';

describe('PermissionGuard - Property Tests', () => {
  let guard: PermissionGuard;
  let permissionService: jest.Mocked<PermissionService>;
  let tenantContextService: jest.Mocked<TenantContextService>;
  let reflector: jest.Mocked<Reflector>;
  let jwtService: jest.Mocked<JwtService>;

  // Test data generators
  const userIdArb = fc.string({ minLength: 1, maxLength: 50 });
  const tenantIdArb = fc.string({ minLength: 1, maxLength: 50 });
  const entityTypeArb = fc.constantFrom('Customer', 'Lead', 'User', 'Order', 'Product');
  const actionArb = fc.constantFrom('Create', 'Read', 'Update', 'Delete', 'List', 'Export');
  
  const permissionArb = fc.record({
    entityType: entityTypeArb,
    action: actionArb,
  });

  const userArb = fc.record({
    user_id: userIdArb,
    tenant_id: fc.option(tenantIdArb, { nil: undefined }),
    currentTenantId: fc.option(tenantIdArb, { nil: undefined }),
    email: fc.emailAddress(),
  });

  const requestArb = fc.record({
    headers: fc.record({
      'x-tenant-id': fc.option(tenantIdArb, { nil: undefined }),
      'X-Tenant-ID': fc.option(tenantIdArb, { nil: undefined }),
      'X-TENANT-ID': fc.option(tenantIdArb, { nil: undefined }),
    }, { requiredKeys: [] }),
    user: fc.option(userArb, { nil: undefined }),
  });

  beforeEach(async () => {
    const mockPermissionService = {
      hasPermission: jest.fn(),
      validateUserTenantAccess: jest.fn(),
    };

    const mockTenantContextService = {
      setTenantContext: jest.fn(),
      getCurrentTenantId: jest.fn(),
      getCurrentUserId: jest.fn(),
    };

    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        { provide: PermissionService, useValue: mockPermissionService },
        { provide: TenantContextService, useValue: mockTenantContextService },
        { provide: Reflector, useValue: mockReflector },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    guard = module.get<PermissionGuard>(PermissionGuard);
    permissionService = module.get(PermissionService);
    tenantContextService = module.get(TenantContextService);
    reflector = module.get(Reflector);
    jwtService = module.get(JwtService);

    // Suppress console logs during tests
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 15.1: Routes without permission requirements should always allow access
   */
  it('should allow access when no permissions are required', async () => {
    await fc.assert(
      fc.asyncProperty(requestArb, async (request) => {
        // Arrange
        const mockContext = createMockExecutionContext(request);
        reflector.getAllAndOverride.mockReturnValue(undefined); // No permissions required

        // Act
        const result = await guard.canActivate(mockContext);

        // Assert
        expect(result).toBe(true);
        expect(permissionService.hasPermission).not.toHaveBeenCalled();
        expect(tenantContextService.setTenantContext).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 15.2: Unauthenticated requests should always be denied
   */
  it('should deny access when user is not authenticated', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(permissionArb, { minLength: 1, maxLength: 5 }),
        async (requiredPermissions) => {
          // Arrange
          const requestWithoutUser = { headers: {}, user: undefined };
          const mockContext = createMockExecutionContext(requestWithoutUser);
          reflector.getAllAndOverride.mockReturnValue(requiredPermissions);

          // Act & Assert
          await expect(guard.canActivate(mockContext)).rejects.toThrow(RBACException);
          expect(permissionService.hasPermission).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 15.3: Requests without tenant context should be denied
   */
  it('should deny access when tenant context cannot be determined', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(permissionArb, { minLength: 1, maxLength: 5 }),
        userIdArb,
        async (requiredPermissions, userId) => {
          // Arrange - user without tenant information
          const userWithoutTenant = {
            user_id: userId,
            email: 'test@example.com',
            // No tenant_id or currentTenantId
          };
          const requestWithoutTenant = {
            headers: {}, // No tenant headers
            user: userWithoutTenant,
          };
          const mockContext = createMockExecutionContext(requestWithoutTenant);
          reflector.getAllAndOverride.mockReturnValue(requiredPermissions);

          // Act & Assert
          await expect(guard.canActivate(mockContext)).rejects.toThrow(RBACException);
          expect(permissionService.hasPermission).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 15.4: Users with all required permissions should be granted access
   */
  it('should grant access when user has all required permissions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(permissionArb, { minLength: 1, maxLength: 5 }),
        userIdArb,
        tenantIdArb,
        async (requiredPermissions, userId, tenantId) => {
          // Reset mocks for this test run
          jest.clearAllMocks();
          
          // Arrange
          const user = { user_id: userId, tenant_id: tenantId, email: 'test@example.com' };
          const request = { headers: {}, user };
          const mockContext = createMockExecutionContext(request);
          
          reflector.getAllAndOverride.mockReturnValue(requiredPermissions);
          
          // Mock all permissions as granted
          permissionService.hasPermission.mockResolvedValue(true);

          // Act
          const result = await guard.canActivate(mockContext);

          // Assert
          expect(result).toBe(true);
          expect(tenantContextService.setTenantContext).toHaveBeenCalledWith(tenantId, userId);
          expect(permissionService.hasPermission).toHaveBeenCalledTimes(requiredPermissions.length);
          
          // Verify each permission was checked
          requiredPermissions.forEach((permission) => {
            expect(permissionService.hasPermission).toHaveBeenCalledWith(
              userId,
              tenantId,
              permission.entityType,
              permission.action
            );
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 15.5: Users missing any required permission should be denied access
   */
  it('should deny access when user lacks any required permission', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(permissionArb, { minLength: 2, maxLength: 5 }),
        userIdArb,
        tenantIdArb,
        fc.integer({ min: 0, max: 4 }), // Index of permission to deny
        async (requiredPermissions, userId, tenantId, denyIndex) => {
          fc.pre(denyIndex < requiredPermissions.length);

          // Reset mocks for this test run
          jest.clearAllMocks();

          // Arrange
          const user = { user_id: userId, tenant_id: tenantId, email: 'test@example.com' };
          const request = { headers: {}, user };
          const mockContext = createMockExecutionContext(request);
          
          reflector.getAllAndOverride.mockReturnValue(requiredPermissions);
          
          // Mock permissions - grant all except the one at denyIndex
          let callCount = 0;
          permissionService.hasPermission.mockImplementation(async () => {
            const shouldGrant = callCount !== denyIndex;
            callCount++;
            return shouldGrant;
          });

          // Act & Assert
          await expect(guard.canActivate(mockContext)).rejects.toThrow(RBACException);
          expect(tenantContextService.setTenantContext).toHaveBeenCalledWith(tenantId, userId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 15.6: Tenant ID extraction should follow priority order
   */
  it('should extract tenant ID following correct priority order', async () => {
    await fc.assert(
      fc.asyncProperty(
        permissionArb,
        userIdArb,
        tenantIdArb,
        tenantIdArb,
        tenantIdArb,
        async (permission, userId, headerTenantId, jwtTenantId, userTenantId) => {
          fc.pre(headerTenantId !== jwtTenantId && jwtTenantId !== userTenantId);

          // Reset mocks for this test run
          jest.clearAllMocks();

          // Arrange - request with all three tenant ID sources
          const user = {
            user_id: userId,
            tenant_id: jwtTenantId,
            currentTenantId: userTenantId,
            email: 'test@example.com',
          };
          const request = {
            headers: { 'x-tenant-id': headerTenantId },
            user,
          };
          const mockContext = createMockExecutionContext(request);
          
          reflector.getAllAndOverride.mockReturnValue([permission]);
          permissionService.hasPermission.mockResolvedValue(true);

          // Act
          await guard.canActivate(mockContext);

          // Assert - should use header tenant ID (highest priority)
          expect(tenantContextService.setTenantContext).toHaveBeenCalledWith(headerTenantId, userId);
          expect(permissionService.hasPermission).toHaveBeenCalledWith(
            userId,
            headerTenantId,
            permission.entityType,
            permission.action
          );
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 15.7: Permission service errors should be properly handled
   */
  it('should handle permission service errors appropriately', async () => {
    await fc.assert(
      fc.asyncProperty(
        permissionArb,
        userIdArb,
        tenantIdArb,
        fc.constantFrom('NETWORK_ERROR', 'DATABASE_ERROR', 'VALIDATION_ERROR'),
        async (permission, userId, tenantId, errorType) => {
          // Arrange
          const user = { user_id: userId, tenant_id: tenantId, email: 'test@example.com' };
          const request = { headers: {}, user };
          const mockContext = createMockExecutionContext(request);
          
          reflector.getAllAndOverride.mockReturnValue([permission]);
          
          // Mock different types of errors
          const error = errorType === 'VALIDATION_ERROR' 
            ? new RBACException('Invalid entity type', RBACErrorCode.INVALID_ENTITY_TYPE, 400)
            : new Error(`${errorType}: Connection failed`);
            
          permissionService.hasPermission.mockRejectedValue(error);

          // Act & Assert
          await expect(guard.canActivate(mockContext)).rejects.toThrow();
          
          if (errorType === 'VALIDATION_ERROR') {
            // RBAC exceptions should be re-thrown as-is
            await expect(guard.canActivate(mockContext)).rejects.toThrow(RBACException);
          } else {
            // Other errors should be converted to system errors
            await expect(guard.canActivate(mockContext)).rejects.toThrow();
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 15.8: Enhanced tenant validation should work correctly
   */
  it('should properly validate tenant access in enhanced mode', async () => {
    await fc.assert(
      fc.asyncProperty(
        permissionArb,
        userIdArb,
        tenantIdArb,
        fc.boolean(),
        async (permission, userId, tenantId, hasAccess) => {
          // Reset mocks for this test run
          jest.clearAllMocks();
          
          // Arrange
          const user = { user_id: userId, tenant_id: tenantId, email: 'test@example.com' };
          const request = { headers: {}, user };
          const mockContext = createMockExecutionContext(request);
          
          reflector.getAllAndOverride.mockReturnValue([permission]);
          permissionService.hasPermission.mockResolvedValue(true);
          permissionService.validateUserTenantAccess.mockResolvedValue(hasAccess);

          // Act
          if (hasAccess) {
            const result = await guard.canActivateWithTenantValidation(mockContext);
            expect(result).toBe(true);
          } else {
            await expect(guard.canActivateWithTenantValidation(mockContext)).rejects.toThrow(RBACException);
          }

          // Assert
          expect(permissionService.validateUserTenantAccess).toHaveBeenCalledWith(userId, tenantId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 15.9: Multiple permissions should all be checked
   */
  it('should check all required permissions before granting access', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(permissionArb, { minLength: 2, maxLength: 10 }),
        userIdArb,
        tenantIdArb,
        async (requiredPermissions, userId, tenantId) => {
          // Reset mocks for this test run
          jest.clearAllMocks();
          
          // Arrange
          const user = { user_id: userId, tenant_id: tenantId, email: 'test@example.com' };
          const request = { headers: {}, user };
          const mockContext = createMockExecutionContext(request);
          
          reflector.getAllAndOverride.mockReturnValue(requiredPermissions);
          permissionService.hasPermission.mockResolvedValue(true);

          // Act
          const result = await guard.canActivate(mockContext);

          // Assert
          expect(result).toBe(true);
          expect(permissionService.hasPermission).toHaveBeenCalledTimes(requiredPermissions.length);
          
          // Verify each permission was checked (including duplicates)
          requiredPermissions.forEach((permission, index) => {
            expect(permissionService.hasPermission).toHaveBeenNthCalledWith(
              index + 1,
              userId,
              tenantId,
              permission.entityType,
              permission.action
            );
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 15.10: Case-insensitive header handling should work correctly
   */
  it('should handle tenant ID headers case-insensitively', async () => {
    await fc.assert(
      fc.asyncProperty(
        permissionArb,
        userIdArb,
        tenantIdArb,
        fc.constantFrom('x-tenant-id', 'X-Tenant-ID', 'X-TENANT-ID'),
        async (permission, userId, tenantId, headerName) => {
          // Reset mocks for this test run
          jest.clearAllMocks();
          
          // Arrange
          const user = { user_id: userId, email: 'test@example.com' };
          const request = {
            headers: { [headerName]: tenantId },
            user,
          };
          const mockContext = createMockExecutionContext(request);
          
          reflector.getAllAndOverride.mockReturnValue([permission]);
          permissionService.hasPermission.mockResolvedValue(true);

          // Act
          const result = await guard.canActivate(mockContext);

          // Assert
          expect(result).toBe(true);
          expect(tenantContextService.setTenantContext).toHaveBeenCalledWith(tenantId, userId);
          expect(permissionService.hasPermission).toHaveBeenCalledWith(
            userId,
            tenantId,
            permission.entityType,
            permission.action
          );
        }
      ),
      { numRuns: 50 }
    );
  });

  // Helper function to create mock execution context
  function createMockExecutionContext(request: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
        getNext: () => jest.fn(),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      getArgs: () => [],
      getArgByIndex: () => ({}),
      switchToRpc: () => ({
        getData: () => ({}),
        getContext: () => ({}),
      }),
      switchToWs: () => ({
        getData: () => ({}),
        getClient: () => ({}),
      }),
      getType: () => 'http' as any,
    };
  }
});