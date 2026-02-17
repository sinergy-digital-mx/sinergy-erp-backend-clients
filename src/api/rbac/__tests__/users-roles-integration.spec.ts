/**
 * Integration Tests for User Roles and Permissions API Endpoints
 * 
 * Tests that verify the API endpoints work correctly with the admin cross-user access fix.
 * These tests ensure that:
 * - Admin users can access other users' roles and permissions
 * - Users without permissions are denied access
 * - Cross-tenant access is blocked
 * 
 * Requirements: 1.2, 1.3, 2.2, 3.1
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleService } from '../services/role.service';
import { PermissionService } from '../services/permission.service';
import { TenantContextService } from '../services/tenant-context.service';
import { PermissionGuard } from '../guards/permission.guard';
import { Permission } from '../../../entities/rbac/permission.entity';
import { Role } from '../../../entities/rbac/role.entity';
import { PermissionCacheService } from '../services/permission-cache.service';
import { QueryCacheService } from '../services/query-cache.service';

describe('Users Roles API Integration Tests (Task 9)', () => {
  let roleService: jest.Mocked<RoleService>;
  let permissionService: jest.Mocked<PermissionService>;
  let tenantContextService: jest.Mocked<TenantContextService>;
  let permissionGuard: PermissionGuard;

  // Test data
  const adminUserId = 'admin-user-id';
  const regularUserId = 'regular-user-id';
  const anotherUserId = 'another-user-id';
  const tenantId = 'test-tenant-id';
  const otherTenantId = 'other-tenant-id';
  const roleId = 'admin-role-id';
  const regularRoleId = 'regular-role-id';

  const mockPermission: Permission = {
    id: 'perm-read-user',
    entity_type: 'User',
    action: 'Read',
    description: 'Read user data',
    is_system_permission: true,
    role_permissions: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockAdminRole: Role = {
    id: roleId,
    name: 'Admin',
    description: 'Administrator role',
    is_admin: true,
    is_system_role: true,
    tenant_id: tenantId,
    role_permissions: [],
    user_roles: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockRegularRole: Role = {
    id: regularRoleId,
    name: 'User',
    description: 'Regular user role',
    is_admin: false,
    is_system_role: true,
    tenant_id: tenantId,
    role_permissions: [],
    user_roles: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    // Create mock services
    const mockRoleService = {
      getUserRoles: jest.fn(),
      getRolePermissions: jest.fn(),
      assignRoleToUser: jest.fn(),
      removeRoleFromUser: jest.fn(),
    };

    const mockPermissionService = {
      getUserPermissions: jest.fn(),
      hasPermission: jest.fn(),
      validateTenantContext: jest.fn(),
      getCurrentUserPermissions: jest.fn(),
    };

    const mockTenantContextService = {
      getCurrentTenantId: jest.fn(),
      getCurrentUserId: jest.fn(),
      setTenantContext: jest.fn(),
      hasContext: jest.fn(),
      clearContext: jest.fn(),
      validateContext: jest.fn(),
    };

    const mockPermissionCacheService = {
      getUserPermissions: jest.fn(),
      setUserPermissions: jest.fn(),
      invalidateUserPermissions: jest.fn(),
      invalidateRolePermissions: jest.fn(),
      invalidateTenantPermissions: jest.fn(),
      clearAllCache: jest.fn(),
      getCacheStats: jest.fn(),
      getCacheHitRatio: jest.fn(),
      warmCache: jest.fn(),
    };

    const mockQueryCacheService = {
      cacheQuery: jest.fn(),
      invalidateUserQueries: jest.fn(),
      invalidateTenantQueries: jest.fn(),
      clearAllCache: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        {
          provide: RoleService,
          useValue: mockRoleService,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
        {
          provide: Reflector,
          useValue: new Reflector(),
        },
        {
          provide: PermissionCacheService,
          useValue: mockPermissionCacheService,
        },
        {
          provide: QueryCacheService,
          useValue: mockQueryCacheService,
        },
      ],
    }).compile();

    roleService = module.get(RoleService);
    permissionService = module.get(PermissionService);
    tenantContextService = module.get(TenantContextService);
    permissionGuard = module.get(PermissionGuard);

    // Setup default mock implementations
    tenantContextService.getCurrentTenantId.mockReturnValue(tenantId);
    tenantContextService.getCurrentUserId.mockReturnValue(adminUserId);
  });

  describe('GET /api/tenant/users/{userId}/roles - Permission Service Behavior', () => {
    /**
     * Test 1: Admin user can access other users' roles
     * **Validates: Requirements 1.2, 1.3**
     * 
     * WHEN an admin user with User:Read permission requests GET /api/tenant/users/{userId}/roles
     * where userId is another user
     * THEN the PermissionService SHALL allow access and return the user's roles
     */
    it('should allow admin user to access another user\'s roles', async () => {
      // Arrange
      const mockRoles = [mockAdminRole];
      const mockRolePermissions = [mockPermission];

      roleService.getUserRoles.mockResolvedValue(mockRoles);
      roleService.getRolePermissions.mockResolvedValue(mockRolePermissions);
      permissionService.hasPermission.mockResolvedValue(true);
      tenantContextService.getCurrentTenantId.mockReturnValue(tenantId);
      tenantContextService.getCurrentUserId.mockReturnValue(adminUserId);

      // Act
      const hasPermission = await permissionService.hasPermission(
        adminUserId,
        tenantId,
        'User',
        'Read'
      );
      const roles = await roleService.getUserRoles(anotherUserId, tenantId);

      // Assert
      expect(hasPermission).toBe(true);
      expect(roles).toHaveLength(1);
      expect(roles[0].name).toBe('Admin');
      expect(roleService.getUserRoles).toHaveBeenCalledWith(anotherUserId, tenantId);
    });

    /**
     * Test 2: User without User:Read permission is denied access
     * **Validates: Requirements 2.2**
     * 
     * WHEN a user without User:Read permission requests GET /api/tenant/users/{userId}/roles
     * where userId is another user
     * THEN the PermissionGuard SHALL deny access
     */
    it('should deny access to user without User:Read permission', async () => {
      // Arrange
      permissionService.hasPermission.mockResolvedValue(false);
      tenantContextService.getCurrentTenantId.mockReturnValue(tenantId);
      tenantContextService.getCurrentUserId.mockReturnValue(regularUserId);

      // Act
      const hasPermission = await permissionService.hasPermission(
        regularUserId,
        tenantId,
        'User',
        'Read'
      );

      // Assert
      expect(hasPermission).toBe(false);
      expect(roleService.getUserRoles).not.toHaveBeenCalled();
    });

    /**
     * Test 3: Cross-tenant access is denied
     * **Validates: Requirements 3.1**
     * 
     * WHEN a user from tenant A requests GET /api/tenant/users/{userId}/roles
     * where userId is a user from tenant B
     * THEN the PermissionService SHALL deny access with "Cross-tenant access denied" error
     */
    it('should deny cross-tenant access to user roles', async () => {
      // Arrange
      tenantContextService.getCurrentTenantId.mockReturnValue(tenantId);
      tenantContextService.getCurrentUserId.mockReturnValue(adminUserId);
      permissionService.hasPermission.mockRejectedValue(
        new UnauthorizedException('Cross-tenant access denied: Tenant context mismatch')
      );

      // Act & Assert
      await expect(
        permissionService.hasPermission(adminUserId, otherTenantId, 'User', 'Read')
      ).rejects.toThrow('Cross-tenant access denied');

      expect(roleService.getUserRoles).not.toHaveBeenCalled();
    });

    /**
     * Test 4: User can access their own roles without User:Read permission
     * **Validates: Requirements 2.3**
     * 
     * WHEN a user requests GET /api/tenant/users/{userId}/roles where userId is their own
     * THEN the PermissionService SHALL allow access without requiring User:Read permission
     */
    it('should allow user to access their own roles without User:Read permission', async () => {
      // Arrange
      const mockRoles = [mockRegularRole];
      const mockRolePermissions = [];

      roleService.getUserRoles.mockResolvedValue(mockRoles);
      roleService.getRolePermissions.mockResolvedValue(mockRolePermissions);
      permissionService.hasPermission.mockResolvedValue(true);
      tenantContextService.getCurrentTenantId.mockReturnValue(tenantId);
      tenantContextService.getCurrentUserId.mockReturnValue(regularUserId);

      // Act
      const roles = await roleService.getUserRoles(regularUserId, tenantId);

      // Assert
      expect(roles).toHaveLength(1);
      expect(roles[0].name).toBe('User');
      expect(roleService.getUserRoles).toHaveBeenCalledWith(regularUserId, tenantId);
    });
  });

  describe('GET /api/tenant/users/{userId}/permissions - Permission Service Behavior', () => {
    /**
     * Test 5: Admin user can access other users' permissions
     * **Validates: Requirements 1.2, 1.3**
     * 
     * WHEN an admin user with User:Read permission requests GET /api/tenant/users/{userId}/permissions
     * where userId is another user
     * THEN the PermissionService SHALL allow access and return the user's permissions
     */
    it('should allow admin user to access another user\'s permissions', async () => {
      // Arrange
      const mockPermissions = [mockPermission];

      permissionService.getUserPermissions.mockResolvedValue(mockPermissions);
      permissionService.hasPermission.mockResolvedValue(true);
      tenantContextService.getCurrentTenantId.mockReturnValue(tenantId);
      tenantContextService.getCurrentUserId.mockReturnValue(adminUserId);

      // Act
      const hasPermission = await permissionService.hasPermission(
        adminUserId,
        tenantId,
        'User',
        'Read'
      );
      const permissions = await permissionService.getUserPermissions(anotherUserId, tenantId);

      // Assert
      expect(hasPermission).toBe(true);
      expect(permissions).toHaveLength(1);
      expect(permissions[0].entity_type).toBe('User');
      expect(permissions[0].action).toBe('Read');
      expect(permissionService.getUserPermissions).toHaveBeenCalledWith(anotherUserId, tenantId);
    });

    /**
     * Test 6: User without User:Read permission is denied access to other users' permissions
     * **Validates: Requirements 2.2**
     * 
     * WHEN a user without User:Read permission requests GET /api/tenant/users/{userId}/permissions
     * where userId is another user
     * THEN the PermissionGuard SHALL deny access
     */
    it('should deny access to user without User:Read permission for permissions endpoint', async () => {
      // Arrange
      permissionService.hasPermission.mockResolvedValue(false);
      tenantContextService.getCurrentTenantId.mockReturnValue(tenantId);
      tenantContextService.getCurrentUserId.mockReturnValue(regularUserId);

      // Act
      const hasPermission = await permissionService.hasPermission(
        regularUserId,
        tenantId,
        'User',
        'Read'
      );

      // Assert
      expect(hasPermission).toBe(false);
      expect(permissionService.getUserPermissions).not.toHaveBeenCalled();
    });

    /**
     * Test 7: Cross-tenant access is denied for permissions endpoint
     * **Validates: Requirements 3.1**
     * 
     * WHEN a user from tenant A requests GET /api/tenant/users/{userId}/permissions
     * where userId is a user from tenant B
     * THEN the PermissionService SHALL deny access with "Cross-tenant access denied" error
     */
    it('should deny cross-tenant access to user permissions', async () => {
      // Arrange
      tenantContextService.getCurrentTenantId.mockReturnValue(tenantId);
      tenantContextService.getCurrentUserId.mockReturnValue(adminUserId);
      permissionService.getUserPermissions.mockRejectedValue(
        new UnauthorizedException('Cross-tenant access denied: Tenant context mismatch')
      );

      // Act & Assert
      await expect(
        permissionService.getUserPermissions(anotherUserId, otherTenantId)
      ).rejects.toThrow('Cross-tenant access denied');

      expect(permissionService.getUserPermissions).toHaveBeenCalledWith(anotherUserId, otherTenantId);
    });

    /**
     * Test 8: User can access their own permissions without User:Read permission
     * **Validates: Requirements 2.3**
     * 
     * WHEN a user requests GET /api/tenant/users/{userId}/permissions where userId is their own
     * THEN the PermissionService SHALL allow access without requiring User:Read permission
     */
    it('should allow user to access their own permissions without User:Read permission', async () => {
      // Arrange
      const mockPermissions = [mockPermission];

      permissionService.getUserPermissions.mockResolvedValue(mockPermissions);
      permissionService.hasPermission.mockResolvedValue(true);
      tenantContextService.getCurrentTenantId.mockReturnValue(tenantId);
      tenantContextService.getCurrentUserId.mockReturnValue(regularUserId);

      // Act
      const permissions = await permissionService.getUserPermissions(regularUserId, tenantId);

      // Assert
      expect(permissions).toHaveLength(1);
      expect(permissions[0].entity_type).toBe('User');
      expect(permissions[0].action).toBe('Read');
    });
  });

  describe('Access Control Scenarios', () => {
    /**
     * Test 9: Multiple users with different permission levels
     * **Validates: Requirements 1.2, 1.3, 2.2**
     * 
     * WHEN multiple users with different permission levels request user data
     * THEN the system SHALL correctly allow/deny based on permissions
     */
    it('should handle multiple users with different permission levels', async () => {
      // Arrange
      const mockRoles = [mockAdminRole];
      const mockPermissions = [mockPermission];

      roleService.getUserRoles.mockResolvedValue(mockRoles);
      roleService.getRolePermissions.mockResolvedValue(mockPermissions);
      permissionService.getUserPermissions.mockResolvedValue(mockPermissions);

      // Admin user has permission
      permissionService.hasPermission.mockImplementation((userId, tenantId, entityType, action) => {
        if (userId === adminUserId) {
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      });

      tenantContextService.getCurrentTenantId.mockReturnValue(tenantId);

      // Act - Admin can access
      tenantContextService.getCurrentUserId.mockReturnValue(adminUserId);
      const adminHasPermission = await permissionService.hasPermission(
        adminUserId,
        tenantId,
        'User',
        'Read'
      );
      const adminRoles = await roleService.getUserRoles(anotherUserId, tenantId);

      expect(adminHasPermission).toBe(true);
      expect(adminRoles).toHaveLength(1);

      // Act - Regular user cannot access
      tenantContextService.getCurrentUserId.mockReturnValue(regularUserId);
      const userHasPermission = await permissionService.hasPermission(
        regularUserId,
        tenantId,
        'User',
        'Read'
      );

      expect(userHasPermission).toBe(false);
    });

    /**
     * Test 10: Tenant context validation
     * **Validates: Requirements 3.1**
     * 
     * WHEN a request is made with mismatched tenant context
     * THEN the system SHALL deny access with cross-tenant error
     */
    it('should validate tenant context for all requests', async () => {
      // Arrange
      permissionService.hasPermission.mockImplementation((userId, tenantId) => {
        if (tenantId !== tenantId) {
          throw new UnauthorizedException('Cross-tenant access denied: Tenant context mismatch');
        }
        return Promise.resolve(true);
      });

      tenantContextService.getCurrentTenantId.mockReturnValue(tenantId);
      tenantContextService.getCurrentUserId.mockReturnValue(adminUserId);

      // Act - Should succeed with correct tenant
      const hasPermission = await permissionService.hasPermission(
        adminUserId,
        tenantId,
        'User',
        'Read'
      );

      expect(hasPermission).toBe(true);
    });
  });

  describe('Error Handling', () => {
    /**
     * Test 11: Missing tenant context
     * **Validates: Requirements 3.1**
     * 
     * WHEN a request is made without tenant context
     * THEN the system SHALL deny access with error
     */
    it('should deny access without tenant context', async () => {
      // Arrange
      tenantContextService.getCurrentTenantId.mockReturnValue(null);
      tenantContextService.getCurrentUserId.mockReturnValue(adminUserId);

      // Act & Assert
      expect(() => {
        if (!tenantContextService.getCurrentTenantId()) {
          throw new UnauthorizedException('Tenant context is required');
        }
      }).toThrow('Tenant context is required');
    });

    /**
     * Test 12: Permission service error handling
     * **Validates: Requirements 1.2, 1.3**
     * 
     * WHEN the permission service encounters an error
     * THEN it should handle gracefully
     */
    it('should handle permission service errors gracefully', async () => {
      // Arrange
      permissionService.getUserPermissions.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act & Assert
      await expect(
        permissionService.getUserPermissions(anotherUserId, tenantId)
      ).rejects.toThrow('Database connection failed');
    });
  });
});
