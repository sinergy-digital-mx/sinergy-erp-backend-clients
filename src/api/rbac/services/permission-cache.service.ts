import { Injectable, Logger } from '@nestjs/common';
import { Permission } from '../../../entities/rbac/permission.entity';

/**
 * Cache entry interface for storing cached permissions with metadata
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

/**
 * Cache statistics for monitoring and debugging
 */
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  size: number;
}

/**
 * Service for caching user permissions to optimize performance and reduce database queries.
 * Implements cache invalidation strategies and provides transparent cache management.
 * 
 * Requirements: 9.2, 9.3
 */
@Injectable()
export class PermissionCacheService {
  private readonly logger = new Logger(PermissionCacheService.name);
  private readonly cache = new Map<string, CacheEntry<Permission[]>>();
  private readonly defaultTtl = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly maxCacheSize = 10000; // Maximum number of cache entries
  private readonly cleanupInterval = 60 * 1000; // Cleanup every minute
  private cleanupTimer: NodeJS.Timeout | null = null;
  
  // Cache statistics for monitoring
  private stats: CacheStats = {
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
   * Get cached user permissions for a specific tenant
   * @param userId - The user ID
   * @param tenantId - The tenant ID
   * @returns Promise<Permission[] | null> - Cached permissions or null if not found/expired
   */
  async getUserPermissions(
    userId: string,
    tenantId: string,
  ): Promise<Permission[] | null> {
    return this.safeCacheOperation(
      () => {
        const cacheKey = this.getUserPermissionsCacheKey(userId, tenantId);
        const entry = this.cache.get(cacheKey);

        if (!entry) {
          this.stats.misses++;
          this.logger.debug(`Cache miss for user ${userId} in tenant ${tenantId}`);
          return null;
        }

        // Check if entry has expired
        if (Date.now() > entry.expiresAt) {
          this.cache.delete(cacheKey);
          this.stats.misses++;
          this.stats.evictions++;
          this.updateCacheSize();
          this.logger.debug(`Cache entry expired for user ${userId} in tenant ${tenantId}`);
          return null;
        }

        this.stats.hits++;
        this.logger.debug(`Cache hit for user ${userId} in tenant ${tenantId}`);
        return entry.data;
      },
      'getUserPermissions',
      null,
    );
  }

  /**
   * Cache user permissions with specified TTL
   * @param userId - The user ID
   * @param tenantId - The tenant ID
   * @param permissions - The permissions to cache
   * @param ttl - Time to live in milliseconds (optional, uses default if not provided)
   * @returns Promise<void>
   */
  async setUserPermissions(
    userId: string,
    tenantId: string,
    permissions: Permission[],
    ttl?: number,
  ): Promise<void> {
    await this.safeCacheOperation(
      () => {
        const cacheKey = this.getUserPermissionsCacheKey(userId, tenantId);
        const effectiveTtl = ttl ?? this.defaultTtl;
        const now = Date.now();

        // Check if we need to evict entries to stay under max size
        if (this.cache.size >= this.maxCacheSize && !this.cache.has(cacheKey)) {
          this.evictOldestEntries(1);
        }

        const entry: CacheEntry<Permission[]> = {
          data: [...permissions], // Create a copy to avoid reference issues
          expiresAt: now + effectiveTtl,
          createdAt: now,
        };

        this.cache.set(cacheKey, entry);
        this.stats.sets++;
        this.updateCacheSize();

        this.logger.debug(
          `Cached permissions for user ${userId} in tenant ${tenantId} (TTL: ${effectiveTtl}ms)`,
        );
      },
      'setUserPermissions',
    );
  }

  /**
   * Invalidate cached permissions for a specific user in a tenant
   * @param userId - The user ID
   * @param tenantId - The tenant ID
   * @returns Promise<void>
   */
  async invalidateUserPermissions(
    userId: string,
    tenantId: string,
  ): Promise<void> {
    const cacheKey = this.getUserPermissionsCacheKey(userId, tenantId);
    const deleted = this.cache.delete(cacheKey);

    if (deleted) {
      this.stats.deletes++;
      this.updateCacheSize();
      this.logger.debug(`Invalidated cache for user ${userId} in tenant ${tenantId}`);
    }
  }

  /**
   * Invalidate all cached permissions for a specific user across all tenants
   * @param userId - The user ID
   * @returns Promise<void>
   */
  async invalidateUserPermissionsAllTenants(userId: string): Promise<void> {
    const keysToDelete: string[] = [];
    const userPrefix = `user_permissions:${userId}:`;

    // Find all cache keys for this user
    for (const key of this.cache.keys()) {
      if (key.startsWith(userPrefix)) {
        keysToDelete.push(key);
      }
    }

    // Delete all matching entries
    let deletedCount = 0;
    for (const key of keysToDelete) {
      if (this.cache.delete(key)) {
        deletedCount++;
      }
    }

    this.stats.deletes += deletedCount;
    this.updateCacheSize();

    this.logger.debug(
      `Invalidated ${deletedCount} cache entries for user ${userId} across all tenants`,
    );
  }

  /**
   * Invalidate all cached permissions for a specific tenant
   * @param tenantId - The tenant ID
   * @returns Promise<void>
   */
  async invalidateTenantPermissions(tenantId: string): Promise<void> {
    const keysToDelete: string[] = [];
    const tenantSuffix = `:${tenantId}`;

    // Find all cache keys for this tenant
    for (const key of this.cache.keys()) {
      if (key.endsWith(tenantSuffix)) {
        keysToDelete.push(key);
      }
    }

    // Delete all matching entries
    let deletedCount = 0;
    for (const key of keysToDelete) {
      if (this.cache.delete(key)) {
        deletedCount++;
      }
    }

    this.stats.deletes += deletedCount;
    this.updateCacheSize();

    this.logger.debug(
      `Invalidated ${deletedCount} cache entries for tenant ${tenantId}`,
    );
  }

  /**
   * Invalidate all cached permissions for users with a specific role
   * This is called when role permissions are modified
   * @param roleId - The role ID
   * @param tenantId - The tenant ID
   * @param userIds - Array of user IDs that have this role
   * @returns Promise<void>
   */
  async invalidateRolePermissions(
    roleId: string,
    tenantId: string,
    userIds: string[],
  ): Promise<void> {
    let deletedCount = 0;

    for (const userId of userIds) {
      const cacheKey = this.getUserPermissionsCacheKey(userId, tenantId);
      if (this.cache.delete(cacheKey)) {
        deletedCount++;
      }
    }

    this.stats.deletes += deletedCount;
    this.updateCacheSize();

    this.logger.debug(
      `Invalidated ${deletedCount} cache entries for role ${roleId} in tenant ${tenantId}`,
    );
  }

  /**
   * Clear all cached permissions
   * @returns Promise<void>
   */
  async clearAllCache(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
    this.updateCacheSize();

    this.logger.debug(`Cleared all cache entries (${size} entries removed)`);
  }

  /**
   * Get cache statistics for monitoring
   * @returns CacheStats - Current cache statistics
   */
  getCacheStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache hit ratio as a percentage
   * @returns number - Hit ratio percentage (0-100)
   */
  getCacheHitRatio(): number {
    const total = this.stats.hits + this.stats.misses;
    if (total === 0) return 0;
    return (this.stats.hits / total) * 100;
  }

  /**
   * Check if a specific user's permissions are cached
   * @param userId - The user ID
   * @param tenantId - The tenant ID
   * @returns boolean - True if cached and not expired
   */
  isUserPermissionsCached(userId: string, tenantId: string): boolean {
    const cacheKey = this.getUserPermissionsCacheKey(userId, tenantId);
    const entry = this.cache.get(cacheKey);

    if (!entry) return false;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(cacheKey);
      this.stats.evictions++;
      this.updateCacheSize();
      return false;
    }

    return true;
  }

