import { Test, TestingModule } from '@nestjs/testing';
import { PermissionCacheService } from '../permission-cache.service';
import { Permission } from '../../../../entities/rbac/permission.entity';

describe('PermissionCacheService', () => {
  let service: PermissionCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionCacheService],
    }).compile();

    service = module.get<PermissionCacheService>(PermissionCacheService);
  });

  afterEach(async () => {
    // Clear cache after each test
    await service.clearAllCache();
  });

  afterAll(() => {
    // Clean up the service
    service.onModuleDestroy();
  });

  describe('Basic Cache Operations', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should return null for non-existent cache entry', async () => {
      const result = await service.getUserPermissions('user1', 'tenant1');
      expect(result).toBeNull();
    });

    it('should cache and retrieve user permissions', async () => {
      const permissions: Permission[] = [
        {
          id: '1',
          entity_type: 'Customer',
          action: 'Read',
          description: 'Read customers',
          is_system_permission: false,
          created_at: new Date(),
          updated_at: new Date(),
          role_permissions: [],
        },
      ];

      await service.setUserPermissions('user1', 'tenant1', permissions);
      const cached = await service.getUserPermissions('user1', 'tenant1');

      expect(cached).toEqual(permissions);
      expect(cached).not.toBe(permissions); // Should be a copy
    });

    it('should respect TTL and expire entries', async () => {
      const permissions: Permission[] = [
        {
          id: '1',
          entity_type: 'Customer',
          action: 'Read',
          description: 'Read customers',
          is_system_permission: false,
          created_at: new Date(),
          updated_at: new Date(),
          role_permissions: [],
        },
      ];

      // Set with very short TTL
      await service.setUserPermissions('user1', 'tenant1', permissions, 1);
      
      // Should be available immediately
      let cached = await service.getUserPermissions('user1', 'tenant1');
      expect(cached).toEqual(permissions);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should be expired now
      cached = await service.getUserPermissions('user1', 'tenant1');
      expect(cached).toBeNull();
    });
  });

  describe('Cache Invalidation', () => {
    beforeEach(async () => {
      // Set up some test data
      const permissions: Permission[] = [
        {
          id: '1',
          entity_type: 'Customer',
          action: 'Read',
          description: 'Read customers',
          is_system_permission: false,
          created_at: new Date(),
          updated_at: new Date(),
          role_permissions: [],
        },
      ];

      await service.setUserPermissions('user1', 'tenant1', permissions);
      await service.setUserPermissions('user1', 'tenant2', permissions);
      await service.setUserPermissions('user2', 'tenant1', permissions);
    });

    it('should invalidate specific user permissions in a tenant', async () => {
      await service.invalidateUserPermissions('user1', 'tenant1');

      const cached1 = await service.getUserPermissions('user1', 'tenant1');
      const cached2 = await service.getUserPermissions('user1', 'tenant2');
      const cached3 = await service.getUserPermissions('user2', 'tenant1');

      expect(cached1).toBeNull(); // Should be invalidated
      expect(cached2).not.toBeNull(); // Should still exist
      expect(cached3).not.toBeNull(); // Should still exist
    });

    it('should invalidate all permissions for a user across tenants', async () => {
      await service.invalidateUserPermissionsAllTenants('user1');

      const cached1 = await service.getUserPermissions('user1', 'tenant1');
      const cached2 = await service.getUserPermissions('user1', 'tenant2');
      const cached3 = await service.getUserPermissions('user2', 'tenant1');

      expect(cached1).toBeNull(); // Should be invalidated
      expect(cached2).toBeNull(); // Should be invalidated
      expect(cached3).not.toBeNull(); // Should still exist
    });

    it('should invalidate all permissions for a tenant', async () => {
      await service.invalidateTenantPermissions('tenant1');

      const cached1 = await service.getUserPermissions('user1', 'tenant1');
      const cached2 = await service.getUserPermissions('user1', 'tenant2');
      const cached3 = await service.getUserPermissions('user2', 'tenant1');

      expect(cached1).toBeNull(); // Should be invalidated
      expect(cached2).not.toBeNull(); // Should still exist
      expect(cached3).toBeNull(); // Should be invalidated
    });

    it('should invalidate permissions for specific role users', async () => {
      await service.invalidateRolePermissions('role1', 'tenant1', ['user1', 'user2']);

      const cached1 = await service.getUserPermissions('user1', 'tenant1');
      const cached2 = await service.getUserPermissions('user1', 'tenant2');
      const cached3 = await service.getUserPermissions('user2', 'tenant1');

      expect(cached1).toBeNull(); // Should be invalidated
      expect(cached2).not.toBeNull(); // Should still exist
      expect(cached3).toBeNull(); // Should be invalidated
    });

    it('should clear all cache', async () => {
      await service.clearAllCache();

      const cached1 = await service.getUserPermissions('user1', 'tenant1');
      const cached2 = await service.getUserPermissions('user1', 'tenant2');
      const cached3 = await service.getUserPermissions('user2', 'tenant1');

      expect(cached1).toBeNull();
      expect(cached2).toBeNull();
      expect(cached3).toBeNull();
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache statistics', async () => {
      const permissions: Permission[] = [
        {
          id: '1',
          entity_type: 'Customer',
          action: 'Read',
          description: 'Read customers',
          is_system_permission: false,
          created_at: new Date(),
          updated_at: new Date(),
          role_permissions: [],
        },
      ];

      // Initial stats
      let stats = service.getCacheStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.sets).toBe(0);

      // Cache miss
      await service.getUserPermissions('user1', 'tenant1');
      stats = service.getCacheStats();
      expect(stats.misses).toBe(1);

      // Cache set
      await service.setUserPermissions('user1', 'tenant1', permissions);
      stats = service.getCacheStats();
      expect(stats.sets).toBe(1);

      // Cache hit
      await service.getUserPermissions('user1', 'tenant1');
      stats = service.getCacheStats();
      expect(stats.hits).toBe(1);
    });

    it('should calculate hit ratio correctly', async () => {
      const permissions: Permission[] = [
        {
          id: '1',
          entity_type: 'Customer',
          action: 'Read',
          description: 'Read customers',
          is_system_permission: false,
          created_at: new Date(),
          updated_at: new Date(),
          role_permissions: [],
        },
      ];

      // No requests yet
      expect(service.getCacheHitRatio()).toBe(0);

      // 1 miss
      await service.getUserPermissions('user1', 'tenant1');
      expect(service.getCacheHitRatio()).toBe(0);

      // Set cache
      await service.setUserPermissions('user1', 'tenant1', permissions);

      // 1 hit, 1 miss = 50%
      await service.getUserPermissions('user1', 'tenant1');
      expect(service.getCacheHitRatio()).toBe(50);

      // 2 hits, 1 miss = 66.67%
      await service.getUserPermissions('user1', 'tenant1');
      expect(service.getCacheHitRatio()).toBeCloseTo(66.67, 1);
    });
  });

  describe('Cache Utilities', () => {
    it('should check if permissions are cached', async () => {
      const permissions: Permission[] = [
        {
          id: '1',
          entity_type: 'Customer',
          action: 'Read',
          description: 'Read customers',
          is_system_permission: false,
          created_at: new Date(),
          updated_at: new Date(),
          role_permissions: [],
        },
      ];

      expect(service.isUserPermissionsCached('user1', 'tenant1')).toBe(false);

      await service.setUserPermissions('user1', 'tenant1', permissions);
      expect(service.isUserPermissionsCached('user1', 'tenant1')).toBe(true);

      await service.invalidateUserPermissions('user1', 'tenant1');
      expect(service.isUserPermissionsCached('user1', 'tenant1')).toBe(false);
    });

    it('should warm cache', async () => {
      const permissions: Permission[] = [
        {
          id: '1',
          entity_type: 'Customer',
          action: 'Read',
          description: 'Read customers',
          is_system_permission: false,
          created_at: new Date(),
          updated_at: new Date(),
          role_permissions: [],
        },
      ];

      await service.warmCache('user1', 'tenant1', permissions);
      
      const cached = await service.getUserPermissions('user1', 'tenant1');
      expect(cached).toEqual(permissions);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty permissions array', async () => {
      await service.setUserPermissions('user1', 'tenant1', []);
      
      const cached = await service.getUserPermissions('user1', 'tenant1');
      expect(cached).toEqual([]);
    });

    it('should handle multiple rapid operations', async () => {
      const permissions: Permission[] = [
        {
          id: '1',
          entity_type: 'Customer',
          action: 'Read',
          description: 'Read customers',
          is_system_permission: false,
          created_at: new Date(),
          updated_at: new Date(),
          role_permissions: [],
        },
      ];

      // Rapid set/get operations
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(service.setUserPermissions(`user${i}`, 'tenant1', permissions));
      }
      await Promise.all(promises);

      // Verify all are cached
      for (let i = 0; i < 10; i++) {
        const cached = await service.getUserPermissions(`user${i}`, 'tenant1');
        expect(cached).toEqual(permissions);
      }
    });
  });
});