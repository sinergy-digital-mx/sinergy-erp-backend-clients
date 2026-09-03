import { Permission } from '../../../entities/rbac/permission.entity';
interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    evictions: number;
    size: number;
}
export declare class PermissionCacheService {
    private readonly logger;
    private readonly cache;
    private readonly defaultTtl;
    private readonly maxCacheSize;
    private readonly cleanupInterval;
    private cleanupTimer;
    private stats;
    constructor();
    getUserPermissions(userId: string, tenantId: string, expectedPermissionsVersion?: number): Promise<Permission[] | null>;
    setUserPermissions(userId: string, tenantId: string, permissions: Permission[], ttl?: number, permissionsVersion?: number): Promise<void>;
    invalidateUserPermissions(userId: string, tenantId: string): Promise<void>;
    invalidateUserPermissionsAllTenants(userId: string): Promise<void>;
    invalidateTenantPermissions(tenantId: string): Promise<void>;
    invalidateRolePermissions(roleId: string, tenantId: string, userIds: string[]): Promise<void>;
    clearAllCache(): Promise<void>;
    getCacheStats(): CacheStats;
    getCacheHitRatio(): number;
    isUserPermissionsCached(userId: string, tenantId: string): boolean;
    warmCache(userId: string, tenantId: string, permissions: Permission[], ttl?: number, permissionsVersion?: number): Promise<void>;
    private getUserPermissionsCacheKey;
    private updateCacheSize;
    private evictOldestEntries;
    private startCleanupTimer;
    private cleanupExpiredEntries;
    onModuleDestroy(): void;
    private handleCacheError;
    private safeCacheOperation;
    getCacheHealth(): {
        status: 'healthy' | 'degraded' | 'critical';
        errorRate: number;
        memoryUsage: number;
        issues: string[];
    };
}
export {};
