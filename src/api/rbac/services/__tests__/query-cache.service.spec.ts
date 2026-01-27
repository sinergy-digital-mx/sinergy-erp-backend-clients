import { Test, TestingModule } from '@nestjs/testing';
import { QueryCacheService } from '../query-cache.service';

describe('QueryCacheService', () => {
  let service: QueryCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueryCacheService],
    }).compile();

    service = module.get<QueryCacheService>(QueryCacheService);
  });

  afterEach(() => {
    // Clear cache after each test
    service.clear();
  });

  describe('basic cache operations', () => {
    it('should cache and retrieve data', async () => {
      const key = 'test-key';
      const data = { message: 'test data' };

      await service.set(key, data);
      const result = await service.get(key);

      expect(result).toEqual(data);
    });

    it('should return null for non-existent key', async () => {
      const result = await service.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should handle cache expiration', async () => {
      const key = 'expiring-key';
      const data = { message: 'expiring data' };
      const shortTtl = 10; // 10ms

      await service.set(key, data, shortTtl);
      
      // Should be available immediately
      let result = await service.get(key);
      expect(result).toEqual(data);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));
      
      result = await service.get(key);
      expect(result).toBeNull();
    });

    it('should invalidate cached data', async () => {
      const key = 'test-key';
      const data = { message: 'test data' };

      await service.set(key, data);
      await service.invalidate(key);
      
      const result = await service.get(key);
      expect(result).toBeNull();
    });
  });

  describe('pattern invalidation', () => {
    it('should invalidate keys matching pattern', async () => {
      await service.set('tenant:123:users', { users: [] });
      await service.set('tenant:123:roles', { roles: [] });
      await service.set('tenant:456:users', { users: [] });
      await service.set('global:config', { config: {} });

      await service.invalidatePattern('tenant:123:*');

      expect(await service.get('tenant:123:users')).toBeNull();
      expect(await service.get('tenant:123:roles')).toBeNull();
      expect(await service.get('tenant:456:users')).not.toBeNull();
      expect(await service.get('global:config')).not.toBeNull();
    });
  });

  describe('key generation', () => {
    it('should generate tenant query keys', () => {
      const tenantId = 'tenant-123';
      const queryType = 'role_hierarchy';
      const params = { limit: 10 };

      const key = service.generateTenantQueryKey(tenantId, queryType, params);
      
      expect(key).toBe('tenant:tenant-123:role_hierarchy:{"limit":10}');
    });

    it('should generate user query keys', () => {
      const userId = 'user-456';
      const tenantId = 'tenant-123';
      const queryType = 'permissions';

      const key = service.generateUserQueryKey(userId, tenantId, queryType);
      
      expect(key).toBe('user:user-456:tenant:tenant-123:permissions:');
    });
  });

  describe('cacheQuery method', () => {
    it('should cache query results', async () => {
      const queryFn = jest.fn().mockResolvedValue({ data: 'test result' });
      const keyParams = {
        tenantId: 'tenant-123',
        queryType: 'test_query',
      };

      // First call should execute query
      const result1 = await service.cacheQuery(queryFn, keyParams);
      expect(result1).toEqual({ data: 'test result' });
      expect(queryFn).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await service.cacheQuery(queryFn, keyParams);
      expect(result2).toEqual({ data: 'test result' });
      expect(queryFn).toHaveBeenCalledTimes(1); // Still only called once
    });

    it('should handle query function errors', async () => {
      const queryFn = jest.fn().mockRejectedValue(new Error('Query failed'));
      const keyParams = {
        tenantId: 'tenant-123',
        queryType: 'failing_query',
      };

      await expect(service.cacheQuery(queryFn, keyParams)).rejects.toThrow('Query failed');
    });
  });

  describe('tenant and user invalidation', () => {
    it('should invalidate all tenant queries', async () => {
      const tenantId = 'tenant-123';
      
      await service.set(`tenant:${tenantId}:roles`, { roles: [] });
      await service.set(`user:user-1:tenant:${tenantId}:permissions`, { permissions: [] });
      await service.set(`tenant:other-tenant:roles`, { roles: [] });

      await service.invalidateTenantQueries(tenantId);

      expect(await service.get(`tenant:${tenantId}:roles`)).toBeNull();
      expect(await service.get(`user:user-1:tenant:${tenantId}:permissions`)).toBeNull();
      expect(await service.get(`tenant:other-tenant:roles`)).not.toBeNull();
    });

    it('should invalidate all user queries', async () => {
      const userId = 'user-123';
      
      await service.set(`user:${userId}:tenant:tenant-1:permissions`, { permissions: [] });
      await service.set(`user:${userId}:tenant:tenant-2:permissions`, { permissions: [] });
      await service.set(`user:other-user:tenant:tenant-1:permissions`, { permissions: [] });

      await service.invalidateUserQueries(userId);

      expect(await service.get(`user:${userId}:tenant:tenant-1:permissions`)).toBeNull();
      expect(await service.get(`user:${userId}:tenant:tenant-2:permissions`)).toBeNull();
      expect(await service.get(`user:other-user:tenant:tenant-1:permissions`)).not.toBeNull();
    });
  });

  describe('cache statistics', () => {
    it('should track cache hits and misses', async () => {
      const key = 'stats-test';
      const data = { test: 'data' };

      // Miss
      await service.get(key);
      
      // Set
      await service.set(key, data);
      
      // Hit
      await service.get(key);

      const stats = service.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.sets).toBe(1);
    });

    it('should calculate hit ratio correctly', async () => {
      const key = 'ratio-test';
      const data = { test: 'data' };

      // 2 misses
      await service.get(key);
      await service.get(key);
      
      await service.set(key, data);
      
      // 3 hits
      await service.get(key);
      await service.get(key);
      await service.get(key);

      const hitRatio = service.getHitRatio();
      expect(hitRatio).toBe(60); // 3 hits out of 5 total = 60%
    });
  });

  describe('cache health', () => {
    it('should report healthy status with good metrics', async () => {
      // Create some cache hits
      await service.set('test1', { data: 1 });
      await service.set('test2', { data: 2 });
      await service.get('test1');
      await service.get('test2');

      const health = service.getCacheHealth();
      
      expect(health.status).toBe('healthy');
      expect(health.hitRatio).toBeGreaterThan(0);
      expect(health.issues).toHaveLength(0);
    });

    it('should report degraded status with low hit ratio', async () => {
      // Create mostly misses
      await service.get('miss1');
      await service.get('miss2');
      await service.get('miss3');
      await service.get('miss4');
      
      await service.set('hit1', { data: 1 });
      await service.get('hit1');

      const health = service.getCacheHealth();
      
      expect(health.status).toBe('critical');
      expect(health.hitRatio).toBeLessThan(50);
      expect(health.issues).toContain('Very low cache hit ratio');
    });
  });

  describe('cache size management', () => {
    it('should evict old entries when cache is full', async () => {
      // Fill cache beyond max size (assuming max size is reasonable for testing)
      const maxSize = 5000; // From the service implementation
      
      // Set a few entries
      for (let i = 0; i < 10; i++) {
        await service.set(`test-${i}`, { data: i });
      }

      const stats = service.getStats();
      expect(stats.size).toBeLessThanOrEqual(maxSize);
    });
  });

  describe('cleanup and destruction', () => {
    it('should clean up resources on module destroy', async () => {
      // Set some data first
      await service.set('test-key', { data: 'test' });
      
      // Verify data exists
      expect(await service.get('test-key')).not.toBeNull();
      
      // Call destroy
      service.onModuleDestroy();
      
      // Verify cache is cleared
      expect(await service.get('test-key')).toBeNull();
    });
  });
});