import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionService } from '../permission.service';
import { PermissionCacheService } from '../permission-cache.service';
import { TenantContextService } from '../tenant-context.service';
import { Permission } from '../../../../entities/rbac/permission.entity';
import { UserRole } from '../../../../entities/rbac/user-role.entity';
import { RolePermission } from '../../../../entities/rbac/role-permission.entity';
import { EntityRegistry } from '../../../../entities/entity-registry/entity-registry.entity';

describe('PermissionService Cache Integration', () => {
  let service: PermissionService;
  let cacheService: PermissionCacheService;
  let tenantContextService: TenantContextService;
  let permissionRepository: Repository<Permission>;
  let userRoleRepository: Repository<UserRole>;
  let rolePermissionRepository: Repository<RolePermission>;
  let entityRegistryRepository: Repository<EntityRegistry>;

  const mockPermissions: Permission[] = [
    {
      id: '1',
      entity_type: 'Customer',
      action: 'Read',
      description: 'Read customer data',
      is_system_permission: false,
      created_at: new Date(),
      updated_at: new Date(),
      role_permissions: [],
    },
    {
      id: '2',
      entity_type: 'Customer',
      action: 'Create',
      description: 'Create customer',
      is_system_permission: false,
      created_at: new Date(),
      updated_at: new Date(),
      role_permissions: [],
    },
  ];

  const mockEntityRegistry = [
    {
      id: '1',
      code: 'Customer',
      name: 'Customer',
      description: 'Customer entity',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        PermissionCacheService,
        {
          provide: TenantContextService,
          useValue: {
            getCurrentTenantId: jest.fn().mockReturnValue('tenant-1'),
            getCurrentUserId: jest.fn().mockReturnValue('user-1'),
          },
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue({
              innerJoin: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              distinct: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue(mockPermissions),
            }),
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              getRawMany: jest.fn().mockResolvedValue([
                { userId: 'user-1' },
                { userId: 'user-2' },
              ]),
            }),
          },
        },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EntityRegistry),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockEntityRegistry[0]),
            find: jest.fn().mockResolvedValue(mockEntityRegistry),
          },
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    cacheService = module.get<PermissionCacheService>(PermissionCacheService);
    tenantContextService = module.get<TenantContextService>(TenantContextService);
    permissionRepository = module.get<Repository<Permission>>(getRepositoryToken(Permission));
    userRoleRepository = module.get<Repository<UserRole>>(getRepositoryToken(UserRole));
    rolePermissionRepository = module.get<Repository<RolePermission>>(getRepositoryToken(RolePermission));
    entityRegistryRepository = module.get<Repository<EntityRegistry>>(getRepositoryToken(EntityRegistry));
  });

  afterEach(() => {
    // Clear cache after each test
    cacheService.clearAllCache();
  });

  describe('Cache-First Approach', () => {
    it('should use cache when available (cache hit)', async () => {
      const userId = 'user-1';
      const tenantId = 'tenant-1';

      // Pre-populate cache
      await cacheService.setUserPermissions(userId, tenantId, mockPermissions);

      // Spy on cache service methods
      const getCacheSpy = jest.spyOn(cacheService, 'getUserPermissions');
      const setCacheSpy = jest.spyOn(cacheService, 'setUserPermissions');

      // Call hasPermission - should hit cache
      const result = await service.hasPermission(userId, tenantId, 'Customer', 'Read');

      expect(result).toBe(true);
      expect(getCacheSpy).toHaveBeenCalledWith(userId, tenantId);
      expect(setCacheSpy).not.toHaveBeenCalled(); // Should not set cache on hit
    });

    it('should fetch from database on cache miss and populate cache', async () => {
      const userId = 'user-1';
      const tenantId = 'tenant-1';

      // Ensure cache is empty
      await cacheService.invalidateUserPermissions(userId, tenantId);

      // Spy on cache service methods
      const getCacheSpy = jest.spyOn(cacheService, 'getUserPermissions');
      const setCacheSpy = jest.spyOn(cacheService, 'setUserPermissions');

      // Call hasPermission - should miss cache and fetch from DB
      const result = await service.hasPermission(userId, tenantId, 'Customer', 'Read');

      expect(result).toBe(true);
      expect(getCacheSpy).toHaveBeenCalledWith(userId, tenantId);
      expect(setCacheSpy).toHaveBeenCalledWith(userId, tenantId, mockPermissions);
    });

    it('should use cache for bulk permission checks', async () => {
      const userId = 'user-1';
      const tenantId = 'tenant-1';

      // Pre-populate cache
      await cacheService.setUserPermissions(userId, tenantId, mockPermissions);

      // Spy on getUserPermissions to ensure it uses cache
      const getUserPermissionsSpy = jest.spyOn(service, 'getUserPermissions');

      const permissionsToCheck = [
        { entityType: 'Customer', action: 'Read' },
        { entityType: 'Customer', action: 'Create' },
        { entityType: 'Customer', action: 'Delete' }, // This should be false
      ];

      const results = await service.checkBulkPermissions(userId, tenantId, permissionsToCheck);

      expect(results).toEqual([true, true, false]);
      expect(getUserPermissionsSpy).toHaveBeenCalledWith(userId, tenantId);
    });
  });

  describe('Cache Warming Strategies', () => {
    it('should warm cache for a single user', async () => {
      const userId = 'user-1';
      const tenantId = 'tenant-1';

      // Spy on cache service
      const warmCacheSpy = jest.spyOn(cacheService, 'warmCache');

      await service.warmUserPermissionsCache(userId, tenantId);

      expect(warmCacheSpy).toHaveBeenCalledWith(userId, tenantId, mockPermissions);

      // Verify cache is populated
      const cachedPermissions = await cacheService.getUserPermissions(userId, tenantId);
      expect(cachedPermissions).toEqual(mockPermissions);
    });

    it('should warm cache for multiple users', async () => {
      const userIds = ['user-1', 'user-2'];
      const tenantId = 'tenant-1';

      // Spy on single user warming method
      const warmUserCacheSpy = jest.spyOn(service, 'warmUserPermissionsCache');

      await service.warmMultipleUsersCache(userIds, tenantId);

      expect(warmUserCacheSpy).toHaveBeenCalledTimes(2);
      expect(warmUserCacheSpy).toHaveBeenCalledWith('user-1', tenantId);
      expect(warmUserCacheSpy).toHaveBeenCalledWith('user-2', tenantId);
    });

    it('should warm cache for active users in tenant', async () => {
      const tenantId = 'tenant-1';

      // Spy on multiple users warming method
      const warmMultipleUsersSpy = jest.spyOn(service, 'warmMultipleUsersCache');

      await service.warmTenantUsersCache(tenantId, 10);

      expect(warmMultipleUsersSpy).toHaveBeenCalledWith(['user-1', 'user-2'], tenantId);
    });

    it('should warm cache on login only if not already cached', async () => {
      const userId = 'user-1';
      const tenantId = 'tenant-1';

      // Pre-populate cache
      await cacheService.setUserPermissions(userId, tenantId, mockPermissions);

      // Spy on warming method
      const warmUserCacheSpy = jest.spyOn(service, 'warmUserPermissionsCache');

      await service.warmCacheOnLogin(userId, tenantId);

      // Should not warm cache if already cached
      expect(warmUserCacheSpy).not.toHaveBeenCalled();
    });

    it('should warm cache on login if not cached', async () => {
      const userId = 'user-1';
      const tenantId = 'tenant-1';

      // Ensure cache is empty
      await cacheService.invalidateUserPermissions(userId, tenantId);

      // Spy on warming method
      const warmUserCacheSpy = jest.spyOn(service, 'warmUserPermissionsCache');

      await service.warmCacheOnLogin(userId, tenantId);

      // Should warm cache if not already cached
      expect(warmUserCacheSpy).toHaveBeenCalledWith(userId, tenantId);
    });

    it('should refresh cache by invalidating and warming', async () => {
      const userId = 'user-1';
      const tenantId = 'tenant-1';

      // Pre-populate cache with old data
      await cacheService.setUserPermissions(userId, tenantId, [mockPermissions[0]]);

      // Spy on cache methods
      const invalidateSpy = jest.spyOn(cacheService, 'invalidateUserPermissions');
      const warmSpy = jest.spyOn(service, 'warmUserPermissionsCache');

      await service.refreshUserPermissionsCache(userId, tenantId);

      expect(invalidateSpy).toHaveBeenCalledWith(userId, tenantId);
      expect(warmSpy).toHaveBeenCalledWith(userId, tenantId);

      // Verify cache has fresh data
      const cachedPermissions = await cacheService.getUserPermissions(userId, tenantId);
      expect(cachedPermissions).toEqual(mockPermissions);
    });
  });

  describe('Cache Performance Monitoring', () => {
    it('should provide cache statistics', () => {
      const stats = service.getCacheStats();

      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('sets');
      expect(stats).toHaveProperty('deletes');
      expect(stats).toHaveProperty('evictions');
      expect(stats).toHaveProperty('size');
    });

    it('should calculate cache hit ratio', () => {
      const hitRatio = service.getCacheHitRatio();

      expect(typeof hitRatio).toBe('number');
      expect(hitRatio).toBeGreaterThanOrEqual(0);
      expect(hitRatio).toBeLessThanOrEqual(100);
    });

    it('should provide detailed performance metrics', () => {
      const metrics = service.getCachePerformanceMetrics();

      expect(metrics).toHaveProperty('hits');
      expect(metrics).toHaveProperty('misses');
      expect(metrics).toHaveProperty('hitRatio');
      expect(metrics).toHaveProperty('missRatio');
      expect(metrics).toHaveProperty('efficiency');
      expect(metrics).toHaveProperty('recommendations');
      expect(Array.isArray(metrics.recommendations)).toBe(true);
    });

    it('should perform cache health check', async () => {
      const healthCheck = await service.performCacheHealthCheck();

      expect(healthCheck).toHaveProperty('status');
      expect(healthCheck).toHaveProperty('metrics');
      expect(healthCheck).toHaveProperty('issues');
      expect(healthCheck).toHaveProperty('timestamp');
      expect(['healthy', 'warning', 'critical']).toContain(healthCheck.status);
    });
  });

  describe('Cache Invalidation Integration', () => {
    it('should invalidate user cache when roles change', async () => {
      const userId = 'user-1';
      const tenantId = 'tenant-1';

      // Pre-populate cache
      await cacheService.setUserPermissions(userId, tenantId, mockPermissions);

      // Spy on cache invalidation
      const invalidateSpy = jest.spyOn(cacheService, 'invalidateUserPermissions');

      await service.invalidateUserPermissionsCache(userId, tenantId);

      expect(invalidateSpy).toHaveBeenCalledWith(userId, tenantId);

      // Verify cache is empty
      const cachedPermissions = await cacheService.getUserPermissions(userId, tenantId);
      expect(cachedPermissions).toBeNull();
    });

    it('should invalidate role cache for all affected users', async () => {
      const roleId = 'role-1';
      const tenantId = 'tenant-1';

      // Mock userRoleRepository to return users with the role
      jest.spyOn(userRoleRepository, 'find').mockResolvedValue([
        { user_id: 'user-1', role_id: roleId, tenant_id: tenantId } as UserRole,
        { user_id: 'user-2', role_id: roleId, tenant_id: tenantId } as UserRole,
      ]);

      // Spy on cache invalidation
      const invalidateRoleSpy = jest.spyOn(cacheService, 'invalidateRolePermissions');

      await service.invalidateRolePermissionsCache(roleId, tenantId);

      expect(invalidateRoleSpy).toHaveBeenCalledWith(roleId, tenantId, ['user-1', 'user-2']);
    });

    it('should invalidate entire tenant cache', async () => {
      const tenantId = 'tenant-1';

      // Spy on cache invalidation
      const invalidateTenantSpy = jest.spyOn(cacheService, 'invalidateTenantPermissions');

      await service.invalidateTenantPermissionsCache(tenantId);

      expect(invalidateTenantSpy).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('Cache Warming Recommendations', () => {
    it('should generate cache warming recommendations', async () => {
      const tenantId = 'tenant-1';

      const recommendations = await service.getCacheWarmingRecommendations(tenantId);

      expect(Array.isArray(recommendations)).toBe(true);
      // Since cache is empty, all active users should be recommended
      expect(recommendations).toEqual(['user-1', 'user-2']);
    });

    it('should not recommend users who already have cached permissions', async () => {
      const tenantId = 'tenant-1';

      // Pre-populate cache for user-1
      await cacheService.setUserPermissions('user-1', tenantId, mockPermissions);

      const recommendations = await service.getCacheWarmingRecommendations(tenantId);

      // Only user-2 should be recommended since user-1 is already cached
      expect(recommendations).toEqual(['user-2']);
    });
  });
});