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
var QueryCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryCacheService = void 0;
const common_1 = require("@nestjs/common");
let QueryCacheService = QueryCacheService_1 = class QueryCacheService {
    logger = new common_1.Logger(QueryCacheService_1.name);
    cache = new Map();
    defaultTtl = 10 * 60 * 1000;
    maxCacheSize = 5000;
    cleanupInterval = 2 * 60 * 1000;
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
    async get(queryKey) {
        const entry = this.cache.get(queryKey);
        if (!entry) {
            this.stats.misses++;
            this.logger.debug(`Query cache miss for key: ${queryKey}`);
            return null;
        }
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
    async set(queryKey, data, ttl) {
        const effectiveTtl = ttl ?? this.defaultTtl;
        const now = Date.now();
        if (this.cache.size >= this.maxCacheSize && !this.cache.has(queryKey)) {
            this.evictOldestEntries(1);
        }
        const entry = {
            data: JSON.parse(JSON.stringify(data)),
            expiresAt: now + effectiveTtl,
            createdAt: now,
            queryKey,
        };
        this.cache.set(queryKey, entry);
        this.stats.sets++;
        this.updateCacheSize();
        this.logger.debug(`Cached query result for key: ${queryKey} (TTL: ${effectiveTtl}ms)`);
    }
    async invalidate(queryKey) {
        const deleted = this.cache.delete(queryKey);
        if (deleted) {
            this.stats.deletes++;
            this.updateCacheSize();
            this.logger.debug(`Invalidated query cache for key: ${queryKey}`);
        }
    }
    async invalidatePattern(pattern) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        const keysToDelete = [];
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
    async clear() {
        const size = this.cache.size;
        this.cache.clear();
        this.stats.deletes += size;
        this.updateCacheSize();
        this.logger.debug(`Cleared all query cache entries (${size} entries removed)`);
    }
    getStats() {
        return { ...this.stats };
    }
    getHitRatio() {
        const total = this.stats.hits + this.stats.misses;
        if (total === 0)
            return 0;
        return (this.stats.hits / total) * 100;
    }
    generateTenantQueryKey(tenantId, queryType, params) {
        const paramString = params ? JSON.stringify(params) : '';
        return `tenant:${tenantId}:${queryType}:${paramString}`;
    }
    generateUserQueryKey(userId, tenantId, queryType, params) {
        const paramString = params ? JSON.stringify(params) : '';
        return `user:${userId}:tenant:${tenantId}:${queryType}:${paramString}`;
    }
    async cacheQuery(queryFn, keyParams, ttl) {
        let cacheKey;
        if (keyParams.userId && keyParams.tenantId) {
            cacheKey = this.generateUserQueryKey(keyParams.userId, keyParams.tenantId, keyParams.queryType, keyParams.params);
        }
        else if (keyParams.tenantId) {
            cacheKey = this.generateTenantQueryKey(keyParams.tenantId, keyParams.queryType, keyParams.params);
        }
        else {
            cacheKey = `global:${keyParams.queryType}:${JSON.stringify(keyParams.params || {})}`;
        }
        const cachedResult = await this.get(cacheKey);
        if (cachedResult !== null) {
            return cachedResult;
        }
        try {
            const result = await queryFn();
            await this.set(cacheKey, result, ttl);
            return result;
        }
        catch (error) {
            this.logger.error(`Query execution failed for key ${cacheKey}:`, error);
            throw error;
        }
    }
    async invalidateTenantQueries(tenantId) {
        await this.invalidatePattern(`tenant:${tenantId}:*`);
        await this.invalidatePattern(`user:*:tenant:${tenantId}:*`);
    }
    async invalidateUserQueries(userId) {
        await this.invalidatePattern(`user:${userId}:*`);
    }
    async preloadTenantQueries(tenantId, queryTypes) {
        this.logger.debug(`Preloading ${queryTypes.length} query types for tenant ${tenantId}`);
        const preloadPromises = queryTypes.map(async (queryType) => {
            const cacheKey = this.generateTenantQueryKey(tenantId, queryType);
            const cached = await this.get(cacheKey);
            if (cached === null) {
                this.logger.debug(`Would preload query type: ${queryType} for tenant ${tenantId}`);
            }
        });
        await Promise.allSettled(preloadPromises);
    }
    getCacheHealth() {
        const hitRatio = this.getHitRatio();
        const memoryUsage = this.cache.size / this.maxCacheSize;
        const health = {
            status: 'healthy',
            hitRatio,
            memoryUsage,
            issues: [],
        };
        if (hitRatio < 30) {
            health.status = 'critical';
            health.issues.push('Very low cache hit ratio');
        }
        else if (hitRatio < 50) {
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
        this.logger.debug(`Evicted ${Math.min(count, entries.length)} oldest query cache entries`);
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
            this.logger.debug(`Cleaned up ${expiredCount} expired query cache entries`);
        }
    }
    onModuleDestroy() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        this.cache.clear();
        this.logger.debug('QueryCacheService destroyed and cache cleared');
    }
};
exports.QueryCacheService = QueryCacheService;
exports.QueryCacheService = QueryCacheService = QueryCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], QueryCacheService);
//# sourceMappingURL=query-cache.service.js.map