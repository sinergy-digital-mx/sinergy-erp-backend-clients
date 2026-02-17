import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UnauthorizedException } from 'typeorm';
import * as fc from 'fast-check';
import { PermissionService } from '../permission.service';
import { Permission } from '../../../../entities/rbac/permission.entity';
import { UserRole } from '../../../../entities/rbac/user-role.entity';
import { RolePermission } from '../../../../entities/rbac/role-permission.entity';
import { EntityRegistry } from '../../../../entities/entity-registry/entity-registry.entity';
import { TenantContextService } from '../tenant-context.service';
import { PermissionCacheService } from '../permission-cache.service';
import { QueryCacheService } from '../query-cache.service';

describe('PermissionService - Admin Cross-User Access (Property-Based Tests)', () => {
  let service: PermissionService;
  let permissionRepository: jest.Mocked<Repository<Permission>>;
  let userRoleRepository: jest.Mocked<Repository<UserRole>>;
  let rolePermissionRepository: jest.Mocked<Repository<RolePermission>>;
  let entityRegistryRepository: jest.Mocked<Repository<EntityRegistry>>;
  let tenantContextService: jest.Mocked<TenantContextService>;
  let permissionCacheService: jest.Mocked<PermissionCacheService>;
  let queryCacheService: jest.Mocked<QueryCacheService>;

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
      findOne: jest.fn(),
      find: jest.fn(),
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
  });

  describe('Property 1: Tenant Boundary Enforcement', () => {
    /**
     * **Validates: Requirements 3.1, 3.2, 3.3**
     * 
     * For any user and any two different tenants, when a user from tenant A 
     * attempts to access data from tenant B, the system SHALL deny access with 
     * a "Cross-tenant access denied" error.
     */
    it('should deny access when tenant context does not match', () => {
      fc.assert(
        fc.property(
          fc.tuple(fc.uuid(), fc.uuid()).filter(([a, b]) => a !== b),
          fc.uuid(),
          fc.uuid(),
          ([currentTenantId, requestedTenantId], userId, targetUserId) => {
            // Setup
            tenantContextService.getCurrentTenantId.mockReturnValue(currentTenantId);
            tenantContextService.getCurrentUserId.mockReturnValue(userId);

            // Act & Assert
            expect(() => {
              (service as any).validateTenantContext(requestedTenantId, targetUserId);
            }).toThrow(UnauthorizedException);

            expect(() => {
              (service as any).validateTenantContext(requestedTenantId, targetUserId);
            }).toThrow('Cross-tenant access denied');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow access when tenant context matches', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          (tenantId, userId, targetUserId) => {
            // Setup
            tenantContextService.getCurrentTenantId.mockReturnValue(tenantId);
            tenantContextService.getCurrentUserId.mockReturnValue(userId);

            // Act & Assert - should not throw
            expect(() => {
              (service as any).validateTenantContext(tenantId, targetUserId);
            }).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: User ID Match Check Removal', () => {
    /**
     * **Validates: Requirements 1.1, 4.1**
     * 
     * For any user and any other user in the same tenant, when 
     * validateTenantContext() is called with different user IDs, 
     * the system SHALL NOT throw a "Cross-user access denied" error.
     */
    it('should not throw cross-user access error for different user IDs in same tenant', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.tuple(fc.uuid(), fc.uuid()).filter(([a, b]) => a !== b),
          (tenantId, [userId, targetUserId]) => {
            // Setup
            tenantContextService.getCurrentTenantId.mockReturnValue(tenantId);
            tenantContextService.getCurrentUserId.mockReturnValue(userId);

            // Act & Assert - should not throw cross-user access error
            expect(() => {
              (service as any).validateTenantContext(tenantId, targetUserId);
            }).not.toThrow('Cross-user access denied');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not throw any error when validateTenantContext is called with matching tenant', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          (tenantId, userId, targetUserId) => {
            // Setup
            tenantContextService.getCurrentTenantId.mockReturnValue(tenantId);
            tenantContextService.getCurrentUserId.mockReturnValue(userId);

            // Act & Assert
            expect(() => {
              (service as any).validateTenantContext(tenantId, targetUserId);
            }).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Backward Compatibility - Tenant-Only Validation', () => {
    /**
     * **Validates: Requirements 1.5, 5.1**
     * 
     * For any call to validateTenantContext() without a userId parameter, 
     * the system SHALL validate only the tenant context and maintain current behavior.
     */
    it('should validate tenant context when userId is not provided', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          (tenantId, userId) => {
            // Setup
            tenantContextService.getCurrentTenantId.mockReturnValue(tenantId);
            tenantContextService.getCurrentUserId.mockReturnValue(userId);

            // Act & Assert - should not throw when tenant matches
            expect(() => {
              (service as any).validateTenantContext(tenantId);
            }).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny access when tenant does not match, even without userId', () => {
      fc.assert(
        fc.property(
          fc.tuple(fc.uuid(), fc.uuid()).filter(([a, b]) => a !== b),
          fc.uuid(),
          ([currentTenantId, requestedTenantId], userId) => {
            // Setup
            tenantContextService.getCurrentTenantId.mockReturnValue(currentTenantId);
            tenantContextService.getCurrentUserId.mockReturnValue(userId);

            // Act & Assert
            expect(() => {
              (service as any).validateTenantContext(requestedTenantId);
            }).toThrow('Cross-tenant access denied');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: Backward Compatibility - Current User Access', () => {
    /**
     * **Validates: Requirements 2.3, 5.2**
     * 
     * For any user accessing their own data, the system SHALL allow access 
     * if they have the appropriate permission, maintaining current behavior.
     */
    it('should allow current user to access their own data', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          (tenantId, userId) => {
            // Setup
            tenantContextService.getCurrentTenantId.mockReturnValue(tenantId);
            tenantContextService.getCurrentUserId.mockReturnValue(userId);

            // Act & Assert - should not throw when accessing own data
            expect(() => {
              (service as any).validateTenantContext(tenantId, userId);
            }).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: Cross-User Access Logging', () => {
    /**
     * **Validates: Requirements 6.1, 6.2**
     * 
     * For any user accessing another user's data, the system SHALL log 
     * the action with the current user ID, target user ID, and tenant ID at DEBUG level.
     */
    it('should log cross-user access with required information', async () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.tuple(fc.uuid(), fc.uuid()).filter(([a, b]) => a !== b),
          async (tenantId, [userId, targetUserId]) => {
            // Setup - use same tenant ID for both current context and request
            tenantContextService.getCurrentTenantId.mockReturnValue(tenantId);
            tenantContextService.getCurrentUserId.mockReturnValue(userId);
            // Don't mock cache - let it return null so we hit the database path
            permissionCacheService.getUserPermissions.mockResolvedValue(null);
            // Mock the optimized query to return empty permissions
            (service as any).getUserPermissionsOptimized = jest.fn().mockResolvedValue([]);

            const debugSpy = jest.spyOn(service['logger'], 'debug');

            // Act
            await service.getUserPermissions(targetUserId, tenantId);

            // Assert - should log cross-user access
            const logCalls = debugSpy.mock.calls.filter(call =>
              call[0].includes('Cross-user access')
            );
            expect(logCalls.length).toBeGreaterThan(0);

            // Verify log contains required information
            const logCall = logCalls[0];
            expect(logCall[0]).toContain(userId);
            expect(logCall[0]).toContain(targetUserId);
            expect(logCall[0]).toContain(tenantId);

            debugSpy.mockRestore();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 9: No User ID Mismatch Errors in getUserPermissions', () => {
    /**
     * **Validates: Requirements 4.2**
     * 
     * For any user and any other user in the same tenant, when 
     * getUserPermissions() is called for the other user, the system 
     * SHALL NOT throw a "Cross-user access denied" error.
     */
    it('should not throw cross-user access error when getting permissions for another user', async () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.tuple(fc.uuid(), fc.uuid()).filter(([a, b]) => a !== b),
          async (tenantId, [userId, targetUserId]) => {
            // Setup
            tenantContextService.getCurrentTenantId.mockReturnValue(tenantId);
            tenantContextService.getCurrentUserId.mockReturnValue(userId);
            permissionCacheService.getUserPermissions.mockResolvedValue(null);
            (service as any).getUserPermissionsOptimized = jest.fn().mockResolvedValue([]);

            // Act & Assert
            await expect(
              service.getUserPermissions(targetUserId, tenantId)
            ).resolves.not.toThrow();

            // Verify no cross-user access error was thrown
            try {
              await service.getUserPermissions(targetUserId, tenantId);
            } catch (error) {
              expect(error.message).not.toContain('Cross-user access denied');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 10: No User ID Mismatch Errors in checkBulkPermissions', () => {
    /**
     * **Validates: Requirements 4.3**
     * 
     * For any user and any other user in the same tenant, when 
     * checkBulkPermissions() is called for the other user, the system 
     * SHALL NOT throw a "Cross-user access denied" error.
     */
    it('should not throw cross-user access error when checking bulk permissions for another user', async () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.tuple(fc.uuid(), fc.uuid()).filter(([a, b]) => a !== b),
          fc.array(
            fc.record({
              entityType: fc.constantFrom('User', 'Lead', 'Customer'),
              action: fc.constantFrom('Read', 'Create', 'Update', 'Delete'),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (tenantId, [userId, targetUserId], permissions) => {
            // Setup
            tenantContextService.getCurrentTenantId.mockReturnValue(tenantId);
            tenantContextService.getCurrentUserId.mockReturnValue(userId);
            permissionCacheService.getUserPermissions.mockResolvedValue(null);
            (service as any).getUserPermissionsOptimized = jest.fn().mockResolvedValue([]);

            // Act & Assert
            await expect(
              service.checkBulkPermissions(targetUserId, tenantId, permissions)
            ).resolves.not.toThrow();

            // Verify no cross-user access error was thrown
            try {
              await service.checkBulkPermissions(targetUserId, tenantId, permissions);
            } catch (error) {
              expect(error.message).not.toContain('Cross-user access denied');
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 11: No User ID Mismatch Errors in checkPermissionForMultipleUsers', () => {
    /**
     * **Validates: Requirements 4.4**
     * 
     * For any call to checkPermissionForMultipleUsers() with multiple user IDs, 
     * the system SHALL NOT throw a "Cross-user access denied" error.
     */
    it('should not throw cross-user access error when checking permissions for multiple users', async () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
          async (tenantId, currentUserId, userIds) => {
            // Setup
            tenantContextService.getCurrentTenantId.mockReturnValue(tenantId);
            tenantContextService.getCurrentUserId.mockReturnValue(currentUserId);
            userRoleRepository.createQueryBuilder.mockReturnValue({
              innerJoin: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              getRawOne: jest.fn().resolvedValue(null),
            } as any);

            // Act & Assert
            await expect(
              service.checkPermissionForMultipleUsers(
                userIds,
                tenantId,
                'User',
                'Read'
              )
            ).resolves.not.toThrow();

            // Verify no cross-user access error was thrown
            try {
              await service.checkPermissionForMultipleUsers(
                userIds,
                tenantId,
                'User',
                'Read'
              );
            } catch (error) {
              expect(error.message).not.toContain('Cross-user access denied');
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
