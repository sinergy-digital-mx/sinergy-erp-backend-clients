import { Injectable, Logger } from '@nestjs/common';

/**
 * Cache entry interface for query results
 */
interface QueryCacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
  queryKey: string;
}

/**
 * Service for caching frequently accessed query results to optimize database performance.
 * Implements intelligent caching strategies for read-heavy operations.
 * 
 * Requirements: 9.4
 */
@Injectable()
export class QueryCacheService {
  private readonly logger = new Logger(QueryCacheService.name);
  private readonly cache = new Map<string, QueryCacheEntry<any>>();
  private readonly defaultTtl = 10 * 60 * 1000; // 10 minutes for query results
  private readonly maxCacheSize = 5000; // Maximum number of cached queries
  private readonly cleanupInterval = 2 * 60 * 1000; // Cleanup every 2 minutes
  private cleanupTimer: NodeJS.Timeout | null = null;

  // Cache statistics
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    size: 0,
  };

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * Get cached query result
   * @param queryKey - Unique key for the query
   * @returns Promise<T | null> - Cached result or null if not found/expired
   */
  async get<T>(queryKey: string): Promise<T | null> {
    const entry = this.cache.get(queryKey);

    if (!entry) {
      this.stats.misses++;
      this.logger.debug(`Query cache miss for key: ${queryKey}`);
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(queryKey);
      this.stats.misses++;
      this.stats.evictions++;
      this.updateCacheSize();
      this.logger.debug(`Query cache entry expired for key: ${queryKey}`);
      return null;
    }

    this.stats.hits++;
    this.logger.debug(`Query cache hit for key: ${queryKey}`);
    return entry.data;
  }

  /**
   * Cache query result
   * @param queryKey - Unique key for the query
   * @param data - Data to cache
   * @param ttl - Time to live in milliseconds (optional)
   * @returns Promise<void>
   */
  async set<T>(queryKey: string, data: T, ttl?: number): Promise<void> {
    const effectiveTtl = ttl ?? this.defaultTtl;
    const now = Date.now();

    // Check if we need to evict entries to stay under max size
    if (this.cache.size >= this.maxCacheSize && !this.cache.has(queryKey)) {
      this.evictOldestEntries(1);
    }

    const entry: QueryCacheEntry<T> = {
      data: JSON.parse(JSON.stringify(data)), // Deep copy to avoid reference issues
      expiresAt: now + effectiveTtl,
      createdAt: now,
      queryKey,
    };

    this.cache.set(queryKey, entry);
    this.stats.sets++;
    this.updateCacheSize();

    this.logger.debug(`Cached query result for key: ${queryKey} (TTL: ${effectiveTtl}ms)`);
  }

  /**
   * Invalidate cached query result
   * @param queryKey - Key to invalidate
   * @returns Promise<void>
   */
  async invalidate(queryKey: string): Promise<void> {
    const deleted = this.cache.delete(queryKey);
    if (deleted) {
      this.stats.deletes++;
      this.updateCacheSize();
      this.logger.debug(`Invalidated query cache for key: ${queryKey}`);
    }
  }

  /**
   * Invalidate all cached queries matching a pattern
   * @param pattern - Pattern to match (supports wildcards with *)
   * @returns Promise<void>
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    let deletedCount = 0;
    for (const key of keysToDelete) {
      if (this.cache.delete(key)) {
        deletedCount++;
      }
    }

    this.stats.deletes += deletedCount;
    this.updateCacheSize();

    this.logger.debug(`Invalidated ${deletedCount} query cache entries matching pattern: ${pattern}`);
  }

  /**
   * Clear all cached queries
   * @returns Promise<void>
   */
  async clear(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
    this.updateCacheSize();

    this.logger.debug(`Cleared all query cache entries (${size} entries removed)`);
  }

  /**
   * Get cache statistics
   * @returns Cache statistics object
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get cache hit ratio as percentage
   * @returns number - Hit ratio percentage (0-100)
   */
  getHitRatio(): number {
    const total = this.stats.hits + this.stats.misses;
    if (total === 0) return 0;
    return (this.stats.hits / total) * 100;
  }

  /**
   * Generate cache key for tenant-specific queries
   * @param tenantId - The tenant ID
   * @param queryType - Type of query (e.g., 'role_hierarchy', 'permission_stats')
   * @param params - Additional parameters for the query
   * @returns string - Generated cache key
   */
  generateTenantQueryKey(tenantId: string, queryType: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `tenant:${tenantId}:${queryType}:${paramString}`;
  }

  /**
   * Generate cache key for user-specific queries
   * @param userId - The user ID
   * @param tenantId - The tenant ID
   * @param queryType - Type of query
   * @param params - Additional parameters
   * @returns string - Generated cache key
   */
  generateUserQueryKey(userId: string, tenantId: string, queryType: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `user:${userId}:tenant:${tenantId}:${queryType}:${paramString}`;
  }

  /**
   * Cache a query result with automatic key generation
   * @param queryFn - Function that executes the query
   * @param keyParams - Parameters for generating the cache key
   * @param ttl - Optional TTL override
   * @returns Promise<T> - Query result (from cache or fresh)
   */
  async cacheQuery<T>(
    queryFn: () => Promise<T>,
    keyParams: {
      tenantId?: string;
      userId?: string;
      queryType: string;
      params?: Record<string, any>;
    },
    ttl?: number,
  ): Promise<T> {
    // Generate cache key
    let cacheKey: string;
    if (keyParams.userId && keyParams.tenantId) {
      cacheKey = this.generateUserQueryKey(keyParams.userId, keyParams.tenantId, keyParams.queryType, keyParams.params);
    } else if (keyParams.tenantId) {
      cacheKey = this.generateTenantQueryKey(keyParams.tenantId, keyParams.queryType, keyParams.params);
    } else {
      cacheKey = `global:${keyParams.queryType}:${JSON.stringify(keyParams.params || {})}`;
    }

    // Try to get from cache first
    const cachedResult = await this.get<T>(cacheKey);
    if (cachedResult !== null) {
      return cachedResult;
    }

    // Execute query and cache result
    try {
      const result = await queryFn();
      await this.set(cacheKey, result, ttl);
      return result;
    } catch (error) {
      this.logger.error(`Query execution failed for key ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate all cache entries for a specific tenant
   * @param tenantId - The tenant ID
   * @returns Promise<void>
   */
  async invalidateTenantQueries(tenantId: string): Promise<void> {
    await this.invalidatePattern(`tenant:${tenantId}:*`);
    await this.invalidatePattern(`user:*:tenant:${tenantId}:*`);
  }

  /**
   * Invalidate all cache entries for a specific user
   * @param userId - The user ID
   * @returns Promise<void>
   */
  async invalidateUserQueries(userId: string): Promise<void> {
    await this.invalidatePattern(`user:${userId}:*`);
  }

  /**
   * Preload frequently accessed queries
   * @param tenantId - The tenant ID
   * @param queryTypes - Types of queries to preload
   * @returns Promise<void>
   */
  async preloadTenantQueries(tenantId: string, queryTypes: string[]): Promise<void> {
    this.logger.debug(`Preloading ${queryTypes.length} query types for tenant ${tenantId}`);
    
    // This is a placeholder - in a real implementation, you would have
    // specific query functions for each query type
    const preloadPromises = queryTypes.map(async (queryType) => {
      const cacheKey = this.generateTenantQueryKey(tenantId, queryType);
      
      // Check if already cached
      const cached = await this.get(cacheKey);
      if (cached === null) {
        this.logger.debug(`Would preload query type: ${queryType} for tenant ${tenantId}`);
        // In real implementation, execute the appropriate query function here
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Get cache health information
   * @returns Cache health object
   */
  getCacheHealth(): {
    status: 'healthy' | 'degraded' | 'critical';
    hitRatio: number;
    memoryUsage: number;
    issues: string[];
  } {
    const hitRatio = this.getHitRatio();
    const memoryUsage = this.cache.size / this.maxCacheSize;
    
    const health = {
      status: 'healthy' as 'healthy' | 'degraded' | 'critical',
      hitRatio,
      memoryUsage,
      issues: [] as string[],
    };

    // Determine health status
    if (hitRatio < 30) {
      health.status = 'critical';
      health.issues.push('Very low cache hit ratio');
    } else if (hitRatio < 50) {
      health.status = 'degraded';
      health.issues.push('Low cache hit ratio');
    }

    if (memoryUsage > 0.9) {
      health.status = health.status === 'critical' ? 'critical' : 'degraded';
      health.issues.push('Query cache near capacity');
    }

    if (this.stats.evictions > this.stats.sets * 0.1) {
      health.status = health.status === 'critical' ? 'critical' : 'degraded';
      health.issues.push('High eviction rate');
    }

    return health;
  }

  /**
   * Update cache size statistic
   */
  private updateCacheSize(): void {
    this.stats.size = this.cache.size;
  }

  /**
   * Evict the oldest cache entries
   * @param count - Number of entries to evict
   */
  private evictOldestEntries(count: number): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by creation time (oldest first)
    entries.sort((a, b) => a[1].createdAt - b[1].createdAt);

    // Remove the oldest entries
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      this.cache.delete(entries[i][0]);
      this.stats.evictions++;
    }

    this.updateCacheSize();
    this.logger.debug(`Evicted ${Math.min(count, entries.length)} oldest query cache entries`);
  }

  /**
   * Start the cleanup timer to remove expired entries
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.cleanupInterval);
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.stats.evictions += expiredCount;
      this.updateCacheSize();
      this.logger.debug(`Cleaned up ${expiredCount} expired query cache entries`);
    }
  }

  /**
   * Cleanup method called when service is destroyed
   */
  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
    this.logger.debug('QueryCacheService destroyed and cache cleared');
  }
}