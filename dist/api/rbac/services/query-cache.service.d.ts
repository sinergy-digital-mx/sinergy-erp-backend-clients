export declare class QueryCacheService {
    private readonly logger;
    private readonly cache;
    private readonly defaultTtl;
    private readonly maxCacheSize;
    private readonly cleanupInterval;
    private cleanupTimer;
    private stats;
    constructor();
    get<T>(queryKey: string): Promise<T | null>;
    set<T>(queryKey: string, data: T, ttl?: number): Promise<void>;
    invalidate(queryKey: string): Promise<void>;
    invalidatePattern(pattern: string): Promise<void>;
    clear(): Promise<void>;
    getStats(): {
        hits: number;
        misses: number;
        sets: number;
        deletes: number;
        evictions: number;
        size: number;
    };
    getHitRatio(): number;
    generateTenantQueryKey(tenantId: string, queryType: string, params?: Record<string, any>): string;
    generateUserQueryKey(userId: string, tenantId: string, queryType: string, params?: Record<string, any>): string;
    cacheQuery<T>(queryFn: () => Promise<T>, keyParams: {
        tenantId?: string;
        userId?: string;
        queryType: string;
        params?: Record<string, any>;
    }, ttl?: number): Promise<T>;
    invalidateTenantQueries(tenantId: string): Promise<void>;
    invalidateUserQueries(userId: string): Promise<void>;
    preloadTenantQueries(tenantId: string, queryTypes: string[]): Promise<void>;
    getCacheHealth(): {
        status: 'healthy' | 'degraded' | 'critical';
        hitRatio: number;
        memoryUsage: number;
        issues: string[];
    };
    private updateCacheSize;
    private evictOldestEntries;
    private startCleanupTimer;
    private cleanupExpiredEntries;
    onModuleDestroy(): void;
}
