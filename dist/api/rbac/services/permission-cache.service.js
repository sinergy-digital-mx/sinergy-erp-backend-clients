"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PermissionCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionCacheService = void 0;
const common_1 = require("@nestjs/common");
let PermissionCacheService = PermissionCacheService_1 = class PermissionCacheService {
    logger = new common_1.Logger(PermissionCacheService_1.name);
    cache = new Map();
    defaultTtl = 5 * 60 * 1000;
    maxCacheSize = 10000;
    cleanupInterval = 60 * 1000;
    cleanupTimer = null;
    stats = {
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
    async getUserPermissions(userId, tenantId, expectedPermissionsVersion) {
        return this.safeCacheOperation(() => {
            const cacheKey = this.getUserPermissionsCacheKey(userId, tenantId);
            const entry = this.cache.get(cacheKey);
            if (!entry) {
                this.stats.misses++;
                this.logger.debug(`Cache miss for user ${userId} in tenant ${tenantId}`);
                return null;
            }
            if (Date.now() > entry.expiresAt) {
                this.cache.delete(cacheKey);
                this.stats.misses++;
                this.stats.evictions++;
                this.updateCacheSize();
                this.logger.debug(`Cache entry expired for user ${userId} in tenant ${tenantId}`);
                return null;
            }
            if (expectedPermissionsVersion !== undefined &&
                entry.permissionsVersion !== expectedPermissionsVersion) {
                this.cache.delete(cacheKey);
                this.stats.misses++;
                this.stats.evictions++;
                this.updateCacheSize();
                this.logger.debug(`Cache stale for user ${userId} in tenant ${tenantId}: cached version ${entry.permissionsVersion ?? 'none'} != current ${expectedPermissionsVersion}`);
                return null;
            }
            this.stats.hits++;
            this.logger.debug(`Cache hit for user ${userId} in tenant ${tenantId}`);
            return entry.data;
        }, 'getUserPermissions', null);
    }
    async setUserPermissions(userId, tenantId, permissions, ttl, permissionsVersion) {
        await this.safeCacheOperation(() => {
            const cacheKey = this.getUserPermissionsCacheKey(userId, tenantId);
            const effectiveTtl = ttl ?? this.defaultTtl;
            const now = Date.now();
            if (this.cache.size >= this.maxCacheSize && !this.cache.has(cacheKey)) {
                this.evictOldestEntries(1);
            }
            const entry = {
                data: [...permissions],
                expiresAt: now + effectiveTtl,
                createdAt: now,
                permissionsVersion,
            };
            this.cache.set(cacheKey, entry);
            this.stats.sets++;
            this.updateCacheSize();
            this.logger.debug(`Cached permissions for user ${userId} in tenant ${tenantId} (TTL: ${effectiveTtl}ms)`);
        }, 'setUserPermissions');
    }
    async invalidateUserPermissions(userId, tenantId) {
        const cacheKey = this.getUserPermissionsCacheKey(userId, tenantId);
        const deleted = this.cache.delete(cacheKey);
        if (deleted) {
            this.stats.deletes++;
            this.updateCacheSize();
            this.logger.debug(`Invalidated cache for user ${userId} in tenant ${tenantId}`);
        }
    }
    async invalidateUserPermissionsAllTenants(userId) {
        const keysToDelete = [];
        const userPrefix = `user_permissions:${userId}:`;
        for (const key of this.cache.keys()) {
            if (key.startsWith(userPrefix)) {
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
        this.logger.debug(`Invalidated ${deletedCount} cache entries for user ${userId} across all tenants`);
    }
    async invalidateTenantPermissions(tenantId) {
        const keysToDelete = [];
        const tenantSuffix = `:${tenantId}`;
        for (const key of this.cache.keys()) {
            if (key.endsWith(tenantSuffix)) {
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
        this.logger.debug(`Invalidated ${deletedCount} cache entries for tenant ${tenantId}`);
    }
    async invalidateRolePermissions(roleId, tenantId, userIds) {
        let deletedCount = 0;
        for (const userId of userIds) {
            const cacheKey = this.getUserPermissionsCacheKey(userId, tenantId);
            if (this.cache.delete(cacheKey)) {
                deletedCount++;
            }
        }
        this.stats.deletes += deletedCount;
        this.updateCacheSize();
        this.logger.debug(`Invalidated ${deletedCount} cache entries for role ${roleId} in tenant ${tenantId}`);
    }
    async clearAllCache() {
        const size = this.cache.size;
        this.cache.clear();
        this.stats.deletes += size;
        this.updateCacheSize();
        this.logger.debug(`Cleared all cache entries (${size} entries removed)`);
    }
    getCacheStats() {
        return { ...this.stats };
    }
    getCacheHitRatio() {
        const total = this.stats.hits + this.stats.misses;
        if (total === 0)
            return 0;
        return (this.stats.hits / total) * 100;
    }
    isUserPermissionsCached(userId, tenantId) {
        const cacheKey = this.getUserPermissionsCacheKey(userId, tenantId);
        const entry = this.cache.get(cacheKey);
        if (!entry)
            return false;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(cacheKey);
            this.stats.evictions++;
            this.updateCacheSize();
            return false;
        }
        return true;
    }
    async warmCache(userId, tenantId, permissions, ttl, permissionsVersion) {
        await this.setUserPermissions(userId, tenantId, permissions, ttl, permissionsVersion);
        this.logger.debug(`Warmed cache for user ${userId} in tenant ${tenantId}`);
    }
    getUserPermissionsCacheKey(userId, tenantId) {
        return `user_permissions:${userId}:${tenantId}`;
    }
    updateCacheSize() {
        this.stats.size = this.cache.size;
    }
    evictOldestEntries(count) {
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => a[1].createdAt - b[1].createdAt);
        for (let i = 0; i < Math.min(count, entries.length); i++) {
            this.cache.delete(entries[i][0]);
            this.stats.evictions++;
        }
        this.updateCacheSize();
        this.logger.debug(`Evicted ${Math.min(count, entries.length)} oldest cache entries`);
    }
    startCleanupTimer() {
        this.cleanupTimer = setInterval(() => {
            this.cleanupExpiredEntries();
        }, this.cleanupInterval);
    }
    cleanupExpiredEntries() {
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
    onModuleDestroy() {
        try {
            if (this.cleanupTimer) {
                clearInterval(this.cleanupTimer);
                this.cleanupTimer = null;
            }
            this.cache.clear();
            this.logger.debug('PermissionCacheService destroyed and cache cleared');
        }
        catch (error) {
            this.logger.error('Error during cache service cleanup:', error);
        }
    }
    handleCacheError(operation, error, fallbackValue) {
        this.logger.warn(`Cache operation '${operation}' failed:`, error);
        this.stats.evictions++;
        return fallbackValue !== undefined ? fallbackValue : null;
    }
    async safeCacheOperation(operation, operationName, fallbackValue) {
        try {
            return await operation();
        }
        catch (error) {
            return this.handleCacheError(operationName, error, fallbackValue);
        }
    }
    getCacheHealth() {
        const stats = this.getCacheStats();
        const errorRate = stats.evictions / Math.max(stats.sets, 1);
        const memoryUsage = this.cache.size / this.maxCacheSize;
        const health = {
            status: 'healthy',
            errorRate,
            memoryUsage,
            issues: [],
        };
        if (errorRate > 0.1) {
            health.status = 'critical';
            health.issues.push('High error rate detected');
        }
        else if (errorRate > 0.05) {
            health.status = 'degraded';
            health.issues.push('Elevated error rate');
        }
        if (memoryUsage > 0.9) {
            health.status = health.status === 'critical' ? 'critical' : 'degraded';
            health.issues.push('Cache near capacity');
        }
        return health;
    }
};
exports.PermissionCacheService = PermissionCacheService;
exports.PermissionCacheService = PermissionCacheService = PermissionCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PermissionCacheService);
//# sourceMappingURL=permission-cache.service.js.map