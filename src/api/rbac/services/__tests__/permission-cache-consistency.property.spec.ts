// Feature: role-based-access-control, Property 8: Permission Caching Consistency
// **Validates: Requirements 9.2, 9.3**

import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionService } from '../permission.service';
import { PermissionCacheService } from '../permission-cache.service';
import { QueryCacheService } from '../query-cache.service';
import { TenantContextService } from '../tenant-context.service';
import { Permission } from '../../../../entities/rbac/permission.entity';
import { UserRole } from '../../../../entities/rbac/user-role.entity';
import { RolePermission } from '../../../../entities/rbac/role-permission.entity';
import { EntityRegistry } from '../../../../entities/entity-registry/entity-registry.entity';

describe('Permission Cache Consistency - Property Tests', () => {
  let service: PermissionService;
  let cacheService: PermissionCacheService;
  let permissionRepository: jest.Mocked<Repository<Permission>>;
  let userRoleRepository: jest.Mocked<Repository<UserRole>>;
  let entityRegistryRepository: jest.Mocked<Repository<EntityRegistry>>;

  // Property-based test generators
  const userIdGenerator = fc.uuid();
  const tenantIdGenerator = fc.uuid();
  
  const permissionGenerator = fc.record({
    id: fc.uuid(),
    entity_type: fc.constantFrom('Customer', 'Lead', 'Order', 'Product'),
    action: fc.constantFrom('Create', 'Read', 'Update', 'Delete', 'Export'),
    description: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
    is_system_permission: fc.boolean(),
    created_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
    updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
    role_permissions: fc.constant([]),
  });

  const permissionsArrayGenerator = fc.array(permissionGenerator, { minLength: 0, maxLength: 5 });

  const cacheOperationGenerator = fc.record({
    userId: userIdGenerator,
    tenantId: tenantIdGenerator,
    permissions: permissionsArrayGenerator,
    ttl: fc.option(fc.integer({ min: 1000, max: 300000 }), { nil: undefined }), // 1s to 5min
  });

  const multipleUsersGenerator = fc.array(
    fc.record({
      userId: userIdGenerator,
      tenantId: tenantIdGenerator,
      permissions: permissionsArrayGenerator,
    }),
    { minLength: 2, maxLength: 3 }
  );

  beforeEach(async () => {
    const mockPermissionRepository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }),
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      query: jest.fn().mockResolvedValue([]),
    };

    const mockUserRoleRepository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      }),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const mockRolePermissionRepository = {
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const mockEntityRegistryRepository = {
      findOne: jest.fn().mockImplementation((query) => {
        const validEntities = ['Customer', 'Lead', 'Order', 'Product'];
        const entityCode = query?.where?.code;
        if (validEntities.includes(entityCode)) {
          return Promise.resolve({ id: 1, code: entityCode, name: entityCode });
        }
        return Promise.resolve(null);
      }),
      find: jest.fn().mockResolvedValue([
        { id: 1, code: 'Customer', name: 'Customer' },
        { id: 2, code: 'Lead', name: 'Lead' },
        { id: 3, code: 'Order', name: 'Order' },
        { id: 4, code: 'Product', name: 'Product' },
      ]),
    };

    const mockTenantContextService = {
      getCurrentTenantId: jest.fn(),
      getCurrentUserId: jest.fn(),
      setTenantContext: jest.fn(),
      hasContext: jest.fn(),
      clearContext: jest.fn(),
      validateContext: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        PermissionCacheService,
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
          provide: QueryCacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            invalidate: jest.fn(),
            invalidatePattern: jest.fn(),
            invalidateTenantQueries: jest.fn(),
            invalidateUserQueries: jest.fn(),
            cacheQuery: jest.fn(),
            generateTenantQueryKey: jest.fn(),
            generateUserQueryKey: jest.fn(),
            clear: jest.fn(),
            getStats: jest.fn(),
            getHitRatio: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    cacheService = module.get<PermissionCacheService>(PermissionCacheService);
    permissionRepository = module.get(getRepositoryToken(Permission));
    userRoleRepository = module.get(getRepositoryToken(UserRole));
    entityRegistryRepository = module.get(getRepositoryToken(EntityRegistry));

    // Clear cache and reset mocks before each test
    await cacheService.clearAllCache();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up cache after each test
    await cacheService.clearAllCache();
  });

  afterAll(() => {
    // Final cleanup
    cacheService.onModuleDestroy();
  });

  describe('Property 8: Permission Caching Consistency', () => {
    
    it('should return consistent results from cache and database for any user permissions', async () => {
      await fc.assert(
        fc.asyncProperty(cacheOperationGenerator, async (cacheOp) => {
          // Clear cache and reset mocks before each test
          await cacheService.clearAllCache();
          jest.clearAllMocks();

          // Setup: Mock database query to return specific permissions
          // The actual query returns entity_code and entity_registry_id, not entity_type
          permissionRepository.query.mockResolvedValue(
            cacheOp.permissions.map((p, idx) => ({
              id: p.id,
              entity_code: p.entity_type,
              entity_registry_id: idx + 1,
              action: p.action,
              description: p.description,
              is_system_permission: p.is_system_permission,
              created_at: p.created_at,
              updated_at: p.updated_at,
            }))
          );

          // Test: Get permissions from database (cache miss)
          const dbPermissions = await service.getUserPermissions(cacheOp.userId, cacheOp.tenantId);

          // Test: Get permissions again (should hit cache)
          const cachedPermissions = await service.getUserPermissions(cacheOp.userId, cacheOp.tenantId);

          // Property: Cache results should be identical to database results
          expect(cachedPermissions).toEqual(dbPermissions);

          // Property: Both should have the same structure and content as expected permissions
          expect(dbPermissions.length).toBe(cacheOp.permissions.length);
          expect(cachedPermissions.length).toBe(cacheOp.permissions.length);

          // Verify each permission matches (ignoring role_permissions property which is not part of Permission entity)
          for (let i = 0; i < cacheOp.permissions.length; i++) {
            const expected = cacheOp.permissions[i];
            const dbResult = dbPermissions[i];
            const cachedResult = cachedPermissions[i];

            expect(dbResult.id).toBe(expected.id);
            expect(dbResult.entity_type).toBe(expected.entity_type);
            expect(dbResult.action).toBe(expected.action);
            expect(dbResult.description).toBe(expected.description);
            expect(dbResult.is_system_permission).toBe(expected.is_system_permission);

            expect(cachedResult.id).toBe(expected.id);
            expect(cachedResult.entity_type).toBe(expected.entity_type);
            expect(cachedResult.action).toBe(expected.action);
            expect(cachedResult.description).toBe(expected.description);
            expect(cachedResult.is_system_permission).toBe(expected.is_system_permission);
          }

          // Property: Results should be consistent regardless of cache state
          // Note: The cache service creates copies, so reference equality is not guaranteed
          // but content equality should always hold
          if (cachedPermissions && dbPermissions) {
            expect(JSON.stringify(cachedPermissions)).toBe(JSON.stringify(dbPermissions));
          }
        }),
        { numRuns: 50, timeout: 15000 }
      );
    });

    it('should maintain cache consistency across multiple cache operations for any sequence', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(cacheOperationGenerator, { minLength: 2, maxLength: 3 }),
          async (cacheOperations) => {
            // Ensure unique user-tenant combinations for this test
            const uniqueOperations = cacheOperations.filter((op, index, arr) => 
              arr.findIndex(o => o.userId === op.userId && o.tenantId === op.tenantId) === index
            );

            if (uniqueOperations.length < 2) return; // Skip if not enough unique operations

            // Clear cache and reset stats before test
            await cacheService.clearAllCache();

            // Test: Perform multiple cache operations
            for (const cacheOp of uniqueOperations) {
              await cacheService.setUserPermissions(
                cacheOp.userId,
                cacheOp.tenantId,
                cacheOp.permissions,
                cacheOp.ttl
              );
            }

            // Property: Each cached entry should be retrievable and consistent
            for (const cacheOp of uniqueOperations) {
              const cachedPermissions = await cacheService.getUserPermissions(
                cacheOp.userId,
                cacheOp.tenantId
              );

              expect(cachedPermissions).toEqual(cacheOp.permissions);

              // Property: Cache status should reflect actual cache state
              const isCached = cacheService.isUserPermissionsCached(cacheOp.userId, cacheOp.tenantId);
              expect(isCached).toBe(true);
            }

            // Property: Cache size should match number of unique operations
            const stats = cacheService.getCacheStats();
            expect(stats.size).toBe(uniqueOperations.length);
          }
        ),
        { numRuns: 30, timeout: 20000 }
      );
    });

    it('should handle cache expiration transparently for any TTL values', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: userIdGenerator,
            tenantId: tenantIdGenerator,
            permissions: permissionsArrayGenerator,
            shortTtl: fc.integer({ min: 1, max: 50 }), // Very short TTL for testing
          }),
          async (testData) => {
            // Test: Set cache with short TTL
            await cacheService.setUserPermissions(
              testData.userId,
              testData.tenantId,
              testData.permissions,
              testData.shortTtl
            );

            // Property: Should be cached immediately
            const immediateResult = await cacheService.getUserPermissions(
              testData.userId,
              testData.tenantId
            );
            expect(immediateResult).toEqual(testData.permissions);

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, testData.shortTtl + 10));

            // Property: Should return null after expiration
            const expiredResult = await cacheService.getUserPermissions(
              testData.userId,
              testData.tenantId
            );
            expect(expiredResult).toBeNull();

            // Property: Cache status should reflect expiration
            const isCached = cacheService.isUserPermissionsCached(testData.userId, testData.tenantId);
            expect(isCached).toBe(false);
          }
        ),
        { numRuns: 30, timeout: 25000 }
      );
    });

    it('should maintain cache isolation between different user-tenant combinations', async () => {
      await fc.assert(
        fc.asyncProperty(multipleUsersGenerator, async (userDataArray) => {
          // Ensure we have unique user-tenant combinations
          const uniqueUserData = userDataArray.filter((userData, index, arr) => 
            arr.findIndex(u => u.userId === userData.userId && u.tenantId === userData.tenantId) === index
          );

          if (uniqueUserData.length < 2) return; // Skip if not enough unique combinations

          // Test: Cache permissions for multiple users
          for (const userData of uniqueUserData) {
            await cacheService.setUserPermissions(
              userData.userId,
              userData.tenantId,
              userData.permissions
            );
          }

          // Property: Each user should have their own isolated cache entry
          for (const userData of uniqueUserData) {
            const cachedPermissions = await cacheService.getUserPermissions(
              userData.userId,
              userData.tenantId
            );

            expect(cachedPermissions).toEqual(userData.permissions);

            // Property: Modifying one user's cache should not affect others
            const otherUsers = uniqueUserData.filter(u => 
              u.userId !== userData.userId || u.tenantId !== userData.tenantId
            );

            for (const otherUser of otherUsers) {
              const otherCachedPermissions = await cacheService.getUserPermissions(
                otherUser.userId,
                otherUser.tenantId
              );
              expect(otherCachedPermissions).toEqual(otherUser.permissions);
            }
          }
        }),
        { numRuns: 50, timeout: 20000 }
      );
    });

    it('should handle cache invalidation consistently for any invalidation pattern', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            users: fc.array(
              fc.record({
                userId: userIdGenerator,
                tenantId: tenantIdGenerator,
                permissions: permissionsArrayGenerator,
              }),
              { minLength: 3, maxLength: 6 }
            ),
            invalidationType: fc.constantFrom('user', 'tenant', 'all'),
          }),
          async (testData) => {
            // Ensure unique user-tenant combinations
            const uniqueUsers = testData.users.filter((user, index, arr) => 
              arr.findIndex(u => u.userId === user.userId && u.tenantId === user.tenantId) === index
            );

            if (uniqueUsers.length < 3) return; // Skip if not enough unique users

            // Setup: Cache permissions for all users
            for (const user of uniqueUsers) {
              await cacheService.setUserPermissions(user.userId, user.tenantId, user.permissions);
            }

            // Verify all are cached
            for (const user of uniqueUsers) {
              const cached = await cacheService.getUserPermissions(user.userId, user.tenantId);
              expect(cached).toEqual(user.permissions);
            }

            // Test: Perform invalidation based on type
            const targetUser = uniqueUsers[0];
            
            switch (testData.invalidationType) {
              case 'user':
                await cacheService.invalidateUserPermissions(targetUser.userId, targetUser.tenantId);
                
                // Property: Only target user should be invalidated
                const targetCached = await cacheService.getUserPermissions(targetUser.userId, targetUser.tenantId);
                expect(targetCached).toBeNull();
                
                // Property: Other users should remain cached
                for (const otherUser of uniqueUsers.slice(1)) {
                  const otherCached = await cacheService.getUserPermissions(otherUser.userId, otherUser.tenantId);
                  expect(otherCached).toEqual(otherUser.permissions);
                }
                break;

              case 'tenant':
                await cacheService.invalidateTenantPermissions(targetUser.tenantId);
                
                // Property: All users in target tenant should be invalidated
                const sameTenanUsers = uniqueUsers.filter(u => u.tenantId === targetUser.tenantId);
                for (const user of sameTenanUsers) {
                  const cached = await cacheService.getUserPermissions(user.userId, user.tenantId);
                  expect(cached).toBeNull();
                }
                
                // Property: Users in other tenants should remain cached
                const otherTenantUsers = uniqueUsers.filter(u => u.tenantId !== targetUser.tenantId);
                for (const user of otherTenantUsers) {
                  const cached = await cacheService.getUserPermissions(user.userId, user.tenantId);
                  expect(cached).toEqual(user.permissions);
                }
                break;

              case 'all':
                await cacheService.clearAllCache();
                
                // Property: All users should be invalidated
                for (const user of uniqueUsers) {
                  const cached = await cacheService.getUserPermissions(user.userId, user.tenantId);
                  expect(cached).toBeNull();
                }
                break;
            }
          }
        ),
        { numRuns: 40, timeout: 25000 }
      );
    });

    it('should maintain cache statistics consistency for any sequence of operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              operation: fc.constantFrom('set', 'get', 'invalidate'),
              userId: userIdGenerator,
              tenantId: tenantIdGenerator,
              permissions: permissionsArrayGenerator,
            }),
            { minLength: 3, maxLength: 8 }
          ),
          async (operations) => {
            // Create a fresh cache service instance for this test
            const freshCacheService = new PermissionCacheService();
            
            let expectedHits = 0;
            let expectedMisses = 0;
            let expectedSets = 0;
            let expectedDeletes = 0;

            // Test: Perform sequence of operations
            for (const op of operations) {
              switch (op.operation) {
                case 'set':
                  await freshCacheService.setUserPermissions(op.userId, op.tenantId, op.permissions);
                  expectedSets++;
                  break;

                case 'get':
                  const result = await freshCacheService.getUserPermissions(op.userId, op.tenantId);
                  if (result !== null) {
                    expectedHits++;
                  } else {
                    expectedMisses++;
                  }
                  break;

                case 'invalidate':
                  const wasInvalidated = freshCacheService.isUserPermissionsCached(op.userId, op.tenantId);
                  await freshCacheService.invalidateUserPermissions(op.userId, op.tenantId);
                  if (wasInvalidated) {
                    expectedDeletes++;
                  }
                  break;
              }
            }

            // Property: Cache statistics should accurately reflect operations
            const stats = freshCacheService.getCacheStats();
            expect(stats.hits).toBe(expectedHits);
            expect(stats.misses).toBe(expectedMisses);
            expect(stats.sets).toBe(expectedSets);
            expect(stats.deletes).toBe(expectedDeletes);

            // Property: Hit ratio should be calculated correctly
            const expectedHitRatio = expectedHits + expectedMisses > 0 
              ? (expectedHits / (expectedHits + expectedMisses)) * 100 
              : 0;
            const actualHitRatio = freshCacheService.getCacheHitRatio();
            expect(actualHitRatio).toBeCloseTo(expectedHitRatio, 2);

            // Cleanup
            freshCacheService.onModuleDestroy();
          }
        ),
        { numRuns: 20, timeout: 30000 }
      );
    });

    it('should handle concurrent cache operations safely for any concurrent access pattern', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: userIdGenerator,
            tenantId: tenantIdGenerator,
            permissions1: permissionsArrayGenerator,
            permissions2: permissionsArrayGenerator,
            concurrentOps: fc.integer({ min: 2, max: 5 }),
          }),
          async (testData) => {
            // Clear cache before test
            await cacheService.clearAllCache();

            // Test: Perform concurrent cache operations
            const promises = [];
            
            for (let i = 0; i < testData.concurrentOps; i++) {
              const permissions = i % 2 === 0 ? testData.permissions1 : testData.permissions2;
              promises.push(
                cacheService.setUserPermissions(testData.userId, testData.tenantId, permissions)
              );
            }

            // Wait for all operations to complete
            await Promise.all(promises);

            // Property: Cache should be in a consistent state after concurrent operations
            const finalCachedPermissions = await cacheService.getUserPermissions(
              testData.userId,
              testData.tenantId
            );

            // Should have one of the two permission sets
            const isValidResult = 
              JSON.stringify(finalCachedPermissions) === JSON.stringify(testData.permissions1) ||
              JSON.stringify(finalCachedPermissions) === JSON.stringify(testData.permissions2);
            
            expect(isValidResult).toBe(true);

            // Property: Cache should report consistent state
            const isCached = cacheService.isUserPermissionsCached(testData.userId, testData.tenantId);
            expect(isCached).toBe(true);

            // Property: Cache statistics should be consistent
            const stats = cacheService.getCacheStats();
            expect(stats.sets).toBeGreaterThanOrEqual(testData.concurrentOps);
            expect(stats.size).toBeGreaterThanOrEqual(1);
          }
        ),
        { numRuns: 20, timeout: 30000 }
      );
    });

    it('should refresh cache transparently without affecting authorization results', async () => {
      await fc.assert(
        fc.asyncProperty(cacheOperationGenerator, async (cacheOp) => {
          // Skip test if no permissions to test with
          if (cacheOp.permissions.length === 0) return;

          // Setup: Mock database to return permissions
          const queryBuilder = permissionRepository.createQueryBuilder();
          queryBuilder.getMany.mockResolvedValue(cacheOp.permissions);

          // Test: Initial permission check (populates cache)
          const hasPermissionBefore = await service.hasPermission(
            cacheOp.userId,
            cacheOp.tenantId,
            cacheOp.permissions[0].entity_type,
            cacheOp.permissions[0].action
          );

          // Test: Invalidate and refresh cache
          await cacheService.invalidateUserPermissions(cacheOp.userId, cacheOp.tenantId);

          // Test: Permission check after cache refresh
          const hasPermissionAfter = await service.hasPermission(
            cacheOp.userId,
            cacheOp.tenantId,
            cacheOp.permissions[0].entity_type,
            cacheOp.permissions[0].action
          );

          // Property: Authorization results should be consistent before and after cache refresh
          expect(hasPermissionAfter).toBe(hasPermissionBefore);

          // Property: Cache should be repopulated after refresh
          const isCached = cacheService.isUserPermissionsCached(cacheOp.userId, cacheOp.tenantId);
          expect(isCached).toBe(true);
        }),
        { numRuns: 30, timeout: 20000 }
      );
    });
  });
});