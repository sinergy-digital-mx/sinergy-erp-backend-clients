import { Repository } from 'typeorm';
import { Permission } from '../../../entities/rbac/permission.entity';
import { UserRole } from '../../../entities/rbac/user-role.entity';
import { RolePermission } from '../../../entities/rbac/role-permission.entity';
import { EntityRegistry } from '../../../entities/entity-registry/entity-registry.entity';
import { TenantContextService } from './tenant-context.service';
import { PermissionCacheService } from './permission-cache.service';
import { PermissionVersionService } from './permission-version.service';
import { QueryCacheService } from './query-cache.service';
export interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    evictions: number;
    size: number;
}
export declare class PermissionService {
    private permissionRepository;
    private userRoleRepository;
    private rolePermissionRepository;
    private entityRegistryRepository;
    private tenantContextService;
    private permissionCacheService;
    private permissionVersionService;
    private queryCacheService;
    private readonly logger;
    constructor(permissionRepository: Repository<Permission>, userRoleRepository: Repository<UserRole>, rolePermissionRepository: Repository<RolePermission>, entityRegistryRepository: Repository<EntityRegistry>, tenantContextService: TenantContextService, permissionCacheService: PermissionCacheService, permissionVersionService: PermissionVersionService, queryCacheService: QueryCacheService);
    hasPermission(userId: string, tenantId: string, entityType: string, action: string): Promise<boolean>;
    hasPermissionInCurrentContext(entityType: string, action: string): Promise<boolean>;
    getUserPermissions(userId: string, tenantId: string): Promise<Permission[]>;
    getCurrentUserPermissions(): Promise<Permission[]>;
    createPermission(entityType: string, action: string, description?: string): Promise<Permission>;
    private userHasAdminRole;
    validateEntityType(entityType: string): Promise<boolean>;
    getAvailableEntityTypes(): Promise<string[]>;
    getSupportedActions(): string[];
    validateAction(action: string): boolean;
    findPermission(entityType: string, action: string): Promise<Permission | null>;
    getAllPermissions(): Promise<Permission[]>;
    private validateTenantContext;
    checkBulkPermissions(userId: string, tenantId: string, permissions: Array<{
        entityType: string;
        action: string;
    }>): Promise<boolean[]>;
    checkPermissionForMultipleUsers(userIds: string[], tenantId: string, entityType: string, action: string): Promise<Map<string, boolean>>;
    checkAnyPermissionForMultipleUsers(userIds: string[], tenantId: string, permissions: Array<{
        entityType: string;
        action: string;
    }>): Promise<Map<string, boolean>>;
    filterItemsByPermission<T extends {
        id?: string;
    }>(userId: string, tenantId: string, items: T[], entityType: string, action: string, getItemId?: (item: T) => string): Promise<T[]>;
    getUsersWithPermission(tenantId: string, entityType: string, action: string, limit?: number): Promise<string[]>;
    checkPermissionForMultipleEntities(userId: string, tenantId: string, entityType: string, action: string, entityIds: string[]): Promise<Map<string, boolean>>;
    validateUserTenantAccess(userId: string, tenantId: string): Promise<boolean>;
    invalidateUserPermissionsCache(userId: string, tenantId: string): Promise<void>;
    invalidateRolePermissionsCache(roleId: string, tenantId: string, userIds?: string[]): Promise<void>;
    invalidateTenantPermissionsCache(tenantId: string): Promise<void>;
    getCacheStats(): CacheStats;
    getCacheHitRatio(): number;
    getCachePerformanceMetrics(): {
        hitRatio: number;
        missRatio: number;
        efficiency: string;
        recommendations: string[];
        hits: number;
        misses: number;
        sets: number;
        deletes: number;
        evictions: number;
        size: number;
    };
    private generateCacheRecommendations;
    performCacheHealthCheck(): Promise<{
        status: "healthy" | "warning" | "critical";
        metrics: {
            hitRatio: number;
            missRatio: number;
            efficiency: string;
            recommendations: string[];
            hits: number;
            misses: number;
            sets: number;
            deletes: number;
            evictions: number;
            size: number;
        };
        issues: string[];
        timestamp: string;
    }>;
    warmUserPermissionsCache(userId: string, tenantId: string): Promise<void>;
    warmMultipleUsersCache(userIds: string[], tenantId: string): Promise<void>;
    warmTenantUsersCache(tenantId: string, limit?: number): Promise<void>;
    warmRoleUsersCache(roleIds: string[], tenantId: string): Promise<void>;
    warmCacheOnLogin(userId: string, tenantId: string): Promise<void>;
    refreshUserPermissionsCache(userId: string, tenantId: string): Promise<void>;
    getCacheWarmingRecommendations(tenantId: string): Promise<string[]>;
    private getUserPermissionsFromDatabase;
    private getUserPermissionsOptimized;
    getBulkUserPermissions(userIds: string[], tenantId: string): Promise<Map<string, Permission[]>>;
    getRoleHierarchyWithPermissions(tenantId: string): Promise<Array<{
        role: {
            id: string;
            name: string;
            description: string;
            is_system_role: boolean;
            user_count: number;
        };
        permissions: Permission[];
    }>>;
    getPermissionUsageStats(tenantId: string, limit?: number): Promise<Array<{
        permission: Permission;
        usage_count: number;
        role_count: number;
    }>>;
    preloadFrequentlyAccessedPermissions(tenantId: string, limit?: number): Promise<void>;
    analyzeQueryPerformance(tenantId: string): Promise<{
        recommendations: string[];
        stats: {
            total_users: number;
            total_roles: number;
            total_permissions: number;
            avg_permissions_per_user: number;
            avg_users_per_role: number;
        };
    }>;
    private getUserPermissionsWithFallback;
    private validateEntityTypeWithFallback;
    private isCriticalSystemError;
    getSystemHealthStatus(): Promise<{
        status: 'healthy' | 'degraded' | 'critical';
        services: {
            database: 'healthy' | 'degraded' | 'critical';
            cache: 'healthy' | 'degraded' | 'critical';
            entityRegistry: 'healthy' | 'degraded' | 'critical';
        };
        issues: string[];
        timestamp: string;
    }>;
    setGracefulDegradationMode(enabled: boolean): void;
    private isGracefulDegradationEnabled;
    getUserRoles(userId: string, tenantId: string): Promise<any[]>;
}
