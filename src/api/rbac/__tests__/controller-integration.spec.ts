/**
 * Integration Tests for RBAC Controller Integration
 * 
 * Tests that verify the RBAC system works correctly with permission decorators
 * and guards without requiring full controller dependencies.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PermissionGuard } from '../guards/permission.guard';
import { PermissionService } from '../services/permission.service';
import { TenantContextService } from '../services/tenant-context.service';
import { PERMISSIONS_KEY, RequireCustomerRead, RequireLeadCreate, RequireUserUpdate } from '../decorators/require-permissions.decorator';
import { RBACException } from '../errors/rbac-exceptions';

// Mock controller classes for testing decorators
class MockCustomerController {
  @RequireCustomerRead()
  findAll() {
    return 'customers';
  }
}

class MockLeadController {
  @RequireLeadCreate()
  create() {
    return 'lead created';
  }
}

class MockUserController {
  @RequireUserUpdate()
  update() {
    return 'user updated';
  }
}

describe('RBAC Controller Integration', () => {
  let permissionGuard: PermissionGuard;
  let permissionService: jest.Mocked<PermissionService>;
  let tenantContextService: jest.Mocked<TenantContextService>;
  let reflector: jest.Mocked<Reflector>;
  let customerController: MockCustomerController;
  let leadController: MockLeadController;
  let userController: MockUserController;

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

    permissionGuard = module.get<PermissionGuard>(PermissionGuard);
    permissionService = module.get(PermissionService);
    tenantContextService = module.get(TenantContextService);
    reflector = module.get(Reflector);

    customerController = new MockCustomerController();
    leadController = new MockLeadController();
    userController = new MockUserController();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Permission Decorators', () => {
    it('should have correct permissions metadata on customer endpoints', () => {
      // Test that the decorators are properly applied
      const readMetadata = Reflect.getMetadata(PERMISSIONS_KEY, customerController.findAll);
      expect(readMetadata).toEqual([{ entityType: 'Customer', action: 'Read' }]);
    });

    it('should have correct permissions metadata on lead endpoints', () => {
      const createMetadata = Reflect.getMetadata(PERMISSIONS_KEY, leadController.create);
      expect(createMetadata).toEqual([{ entityType: 'Lead', action: 'Create' }]);
    });

    it('should have correct permissions metadata on user endpoints', () => {
      const updateMetadata = Reflect.getMetadata(PERMISSIONS_KEY, userController.update);
      expect(updateMetadata).toEqual([{ entityType: 'User', action: 'Update' }]);
    });
  });

  describe('Permission Guard Integration', () => {
    const mockUser = {
      user_id: 'test-user-id',
      tenant_id: 'test-tenant-id',
      email: 'test@example.com',
    };

    const mockRequest = {
      headers: {},
      user: mockUser,
    };

    const createMockExecutionContext = (request: any): ExecutionContext => ({
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
    });

    it('should allow access when user has required customer permissions', async () => {
      // Arrange
      const mockContext = createMockExecutionContext(mockRequest);
      const requiredPermissions = [{ entityType: 'Customer', action: 'Read' }];
      
      reflector.getAllAndOverride.mockReturnValue(requiredPermissions);
      permissionService.hasPermission.mockResolvedValue(true);

      // Act
      const result = await permissionGuard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
      expect(tenantContextService.setTenantContext).toHaveBeenCalledWith(
        mockUser.tenant_id,
        mockUser.user_id
      );
      expect(permissionService.hasPermission).toHaveBeenCalledWith(
        mockUser.user_id,
        mockUser.tenant_id,
        'Customer',
        'Read'
      );
    });

    it('should deny access when user lacks required lead permissions', async () => {
      // Arrange
      const mockContext = createMockExecutionContext(mockRequest);
      const requiredPermissions = [{ entityType: 'Lead', action: 'Create' }];
      
      reflector.getAllAndOverride.mockReturnValue(requiredPermissions);
      permissionService.hasPermission.mockResolvedValue(false);

      // Act & Assert
      await expect(permissionGuard.canActivate(mockContext)).rejects.toThrow(RBACException);
      expect(permissionService.hasPermission).toHaveBeenCalledWith(
        mockUser.user_id,
        mockUser.tenant_id,
        'Lead',
        'Create'
      );
    });

    it('should handle multiple permission requirements', async () => {
      // Arrange
      const mockContext = createMockExecutionContext(mockRequest);
      const requiredPermissions = [
        { entityType: 'User', action: 'Read' },
        { entityType: 'User', action: 'Update' },
      ];
      
      reflector.getAllAndOverride.mockReturnValue(requiredPermissions);
      permissionService.hasPermission.mockResolvedValue(true);

      // Act
      const result = await permissionGuard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
      expect(permissionService.hasPermission).toHaveBeenCalledTimes(2);
      expect(permissionService.hasPermission).toHaveBeenCalledWith(
        mockUser.user_id,
        mockUser.tenant_id,
        'User',
        'Read'
      );
      expect(permissionService.hasPermission).toHaveBeenCalledWith(
        mockUser.user_id,
        mockUser.tenant_id,
        'User',
        'Update'
      );
    });

    it('should use tenant ID from header when provided', async () => {
      // Arrange
      const headerTenantId = 'header-tenant-id';
      const requestWithHeader = {
        headers: { 'x-tenant-id': headerTenantId },
        user: mockUser,
      };
      const mockContext = createMockExecutionContext(requestWithHeader);
      const requiredPermissions = [{ entityType: 'Customer', action: 'Read' }];
      
      reflector.getAllAndOverride.mockReturnValue(requiredPermissions);
      permissionService.hasPermission.mockResolvedValue(true);

      // Act
      const result = await permissionGuard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
      expect(tenantContextService.setTenantContext).toHaveBeenCalledWith(
        headerTenantId,
        mockUser.user_id
      );
      expect(permissionService.hasPermission).toHaveBeenCalledWith(
        mockUser.user_id,
        headerTenantId,
        'Customer',
        'Read'
      );
    });

    it('should deny access when no tenant context is available', async () => {
      // Arrange
      const userWithoutTenant = {
        user_id: 'test-user-id',
        email: 'test@example.com',
        // No tenant_id
      };
      const requestWithoutTenant = {
        headers: {}, // No tenant header
        user: userWithoutTenant,
      };
      const mockContext = createMockExecutionContext(requestWithoutTenant);
      const requiredPermissions = [{ entityType: 'Customer', action: 'Read' }];
      
      reflector.getAllAndOverride.mockReturnValue(requiredPermissions);

      // Act & Assert
      await expect(permissionGuard.canActivate(mockContext)).rejects.toThrow(RBACException);
      expect(permissionService.hasPermission).not.toHaveBeenCalled();
    });
  });

  describe('Decorator Functionality', () => {
    it('should execute decorated methods when permissions are granted', () => {
      // This test verifies that the decorators don't interfere with method execution
      expect(customerController.findAll()).toBe('customers');
      expect(leadController.create()).toBe('lead created');
      expect(userController.update()).toBe('user updated');
    });

    it('should preserve method metadata after decoration', () => {
      // Verify that decorators preserve the original method functionality
      const customerMethod = customerController.findAll;
      const leadMethod = leadController.create;
      const userMethod = userController.update;

      expect(typeof customerMethod).toBe('function');
      expect(typeof leadMethod).toBe('function');
      expect(typeof userMethod).toBe('function');

      // Verify metadata is attached
      expect(Reflect.getMetadata(PERMISSIONS_KEY, customerMethod)).toBeDefined();
      expect(Reflect.getMetadata(PERMISSIONS_KEY, leadMethod)).toBeDefined();
      expect(Reflect.getMetadata(PERMISSIONS_KEY, userMethod)).toBeDefined();
    });
  });

  describe('Error Handling Integration', () => {
    const mockUser = {
      user_id: 'test-user-id',
      tenant_id: 'test-tenant-id',
      email: 'test@example.com',
    };

    const mockRequest = {
      headers: {},
      user: mockUser,
    };

    const createMockExecutionContext = (request: any): ExecutionContext => ({
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
    });

    it('should properly handle permission service errors', async () => {
      // Arrange
      const mockContext = createMockExecutionContext(mockRequest);
      const requiredPermissions = [{ entityType: 'Customer', action: 'Read' }];
      
      reflector.getAllAndOverride.mockReturnValue(requiredPermissions);
      permissionService.hasPermission.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(permissionGuard.canActivate(mockContext)).rejects.toThrow();
    });

    it('should handle RBAC exceptions correctly', async () => {
      // Arrange
      const mockContext = createMockExecutionContext(mockRequest);
      const requiredPermissions = [{ entityType: 'Customer', action: 'Read' }];
      
      reflector.getAllAndOverride.mockReturnValue(requiredPermissions);
      const rbacError = new RBACException('Permission denied', 'PERMISSION_DENIED', 403);
      permissionService.hasPermission.mockRejectedValue(rbacError);

      // Act & Assert
      await expect(permissionGuard.canActivate(mockContext)).rejects.toThrow(RBACException);
      // Note: The guard re-throws RBAC exceptions as-is, so the original message should be preserved
      await expect(permissionGuard.canActivate(mockContext)).rejects.toThrow(rbacError);
    });
  });
});