  /**
   * Warm the cache with user permissions
   * This can be called proactively to populate the cache
   * @param userId - The user ID
   * @param tenantId - The tenant ID
   * @param permissions - The permissions to cache
   * @param ttl - Optional TTL override
   * @returns Promise<void>
   */
  async warmCache(
    userId: string,
    tenantId: string,
    permissions: Permission[],
    ttl?: number,
  ): Promise<void> {
    await this.setUserPermissions(userId, tenantId, permissions, ttl);
    this.logger.debug(`Warmed cache for user ${userId} in tenant ${tenantId}`);
  }

  /**
   * Generate cache key for user permissions
   * @param userId - The user ID
   * @param tenantId - The tenant ID
   * @returns string - The cache key
   */
  private getUserPermissionsCacheKey(userId: string, tenantId: string): string {
    return `user_permissions:${userId}:${tenantId}`;
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
    this.logger.debug(`Evicted ${Math.min(count, entries.length)} oldest cache entries`);
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
      this.logger.debug(`Cleaned up ${expiredCount} expired cache entries`);
    }
  }

  /**
   * Cleanup method called when service is destroyed
   */
  onModuleDestroy(): void {
    try {
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
        this.cleanupTimer = null;
      }
      this.cache.clear();
      this.logger.debug('PermissionCacheService destroyed and cache cleared');
    } catch (error) {
      this.logger.error('Error during cache service cleanup:', error);
      // Graceful degradation: Don't throw errors during cleanup
    }
  }

  /**
   * Handle cache operation errors gracefully
   * @param operation - The operation that failed
   * @param error - The error that occurred
   * @param fallbackValue - Optional fallback value to return
   */
  private handleCacheError<T>(operation: string, error: any, fallbackValue?: T): T | null {
    this.logger.warn(`Cache operation '${operation}' failed:`, error);
    
    // Update error statistics
    this.stats.evictions++; // Count as eviction for monitoring
    
    // Return fallback value or null
    return fallbackValue !== undefined ? fallbackValue : null;
  }

  /**
   * Safe cache operation wrapper with error handling
   * @param operation - Function to execute
   * @param operationName - Name of the operation for logging
   * @param fallbackValue - Fallback value if operation fails
   */
  private async safeCacheOperation<T>(
    operation: () => Promise<T> | T,
    operationName: string,
    fallbackValue?: T,
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      return this.handleCacheError(operationName, error, fallbackValue);
    }
  }

  /**
   * Get cache health status
   * @returns object - Cache health information
   */
  getCacheHealth(): {
    status: 'healthy' | 'degraded' | 'critical';
    errorRate: number;
    memoryUsage: number;
    issues: string[];
  } {
    const stats = this.getCacheStats();
    const errorRate = stats.evictions / Math.max(stats.sets, 1);
    const memoryUsage = this.cache.size / this.maxCacheSize;
    
    const health = {
      status: 'healthy' as 'healthy' | 'degraded' | 'critical',
      errorRate,
      memoryUsage,
      issues: [] as string[],
    };

    // Determine health status
    if (errorRate > 0.1) {
      health.status = 'critical';
      health.issues.push('High error rate detected');
    } else if (errorRate > 0.05) {
      health.status = 'degraded';
      health.issues.push('Elevated error rate');
    }

    if (memoryUsage > 0.9) {
      health.status = health.status === 'critical' ? 'critical' : 'degraded';
      health.issues.push('Cache near capacity');
    }

    return health;
  }
}