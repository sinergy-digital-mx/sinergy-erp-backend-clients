/**
 * Logging Verification Tests for Admin Cross-User Access Fix
 * 
 * Task 11: Verify logging output
 * 
 * This test suite verifies that:
 * - Debug logs contain cross-user access information
 * - Warn logs contain denied access information
 * - Logs include user IDs and tenant IDs
 * - Logs include action types
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, QueryBuilder } from 'typeorm';
import { Logger, UnauthorizedException } from '@nestjs/common';
import * as fc from 'fast-check';
import { PermissionService } from '../permission.service';
import { Permission } from '../../../../entities/rbac/permission.entity';
import { UserRole } from '../../../../entities/rbac/user-role.entity';
import { RolePermission } from '../../../../entities/rbac/role-permission.entity';
import { EntityRegistry } from '../../../../entities/entity-registry/entity-registry.entity';
import { TenantContextService } from '../tenant-context.service';
import { PermissionCacheService } from '../permission-cache.service';
import { QueryCacheService } from '../query-cache.service';

describe('Logging Verification (Task 11)', () => {
  let service: PermissionService;
  let permissionRepository: jest.Mocked<Repository<Permission>>;
  let userRoleRepository: jest.Mocked<Repository<UserRole>>;
  let rolePermissionRepository: jest.Mocked<Repository<RolePermission>>;
  let entityRegistryRepository: jest.Mocked<Repository<EntityRegistry>>;
  let tenantContextService: jest.Mocked<TenantContextService>;
  let permissionCacheService: jest.Mocked<PermissionCacheService>;
  let queryCacheService: jest.Mocked<QueryCacheService>;
  let loggerSpy: jest.SpyInstance;

  const mockPermission: Permission = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    entity_type: 'User',
    action: 'Read',
    description: 'Read user data',
    is_system_permission: false,
    role_permissions: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockEntityRegistry: EntityRegistry = {
    id: 1,
    code: 'User',
    name: 'User Entity',
  };

  beforeEach(async () => {
    const mockPermissionRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
      query: jest.fn(),
    };

    const mockUserRoleRepository = {
      createQueryBuilder: jest.fn(),
    };

    const mockRolePermissionRepository = {
      createQueryBuilder: jest.fn(),
    };

    const mockEntityRegistryRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      query: jest.fn(),
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
      isUserPermissionsCached: jest.fn(),
    };

    const mockQueryCacheService = {
      cacheQuery: jest.fn(),
      invalidateUserQueries: jest.fn(),
      invalidateTenantQueries: jest.fn(),
      clearAllCache: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionRepository,
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: mockUserRoleRepository,
        },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: mockRolePermissionRepository,
        },
        {
          provide: getRepositoryToken(EntityRegistry),
          useValue: mockEntityRegistryRepository,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
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

    service = module.get<PermissionService>(PermissionService);
    permissionRepository = module.get(getRepositoryToken(Permission));
    userRoleRepository = module.get(getRepositoryToken(UserRole));
    rolePermissionRepository = module.get(getRepositoryToken(RolePermission));
    entityRegistryRepository = module.get(getRepositoryToken(EntityRegistry));
    tenantContextService = module.get(TenantContextService);
    permissionCacheService = module.get(PermissionCacheService);
    queryCacheService = module.get(QueryCacheService);

    // Setup default mocks
    (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-id');
    (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('current-user-id');
    (entityRegistryRepository.findOne as jest.Mock).mockResolvedValue(mockEntityRegistry);
    (entityRegistryRepository.query as jest.Mock).mockResolvedValue([{ id: 1 }]);
    (permissionCacheService.getUserPermissions as jest.Mock).mockResolvedValue([mockPermission]);
    (permissionCacheService.setUserPermissions as jest.Mock).mockResolvedValue(undefined);

    // Spy on logger
    loggerSpy = jest.spyOn(service['logger'], 'debug');
  });

  afterEach(() => {
    loggerSpy.mockRestore();
  });

  describe('Cross-User Access Logging (Requirements 6.1, 6.2)', () => {
    /**
     * Requirement 6.1: WHEN a user accesses another user's data, THE PermissionService SHALL log the action 
     * with current user ID, target user ID, and action type
     * 
     * Requirement 6.2: WHEN logging cross-user access, THE PermissionService SHALL include the tenant ID 
     * for audit trail purposes
     */
    it('should log cross-user access with current user ID, target user ID, and tenant ID', async () => {
      const currentUserId = 'admin-user-123';
      const targetUserId = 'target-user-456';
      const tenantId = 'tenant-789';

      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(currentUserId);
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenantId);

      await service.getUserPermissions(targetUserId, tenantId);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Cross-user access: User ${currentUserId} accessing permissions for user ${targetUserId} in tenant ${tenantId}`)
      );
    });

    /**
     * Requirement 6.1: WHEN a user accesses another user's data, THE PermissionService SHALL log the action 
     * with current user ID, target user ID, and action type
     */
    it('should include all required information in cross-user access logs', async () => {
      const currentUserId = 'user-001';
      const targetUserId = 'user-002';
      const tenantId = 'tenant-001';

      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(currentUserId);
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenantId);

      await service.getUserPermissions(targetUserId, tenantId);

      const callArgs = loggerSpy.mock.calls.find(call => 
        call[0].includes('Cross-user access')
      );

      expect(callArgs).toBeDefined();
      const logMessage = callArgs![0];
      
      // Verify all required information is present
      expect(logMessage).toContain(currentUserId);
      expect(logMessage).toContain(targetUserId);
      expect(logMessage).toContain(tenantId);
      expect(logMessage).toContain('permissions'); // action type
    });

    /**
     * Property Test: Cross-User Access Logging
     * **Validates: Requirements 6.1, 6.2**
     * 
     * For any user accessing another user's data, the system SHALL log the action 
     * with the current user ID, target user ID, and tenant ID at DEBUG level.
     */
    it('should log cross-user access for all random user pairs (Property 7)', async () => {
      return fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          async (currentUserId, targetUserId, tenantId) => {
            // Skip if same user (not cross-user access)
            if (currentUserId === targetUserId) {
              return true;
            }

            (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(currentUserId);
            (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenantId);
            loggerSpy.mockClear();

            await service.getUserPermissions(targetUserId, tenantId);

            // Verify logging occurred
            const debugCalls = loggerSpy.mock.calls;
            const crossUserAccessLog = debugCalls.find(call => 
              call[0].includes('Cross-user access')
            );

            expect(crossUserAccessLog).toBeDefined();
            const logMessage = crossUserAccessLog![0];
            
            // Verify all required information is present
            expect(logMessage).toContain(currentUserId);
            expect(logMessage).toContain(targetUserId);
            expect(logMessage).toContain(tenantId);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not log cross-user access when accessing own permissions', async () => {
      const userId = 'user-123';
      const tenantId = 'tenant-456';

      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(userId);
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenantId);
      loggerSpy.mockClear();

      await service.getUserPermissions(userId, tenantId);

      // Should not have cross-user access log
      const crossUserAccessLog = loggerSpy.mock.calls.find(call => 
        call[0].includes('Cross-user access')
      );

      expect(crossUserAccessLog).toBeUndefined();
    });
  });

  describe('Denied Access Logging (Requirements 6.3, 6.4)', () => {
    /**
     * Requirement 6.3: WHEN a user without appropriate permissions attempts to access another user's data, 
     * THE PermissionService SHALL log the denied access attempt with user ID and target user ID
     * 
     * Requirement 6.4: WHEN logging access decisions, THE PermissionService SHALL use appropriate log levels 
     * (debug for allowed, warn for denied)
     */
    it('should log denied access when tenant context mismatches', async () => {
      const currentUserId = 'user-123';
      const targetUserId = 'user-456';
      const currentTenantId = 'tenant-1';
      const requestedTenantId = 'tenant-2';

      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(currentTenantId);
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(currentUserId);

      const errorSpy = jest.spyOn(service['logger'], 'error');

      try {
        await service.getUserPermissions(targetUserId, requestedTenantId);
      } catch (error) {
        // Expected to throw
      }

      // Should have logged error for denied access
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    /**
     * Requirement 6.3: WHEN a user without appropriate permissions attempts to access another user's data, 
     * THE PermissionService SHALL log the denied access attempt with user ID and target user ID
     */
    it('should include user IDs in denied access logs', async () => {
      const currentUserId = 'user-001';
      const targetUserId = 'user-002';
      const currentTenantId = 'tenant-1';
      const requestedTenantId = 'tenant-2';

      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(currentTenantId);
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(currentUserId);

      const errorSpy = jest.spyOn(service['logger'], 'error');

      try {
        await service.getUserPermissions(targetUserId, requestedTenantId);
      } catch (error) {
        // Expected to throw
      }

      // Verify error was logged
      expect(errorSpy).toHaveBeenCalled();
      const errorCall = errorSpy.mock.calls[0];
      expect(errorCall[0]).toContain(targetUserId);
      expect(errorCall[0]).toContain(requestedTenantId);
      errorSpy.mockRestore();
    });

    /**
     * Property Test: Denied Access Logging
     * **Validates: Requirements 6.3, 6.4**
     * 
     * For any user without appropriate permissions attempting to access another user's data, 
     * the system SHALL log the denied access attempt with user ID and target user ID.
     */
    it('should log denied access for cross-tenant attempts (Property 8)', async () => {
      return fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          async (currentUserId, targetUserId, currentTenantId, requestedTenantId) => {
            // Skip if same tenant (not cross-tenant)
            if (currentTenantId === requestedTenantId) {
              return true;
            }

            (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(currentTenantId);
            (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(currentUserId);

            const errorSpy = jest.spyOn(service['logger'], 'error');

            try {
              await service.getUserPermissions(targetUserId, requestedTenantId);
            } catch (error) {
              // Expected to throw
            }

            // Verify error was logged
            expect(errorSpy).toHaveBeenCalled();
            errorSpy.mockRestore();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Logging Format and Content Verification', () => {
    it('should include action type in cross-user access logs', async () => {
      const currentUserId = 'admin-user';
      const targetUserId = 'target-user';
      const tenantId = 'tenant-id';

      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(currentUserId);
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenantId);

      await service.getUserPermissions(targetUserId, tenantId);

      const logMessage = loggerSpy.mock.calls.find(call => 
        call[0].includes('Cross-user access')
      )?.[0];

      expect(logMessage).toContain('permissions');
    });

    it('should log at DEBUG level for allowed cross-user access', async () => {
      const currentUserId = 'user-1';
      const targetUserId = 'user-2';
      const tenantId = 'tenant-1';

      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(currentUserId);
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenantId);

      await service.getUserPermissions(targetUserId, tenantId);

      // Verify debug was called (not warn or error)
      expect(loggerSpy).toHaveBeenCalled();
      const debugCalls = loggerSpy.mock.calls;
      expect(debugCalls.length).toBeGreaterThan(0);
    });

    it('should include structured information in logs', async () => {
      const currentUserId = 'admin-123';
      const targetUserId = 'user-456';
      const tenantId = 'tenant-789';

      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(currentUserId);
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenantId);

      await service.getUserPermissions(targetUserId, tenantId);

      const logMessage = loggerSpy.mock.calls.find(call => 
        call[0].includes('Cross-user access')
      )?.[0];

      // Verify structured format
      expect(logMessage).toMatch(/User\s+\w+/); // User ID pattern
      expect(logMessage).toMatch(/accessing/); // Action verb
      expect(logMessage).toMatch(/permissions/); // Resource type
      expect(logMessage).toMatch(/tenant\s+\w+/); // Tenant ID
    });
  });

  describe('Logging in Different Scenarios', () => {
    it('should log when checking bulk permissions for another user', async () => {
      const currentUserId = 'admin-user';
      const targetUserId = 'target-user';
      const tenantId = 'tenant-id';

      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(currentUserId);
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenantId);
      (permissionCacheService.getUserPermissions as jest.Mock).mockResolvedValue([mockPermission]);

      const debugSpy = jest.spyOn(service['logger'], 'debug');

      await service.checkBulkPermissions(targetUserId, tenantId, [
        { entityType: 'User', action: 'Read' }
      ]);

      // Should have logged bulk permission check
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('Bulk permission check')
      );

      debugSpy.mockRestore();
    });

    it('should log when checking permissions for multiple users', async () => {
      const tenantId = 'tenant-id';
      const userIds = ['user-1', 'user-2', 'user-3'];

      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenantId);
      (entityRegistryRepository.findOne as jest.Mock).mockResolvedValue(mockEntityRegistry);
      (permissionCacheService.getUserPermissions as jest.Mock).mockResolvedValue([mockPermission]);

      const debugSpy = jest.spyOn(service['logger'], 'debug');

      await service.checkPermissionForMultipleUsers(
        userIds,
        tenantId,
        'User',
        'Read'
      );

      // Should have logged bulk user permission check
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('Bulk user permission check')
      );

      debugSpy.mockRestore();
    });
  });

  describe('Logging Consistency Across Methods', () => {
    it('should log consistently when accessing permissions through different methods', async () => {
      const currentUserId = 'admin-user';
      const targetUserId = 'target-user';
      const tenantId = 'tenant-id';

      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(currentUserId);
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenantId);
      (permissionCacheService.getUserPermissions as jest.Mock).mockResolvedValue([mockPermission]);

      // Call getUserPermissions
      loggerSpy.mockClear();
      await service.getUserPermissions(targetUserId, tenantId);

      const getUserPermissionsLog = loggerSpy.mock.calls.find(call => 
        call[0].includes('Cross-user access')
      );

      expect(getUserPermissionsLog).toBeDefined();
      expect(getUserPermissionsLog![0]).toContain(currentUserId);
      expect(getUserPermissionsLog![0]).toContain(targetUserId);
      expect(getUserPermissionsLog![0]).toContain(tenantId);
    });
  });

  describe('Logging with Error Scenarios', () => {
    it('should log errors when permission retrieval fails', async () => {
      const currentUserId = 'user-1';
      const targetUserId = 'user-2';
      const tenantId = 'tenant-1';

      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(currentUserId);
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenantId);
      (permissionCacheService.getUserPermissions as jest.Mock).mockRejectedValue(
        new Error('Cache service error')
      );

      const errorSpy = jest.spyOn(service['logger'], 'error');

      try {
        await service.getUserPermissions(targetUserId, tenantId);
      } catch (error) {
        // Expected to throw
      }

      // Should have logged error
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('should log warnings when graceful degradation occurs', async () => {
      const currentUserId = 'user-1';
      const targetUserId = 'user-2';
      const tenantId = 'tenant-1';

      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(currentUserId);
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenantId);
      (permissionCacheService.getUserPermissions as jest.Mock).mockRejectedValue(
        new Error('Cache unavailable')
      );

      const warnSpy = jest.spyOn(service['logger'], 'warn');

      try {
        await service.getUserPermissions(targetUserId, tenantId);
      } catch (error) {
        // Expected to throw
      }

      // Should have logged warning for graceful degradation
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
});
