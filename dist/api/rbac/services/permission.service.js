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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PermissionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionService = void 0;
const common_1 = require("@nestjs/common");
const error_utils_1 = require("../errors/error-utils");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const permission_entity_1 = require("../../../entities/rbac/permission.entity");
const user_role_entity_1 = require("../../../entities/rbac/user-role.entity");
const role_permission_entity_1 = require("../../../entities/rbac/role-permission.entity");
const entity_registry_entity_1 = require("../../../entities/entity-registry/entity-registry.entity");
const tenant_context_service_1 = require("./tenant-context.service");
const permission_cache_service_1 = require("./permission-cache.service");
const permission_version_service_1 = require("./permission-version.service");
const query_cache_service_1 = require("./query-cache.service");
let PermissionService = PermissionService_1 = class PermissionService {
    permissionRepository;
    userRoleRepository;
    rolePermissionRepository;
    entityRegistryRepository;
    tenantContextService;
    permissionCacheService;
    permissionVersionService;
    queryCacheService;
    logger = new common_1.Logger(PermissionService_1.name);
    constructor(permissionRepository, userRoleRepository, rolePermissionRepository, entityRegistryRepository, tenantContextService, permissionCacheService, permissionVersionService, queryCacheService) {
        this.permissionRepository = permissionRepository;
        this.userRoleRepository = userRoleRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.entityRegistryRepository = entityRegistryRepository;
        this.tenantContextService = tenantContextService;
        this.permissionCacheService = permissionCacheService;
        this.permissionVersionService = permissionVersionService;
        this.queryCacheService = queryCacheService;
    }
    async hasPermission(userId, tenantId, entityType, action) {
        try {
            this.validateTenantContext(tenantId, userId);
            const hasAdminRole = await this.userHasAdminRole(userId, tenantId);
            if (hasAdminRole) {
                this.logger.debug(`User ${userId} has admin role - granting all permissions`);
                return true;
            }
            const isValidEntity = await this.validateEntityTypeWithFallback(entityType);
            if (!isValidEntity) {
                error_utils_1.RBACErrorUtils.throwInvalidEntityType(entityType);
            }
            let userPermissions = await this.getUserPermissionsWithFallback(userId, tenantId);
            return userPermissions?.some(permission => permission?.entity_type?.toLowerCase() === entityType.toLowerCase() && permission?.action?.toLowerCase() === action.toLowerCase()) || false;
        }
        catch (error) {
            this.logger.error(`Error checking permission for user ${userId} in tenant ${tenantId}:`, error);
            if (this.isCriticalSystemError(error)) {
                this.logger.error(`Critical system error during permission check - denying access for safety`, {
                    userId,
                    tenantId,
                    entityType,
                    action,
                    error: error.message,
                });
                return false;
            }
            if (error instanceof common_1.UnauthorizedException &&
                error.message?.includes('Cross-tenant access denied') &&
                tenantId.includes('deleted')) {
                this.logger.warn(`Deleted tenant access attempt - denying access gracefully`, {
                    userId,
                    tenantId,
                    entityType,
                    action,
                });
                return false;
            }
            throw error;
        }
    }
    async hasPermissionInCurrentContext(entityType, action) {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        const userId = this.tenantContextService.getCurrentUserId();
        if (!tenantId || !userId) {
            throw new common_1.UnauthorizedException('Tenant context is required');
        }
        return this.hasPermission(userId, tenantId, entityType, action);
    }
    async getUserPermissions(userId, tenantId) {
        try {
            this.validateTenantContext(tenantId, userId);
            const currentUserId = this.tenantContextService.getCurrentUserId();
            if (userId !== currentUserId) {
                this.logger.debug(`Cross-user access: User ${currentUserId} accessing permissions for user ${userId} in tenant ${tenantId}`);
            }
            return await this.getUserPermissionsWithFallback(userId, tenantId);
        }
        catch (error) {
            this.logger.error(`Error getting permissions for user ${userId} in tenant ${tenantId}:`, error);
            if (this.isCriticalSystemError(error)) {
                this.logger.error(`Critical system error during permission retrieval - returning empty permissions`, {
                    userId,
                    tenantId,
                    error: error.message,
                });
                return [];
            }
            throw error;
        }
    }
    async getCurrentUserPermissions() {
        const tenantId = this.tenantContextService.getCurrentTenantId();
        const userId = this.tenantContextService.getCurrentUserId();
        if (!tenantId || !userId) {
            throw new common_1.UnauthorizedException('Tenant context is required');
        }
        return this.getUserPermissions(userId, tenantId);
    }
    async createPermission(entityType, action, description) {
        const isValidEntity = await this.validateEntityType(entityType);
        if (!isValidEntity) {
            throw new common_1.BadRequestException(`Invalid entity type: ${entityType}`);
        }
        const existingPermission = await this.permissionRepository.findOne({
            where: { entity_type: entityType, action },
        });
        if (existingPermission) {
            throw new common_1.BadRequestException(`Permission already exists for ${entityType}:${action}`);
        }
        const permission = this.permissionRepository.create({
            entity_type: entityType,
            action,
            description,
            is_system_permission: false,
        });
        return await this.permissionRepository.save(permission);
    }
    async userHasAdminRole(userId, tenantId) {
        try {
            const userRole = await this.userRoleRepository
                .createQueryBuilder('ur')
                .innerJoin('ur.role', 'r')
                .select('r.is_admin')
                .where('ur.user_id = :userId', { userId })
                .andWhere('ur.tenant_id = :tenantId', { tenantId })
                .andWhere('r.is_admin = :isAdmin', { isAdmin: true })
                .limit(1)
                .getRawOne();
            return !!userRole;
        }
        catch (error) {
            this.logger.warn(`Error checking admin role for user ${userId}:`, error);
            return false;
        }
    }
    async validateEntityType(entityType) {
        const entity = await this.entityRegistryRepository.findOne({
            where: { code: entityType },
        });
        return !!entity;
    }
    async getAvailableEntityTypes() {
        const entities = await this.entityRegistryRepository.find({
            select: ['code'],
        });
        return entities.map(entity => entity.code);
    }
    getSupportedActions() {
        return [
            'Create',
            'Read',
            'Update',
            'Delete',
            'Export',
            'Import',
            'Download_Report',
            'Bulk_Update',
            'Bulk_Delete',
            'ViewMenu',
            'Transfer',
            'Write',
        ];
    }
    validateAction(action) {
        return this.getSupportedActions().includes(action);
    }
    async findPermission(entityType, action) {
        return await this.permissionRepository.findOne({
            where: { entity_type: entityType, action },
        });
    }
    async getAllPermissions() {
        return await this.permissionRepository.find({
            order: { entity_type: 'ASC', action: 'ASC' },
        });
    }
    validateTenantContext(tenantId, userId) {
        const currentTenantId = this.tenantContextService.getCurrentTenantId();
        if (currentTenantId && currentTenantId !== tenantId) {
            throw new common_1.UnauthorizedException('Cross-tenant access denied: Tenant context mismatch');
        }
    }
    async checkBulkPermissions(userId, tenantId, permissions) {
        this.validateTenantContext(tenantId, userId);
        const userPermissions = await this.getUserPermissions(userId, tenantId);
        const permissionMap = new Map();
        userPermissions.forEach(permission => {
            const key = `${permission.entity_type}:${permission.action}`;
            permissionMap.set(key, true);
        });
        const results = [];
        for (const permission of permissions) {
            const key = `${permission.entityType}:${permission.action}`;
            results.push(permissionMap.has(key));
        }
        this.logger.debug(`Bulk permission check for user ${userId} in tenant ${tenantId}: ${results.length} permissions checked`);
        return results;
    }
    async checkPermissionForMultipleUsers(userIds, tenantId, entityType, action) {
        const isValidEntity = await this.validateEntityTypeWithFallback(entityType);
        if (!isValidEntity) {
            error_utils_1.RBACErrorUtils.throwInvalidEntityType(entityType);
        }
        const results = new Map();
        const permissionChecks = userIds.map(async (userId) => {
            try {
                const hasPermission = await this.hasPermission(userId, tenantId, entityType, action);
                return { userId, hasPermission, error: null };
            }
            catch (error) {
                this.logger.warn(`Failed to check permission for user ${userId}:`, error);
                return { userId, hasPermission: false, error };
            }
        });
        const settledResults = await Promise.allSettled(permissionChecks);
        settledResults.forEach((result, index) => {
            const userId = userIds[index];
            if (result.status === 'fulfilled') {
                results.set(userId, result.value.hasPermission);
            }
            else {
                this.logger.error(`Permission check failed for user ${userId}:`, result.reason);
                results.set(userId, false);
            }
        });
        this.logger.debug(`Bulk user permission check for ${userIds.length} users in tenant ${tenantId}: ${entityType}:${action}`);
        return results;
    }
    async checkAnyPermissionForMultipleUsers(userIds, tenantId, permissions) {
        const results = new Map();
        const permissionChecks = userIds.map(async (userId) => {
            try {
                const bulkResults = await this.checkBulkPermissions(userId, tenantId, permissions);
                const hasAnyPermission = bulkResults.some(result => result);
                return { userId, hasAnyPermission, error: null };
            }
            catch (error) {
                this.logger.warn(`Failed to check permissions for user ${userId}:`, error);
                return { userId, hasAnyPermission: false, error };
            }
        });
        const settledResults = await Promise.allSettled(permissionChecks);
        settledResults.forEach((result, index) => {
            const userId = userIds[index];
            if (result.status === 'fulfilled') {
                results.set(userId, result.value.hasAnyPermission);
            }
            else {
                this.logger.error(`Permission check failed for user ${userId}:`, result.reason);
                results.set(userId, false);
            }
        });
        this.logger.debug(`Bulk any-permission check for ${userIds.length} users in tenant ${tenantId}`);
        return results;
    }
    async filterItemsByPermission(userId, tenantId, items, entityType, action, getItemId) {
        const hasPermission = await this.hasPermission(userId, tenantId, entityType, action);
        if (!hasPermission) {
            this.logger.debug(`User ${userId} lacks ${action} permission for ${entityType}, returning empty list`);
            return [];
        }
        this.logger.debug(`User ${userId} has ${action} permission for ${entityType}, returning ${items.length} items`);
        return items;
    }
    async getUsersWithPermission(tenantId, entityType, action, limit = 100) {
        const isValidEntity = await this.validateEntityTypeWithFallback(entityType);
        if (!isValidEntity) {
            error_utils_1.RBACErrorUtils.throwInvalidEntityType(entityType);
        }
        const permission = await this.findPermission(entityType, action);
        if (!permission) {
            this.logger.debug(`Permission ${entityType}:${action} not found`);
            return [];
        }
        const usersWithPermission = await this.userRoleRepository
            .createQueryBuilder('ur')
            .innerJoin('ur.role', 'r')
            .innerJoin('r.role_permissions', 'rp')
            .innerJoin('rp.permission', 'p')
            .select('DISTINCT ur.user_id', 'userId')
            .where('ur.tenant_id = :tenantId', { tenantId })
            .andWhere('p.id = :permissionId', { permissionId: permission.id })
            .limit(limit)
            .getRawMany();
        const userIds = usersWithPermission.map(u => u.userId);
        this.logger.debug(`Found ${userIds.length} users with ${entityType}:${action} permission in tenant ${tenantId}`);
        return userIds;
    }
    async checkPermissionForMultipleEntities(userId, tenantId, entityType, action, entityIds) {
        const hasBasePermission = await this.hasPermission(userId, tenantId, entityType, action);
        const results = new Map();
        if (!hasBasePermission) {
            entityIds.forEach(entityId => {
                results.set(entityId, false);
            });
            this.logger.debug(`User ${userId} lacks base permission ${entityType}:${action}, denying all ${entityIds.length} entities`);
            return results;
        }
        entityIds.forEach(entityId => {
            results.set(entityId, true);
        });
        this.logger.debug(`User ${userId} has base permission ${entityType}:${action}, granting all ${entityIds.length} entities`);
        return results;
    }
    async validateUserTenantAccess(userId, tenantId) {
        const userRole = await this.userRoleRepository.findOne({
            where: { user_id: userId, tenant_id: tenantId },
        });
        return !!userRole;
    }
    async invalidateUserPermissionsCache(userId, tenantId) {
        await this.permissionCacheService.invalidateUserPermissions(userId, tenantId);
        await this.queryCacheService.invalidateUserQueries(userId);
        this.logger.debug(`Invalidated cache for user ${userId} in tenant ${tenantId}`);
    }
    async invalidateRolePermissionsCache(roleId, tenantId, userIds) {
        let affectedUserIds = userIds;
        if (!affectedUserIds) {
            const usersWithRole = await this.userRoleRepository.find({
                where: { role_id: roleId, tenant_id: tenantId },
                select: ['user_id'],
            });
            affectedUserIds = usersWithRole.map(ur => ur.user_id);
        }
        await this.permissionCacheService.invalidateRolePermissions(roleId, tenantId, affectedUserIds);
        for (const userId of affectedUserIds) {
            await this.queryCacheService.invalidateUserQueries(userId);
        }
        await this.queryCacheService.invalidateTenantQueries(tenantId);
        this.logger.debug(`Invalidated cache for ${affectedUserIds.length} users with role ${roleId} in tenant ${tenantId}`);
    }
    async invalidateTenantPermissionsCache(tenantId) {
        await this.permissionCacheService.invalidateTenantPermissions(tenantId);
        await this.queryCacheService.invalidateTenantQueries(tenantId);
        this.logger.debug(`Invalidated all cached permissions for tenant ${tenantId}`);
    }
    getCacheStats() {
        return this.permissionCacheService.getCacheStats();
    }
    getCacheHitRatio() {
        return this.permissionCacheService.getCacheHitRatio();
    }
    getCachePerformanceMetrics() {
        const stats = this.getCacheStats();
        const hitRatio = this.getCacheHitRatio();
        return {
            ...stats,
            hitRatio,
            missRatio: 100 - hitRatio,
            efficiency: hitRatio > 80 ? 'excellent' : hitRatio > 60 ? 'good' : hitRatio > 40 ? 'fair' : 'poor',
            recommendations: this.generateCacheRecommendations(stats, hitRatio),
        };
    }
    generateCacheRecommendations(stats, hitRatio) {
        const recommendations = [];
        if (hitRatio < 50) {
            recommendations.push('Consider implementing proactive cache warming for frequently accessed users');
        }
        if (stats.evictions > stats.sets * 0.1) {
            recommendations.push('High eviction rate detected - consider increasing cache size or TTL');
        }
        if (stats.size === 0 && stats.misses > 0) {
            recommendations.push('Cache is empty but requests are being made - check cache configuration');
        }
        if (hitRatio > 90 && stats.size < 1000) {
            recommendations.push('Excellent hit ratio with low cache usage - consider expanding cache warming');
        }
        return recommendations;
    }
    async performCacheHealthCheck() {
        const stats = this.getCacheStats();
        const hitRatio = this.getCacheHitRatio();
        const health = {
            status: 'healthy',
            metrics: this.getCachePerformanceMetrics(),
            issues: [],
            timestamp: new Date().toISOString(),
        };
        if (hitRatio < 30) {
            health.status = 'critical';
            health.issues.push('Very low cache hit ratio - performance may be severely impacted');
        }
        else if (hitRatio < 50) {
            health.status = 'warning';
            health.issues.push('Low cache hit ratio - consider cache warming strategies');
        }
        if (stats.evictions > stats.sets * 0.2) {
            health.status = health.status === 'critical' ? 'critical' : 'warning';
            health.issues.push('High cache eviction rate - cache may be undersized');
        }
        this.logger.debug(`Cache health check completed: ${health.status} (hit ratio: ${hitRatio.toFixed(2)}%)`);
        return health;
    }
    async warmUserPermissionsCache(userId, tenantId) {
        const permissions = await this.getUserPermissionsOptimized(userId, tenantId);
        const permissionsVersion = await this.permissionVersionService.getUserVersion(userId);
        await this.permissionCacheService.warmCache(userId, tenantId, permissions, undefined, permissionsVersion);
        this.logger.debug(`Warmed cache for user ${userId} in tenant ${tenantId} with ${permissions.length} permissions`);
    }
    async warmMultipleUsersCache(userIds, tenantId) {
        this.logger.debug(`Starting cache warming for ${userIds.length} users in tenant ${tenantId}`);
        const warmingPromises = userIds.map(userId => this.warmUserPermissionsCache(userId, tenantId).catch(error => {
            this.logger.warn(`Failed to warm cache for user ${userId} in tenant ${tenantId}:`, error);
        }));
        await Promise.allSettled(warmingPromises);
        this.logger.debug(`Completed cache warming for ${userIds.length} users in tenant ${tenantId}`);
    }
    async warmTenantUsersCache(tenantId, limit = 100) {
        this.logger.debug(`Starting cache warming for active users in tenant ${tenantId} (limit: ${limit})`);
        const activeUsers = await this.userRoleRepository
            .createQueryBuilder('ur')
            .select('DISTINCT ur.user_id', 'userId')
            .where('ur.tenant_id = :tenantId', { tenantId })
            .limit(limit)
            .getRawMany();
        const userIds = activeUsers.map(user => user.userId);
        if (userIds.length > 0) {
            await this.warmMultipleUsersCache(userIds, tenantId);
            this.logger.debug(`Warmed cache for ${userIds.length} active users in tenant ${tenantId}`);
        }
        else {
            this.logger.debug(`No active users found in tenant ${tenantId}`);
        }
    }
    async warmRoleUsersCache(roleIds, tenantId) {
        this.logger.debug(`Starting cache warming for users with roles ${roleIds.join(', ')} in tenant ${tenantId}`);
        const usersWithRoles = await this.userRoleRepository
            .createQueryBuilder('ur')
            .select('DISTINCT ur.user_id', 'userId')
            .where('ur.role_id IN (:...roleIds)', { roleIds })
            .andWhere('ur.tenant_id = :tenantId', { tenantId })
            .getRawMany();
        const userIds = usersWithRoles.map(user => user.userId);
        if (userIds.length > 0) {
            await this.warmMultipleUsersCache(userIds, tenantId);
            this.logger.debug(`Warmed cache for ${userIds.length} users with specified roles in tenant ${tenantId}`);
        }
        else {
            this.logger.debug(`No users found with specified roles in tenant ${tenantId}`);
        }
    }
    async warmCacheOnLogin(userId, tenantId) {
        const isCached = this.permissionCacheService.isUserPermissionsCached(userId, tenantId);
        if (!isCached) {
            await this.warmUserPermissionsCache(userId, tenantId);
            this.logger.debug(`Proactively warmed cache for user ${userId} on login to tenant ${tenantId}`);
        }
        else {
            this.logger.debug(`Cache already warm for user ${userId} in tenant ${tenantId}`);
        }
    }
    async refreshUserPermissionsCache(userId, tenantId) {
        await this.permissionCacheService.invalidateUserPermissions(userId, tenantId);
        await this.warmUserPermissionsCache(userId, tenantId);
        this.logger.debug(`Refreshed cache for user ${userId} in tenant ${tenantId}`);
    }
    async getCacheWarmingRecommendations(tenantId) {
        const recentlyActiveUsers = await this.userRoleRepository
            .createQueryBuilder('ur')
            .select('DISTINCT ur.user_id', 'userId')
            .where('ur.tenant_id = :tenantId', { tenantId })
            .andWhere('ur.created_at > :recentDate', {
            recentDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
        })
            .getRawMany();
        const recommendations = [];
        for (const user of recentlyActiveUsers) {
            const isCached = this.permissionCacheService.isUserPermissionsCached(user.userId, tenantId);
            if (!isCached) {
                recommendations.push(user.userId);
            }
        }
        this.logger.debug(`Generated ${recommendations.length} cache warming recommendations for tenant ${tenantId}`);
        return recommendations;
    }
    async getUserPermissionsFromDatabase(userId, tenantId) {
        const permissions = await this.permissionRepository
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.module', 'm')
            .innerJoin('p.role_permissions', 'rp')
            .innerJoin('rp.role', 'r')
            .innerJoin('r.user_roles', 'ur')
            .where('ur.user_id = :userId', { userId })
            .andWhere('ur.tenant_id = :tenantId', { tenantId })
            .distinct(true)
            .orderBy('m.name', 'ASC')
            .addOrderBy('p.action', 'ASC')
            .getMany();
        return permissions;
    }
    async getUserPermissionsOptimized(userId, tenantId) {
        const query = `
      SELECT DISTINCT p.id, p.action, p.description, p.is_system_permission, p.created_at, p.updated_at, 
             p.entity_registry_id, er.code as entity_code, p.module_id
      FROM rbac_permissions p
      INNER JOIN entity_registry er ON p.entity_registry_id = er.id
      INNER JOIN rbac_role_permissions rp ON p.id = rp.permission_id
      INNER JOIN rbac_roles r ON rp.role_id = r.id
      INNER JOIN rbac_user_roles ur ON r.id = ur.role_id
      LEFT JOIN tenant_modules tm ON p.module_id = tm.module_id AND tm.tenant_id = ?
      WHERE ur.user_id = ? AND ur.tenant_id = ?
        AND (p.module_id IS NULL OR (tm.is_enabled = 1 AND tm.tenant_id = ?))
      ORDER BY er.code, p.action
    `;
        const rawResults = await this.permissionRepository.query(query, [tenantId, userId, tenantId, tenantId]);
        return rawResults.map(row => {
            const permission = new permission_entity_1.Permission();
            permission.id = row.id;
            permission.action = row.action;
            permission.description = row.description;
            permission.is_system_permission = row.is_system_permission;
            permission.created_at = row.created_at;
            permission.updated_at = row.updated_at;
            permission.entity_registry_id = row.entity_registry_id;
            permission.module_id = row.module_id;
            permission.entity_registry = {
                id: row.entity_registry_id,
                code: row.entity_code,
            };
            return permission;
        });
    }
    async getBulkUserPermissions(userIds, tenantId) {
        if (userIds.length === 0) {
            return new Map();
        }
        const query = `
      SELECT DISTINCT ur.user_id, p.id, p.action, p.description, p.is_system_permission, p.created_at, p.updated_at,
             p.entity_registry_id, er.code as entity_code, p.module_id
      FROM rbac_permissions p
      INNER JOIN entity_registry er ON p.entity_registry_id = er.id
      INNER JOIN rbac_role_permissions rp ON p.id = rp.permission_id
      INNER JOIN rbac_roles r ON rp.role_id = r.id
      INNER JOIN rbac_user_roles ur ON r.id = ur.role_id
      LEFT JOIN tenant_modules tm ON p.module_id = tm.module_id AND tm.tenant_id = ?
      WHERE ur.user_id IN (?) AND ur.tenant_id = ?
        AND (p.module_id IS NULL OR (tm.is_enabled = 1 AND tm.tenant_id = ?))
      ORDER BY ur.user_id, er.code, p.action
    `;
        const rawResults = await this.permissionRepository.query(query, [tenantId, userIds, tenantId, tenantId]);
        const permissionsByUser = new Map();
        userIds.forEach(userId => {
            permissionsByUser.set(userId, []);
        });
        rawResults.forEach(row => {
            const permission = new permission_entity_1.Permission();
            permission.id = row.id;
            permission.action = row.action;
            permission.description = row.description;
            permission.is_system_permission = row.is_system_permission;
            permission.created_at = row.created_at;
            permission.updated_at = row.updated_at;
            permission.entity_registry_id = row.entity_registry_id;
            permission.entity_registry = {
                id: row.entity_registry_id,
                code: row.entity_code,
            };
            const userPermissions = permissionsByUser.get(row.user_id) || [];
            userPermissions.push(permission);
            permissionsByUser.set(row.user_id, userPermissions);
        });
        this.logger.debug(`Bulk fetched permissions for ${userIds.length} users in tenant ${tenantId}`);
        return permissionsByUser;
    }
    async getRoleHierarchyWithPermissions(tenantId) {
        return this.queryCacheService.cacheQuery(async () => {
            const query = `
          SELECT 
            r.id as role_id,
            r.name as role_name,
            r.description as role_description,
            r.is_system_role,
            COUNT(DISTINCT ur.user_id) as user_count,
            p.id as permission_id,
            er.id as entity_registry_id,
            er.code as entity_code,
            p.action,
            p.description as permission_description,
            p.is_system_permission
          FROM rbac_roles r
          LEFT JOIN rbac_user_roles ur ON r.id = ur.role_id AND ur.tenant_id = ?
          LEFT JOIN rbac_role_permissions rp ON r.id = rp.role_id
          LEFT JOIN rbac_permissions p ON rp.permission_id = p.id
          LEFT JOIN entity_registry er ON p.entity_registry_id = er.id
          WHERE r.tenant_id = ?
          GROUP BY r.id, r.name, r.description, r.is_system_role, p.id, er.id, er.code, p.action, p.description, p.is_system_permission
          ORDER BY r.name, er.code, p.action
        `;
            const rawResults = await this.permissionRepository.query(query, [tenantId]);
            const roleMap = new Map();
            rawResults.forEach(row => {
                if (!roleMap.has(row.role_id)) {
                    roleMap.set(row.role_id, {
                        role: {
                            id: row.role_id,
                            name: row.role_name,
                            description: row.role_description,
                            is_system_role: row.is_system_role,
                            user_count: parseInt(row.user_count) || 0,
                        },
                        permissions: [],
                    });
                }
                if (row.permission_id) {
                    const permission = new permission_entity_1.Permission();
                    permission.id = row.permission_id;
                    permission.entity_registry_id = row.entity_registry_id;
                    permission.entity_registry = {
                        id: row.entity_registry_id,
                        code: row.entity_code,
                    };
                    permission.action = row.action;
                    permission.description = row.permission_description;
                    permission.is_system_permission = row.is_system_permission;
                    roleMap.get(row.role_id).permissions.push(permission);
                }
            });
            this.logger.debug(`Fetched role hierarchy with permissions for tenant ${tenantId}: ${roleMap.size} roles`);
            return Array.from(roleMap.values());
        }, {
            tenantId,
            queryType: 'role_hierarchy_with_permissions',
        }, 5 * 60 * 1000);
    }
    async getPermissionUsageStats(tenantId, limit = 50) {
        return this.queryCacheService.cacheQuery(async () => {
            const query = `
          SELECT 
            p.id, p.entity_registry_id, er.code as entity_code, p.action, p.description, p.is_system_permission, p.created_at, p.updated_at,
            COUNT(DISTINCT ur.user_id) as usage_count,
            COUNT(DISTINCT rp.role_id) as role_count
          FROM rbac_permissions p
          LEFT JOIN entity_registry er ON p.entity_registry_id = er.id
          LEFT JOIN rbac_role_permissions rp ON p.id = rp.permission_id
          LEFT JOIN rbac_roles r ON rp.role_id = r.id AND r.tenant_id = ?
          LEFT JOIN rbac_user_roles ur ON r.id = ur.role_id AND ur.tenant_id = ?
          GROUP BY p.id, p.entity_registry_id, er.code, p.action, p.description, p.is_system_permission, p.created_at, p.updated_at
          ORDER BY usage_count DESC, role_count DESC
          LIMIT ?
        `;
            const rawResults = await this.permissionRepository.query(query, [tenantId, tenantId, limit]);
            return rawResults.map(row => {
                const permission = new permission_entity_1.Permission();
                permission.id = row.id;
                permission.entity_registry_id = row.entity_registry_id;
                permission.entity_registry = {
                    id: row.entity_registry_id,
                    code: row.entity_code,
                };
                permission.action = row.action;
                permission.description = row.description;
                permission.is_system_permission = row.is_system_permission;
                permission.created_at = row.created_at;
                permission.updated_at = row.updated_at;
                return {
                    permission,
                    usage_count: parseInt(row.usage_count) || 0,
                    role_count: parseInt(row.role_count) || 0,
                };
            });
        }, {
            tenantId,
            queryType: 'permission_usage_stats',
            params: { limit },
        }, 15 * 60 * 1000);
    }
    async preloadFrequentlyAccessedPermissions(tenantId, limit = 100) {
        const query = `
      SELECT DISTINCT ur.user_id, COUNT(*) as role_count
      FROM rbac_user_roles ur
      WHERE ur.tenant_id = ?
      AND ur.created_at > NOW() - INTERVAL '7 days'
      GROUP BY ur.user_id
      ORDER BY role_count DESC, ur.user_id
      LIMIT ?
    `;
        const activeUsers = await this.userRoleRepository.query(query, [tenantId, limit]);
        const userIds = activeUsers.map(u => u.user_id);
        if (userIds.length > 0) {
            const permissionsByUser = await this.getBulkUserPermissions(userIds, tenantId);
            const cachePromises = Array.from(permissionsByUser.entries()).map(([userId, permissions]) => this.permissionCacheService.setUserPermissions(userId, tenantId, permissions)
                .catch(error => {
                this.logger.warn(`Failed to cache permissions for user ${userId}:`, error);
            }));
            await Promise.allSettled(cachePromises);
            this.logger.debug(`Preloaded permissions for ${userIds.length} frequently accessed users in tenant ${tenantId}`);
        }
    }
    async analyzeQueryPerformance(tenantId) {
        const statsQuery = `
      SELECT 
        (SELECT COUNT(DISTINCT ur.user_id) FROM rbac_user_roles ur WHERE ur.tenant_id = ?) as total_users,
        (SELECT COUNT(*) FROM rbac_roles r WHERE r.tenant_id = ?) as total_roles,
        (SELECT COUNT(*) FROM rbac_permissions) as total_permissions,
        (SELECT AVG(perm_count) FROM (
          SELECT COUNT(DISTINCT p.id) as perm_count
          FROM rbac_user_roles ur
          JOIN rbac_roles r ON ur.role_id = r.id
          JOIN rbac_role_permissions rp ON r.id = rp.role_id
          JOIN rbac_permissions p ON rp.permission_id = p.id
          WHERE ur.tenant_id = ?
          GROUP BY ur.user_id
        ) user_perms) as avg_permissions_per_user,
        (SELECT AVG(user_count) FROM (
          SELECT COUNT(DISTINCT ur.user_id) as user_count
          FROM rbac_roles r
          LEFT JOIN rbac_user_roles ur ON r.id = ur.role_id AND ur.tenant_id = ?
          WHERE r.tenant_id = ?
          GROUP BY r.id
        ) role_users) as avg_users_per_role
    `;
        const statsResult = await this.permissionRepository.query(statsQuery, [tenantId]);
        const stats = statsResult[0];
        const processedStats = {
            total_users: parseInt(stats.total_users) || 0,
            total_roles: parseInt(stats.total_roles) || 0,
            total_permissions: parseInt(stats.total_permissions) || 0,
            avg_permissions_per_user: parseFloat(stats.avg_permissions_per_user) || 0,
            avg_users_per_role: parseFloat(stats.avg_users_per_role) || 0,
        };
        const recommendations = [];
        if (processedStats.total_users > 1000) {
            recommendations.push('Consider implementing user-based partitioning for large user base');
        }
        if (processedStats.avg_permissions_per_user > 50) {
            recommendations.push('High average permissions per user - consider role consolidation');
        }
        if (processedStats.avg_users_per_role < 2) {
            recommendations.push('Low role reuse - consider creating more generic roles');
        }
        if (processedStats.total_roles > 100) {
            recommendations.push('Large number of roles - consider role hierarchy or templates');
        }
        const cacheStats = this.getCacheStats();
        if (cacheStats.hits + cacheStats.misses > 0) {
            const hitRatio = this.getCacheHitRatio();
            if (hitRatio < 70) {
                recommendations.push('Low cache hit ratio - consider increasing cache TTL or preloading');
            }
        }
        this.logger.debug(`Query performance analysis completed for tenant ${tenantId}`, {
            stats: processedStats,
            recommendations: recommendations.length,
        });
        return {
            recommendations,
            stats: processedStats,
        };
    }
    async getUserPermissionsWithFallback(userId, tenantId) {
        try {
            const permissionsVersion = await this.permissionVersionService.getUserVersion(userId);
            let permissions = await this.permissionCacheService.getUserPermissions(userId, tenantId, permissionsVersion);
            if (!permissions) {
                this.logger.debug(`Cache miss for user ${userId} in tenant ${tenantId}, fetching from database`);
                permissions = await this.getUserPermissionsOptimized(userId, tenantId);
                try {
                    await this.permissionCacheService.setUserPermissions(userId, tenantId, permissions, undefined, permissionsVersion);
                    this.logger.debug(`Cached permissions for user ${userId} in tenant ${tenantId}`);
                }
                catch (cacheError) {
                    this.logger.warn(`Failed to cache permissions for user ${userId} in tenant ${tenantId}:`, cacheError);
                }
            }
            else {
                this.logger.debug(`Cache hit for user ${userId} in tenant ${tenantId}`);
            }
            return permissions;
        }
        catch (cacheError) {
            this.logger.warn(`Cache service unavailable for user ${userId} in tenant ${tenantId}, falling back to database:`, cacheError);
            try {
                return await this.getUserPermissionsOptimized(userId, tenantId);
            }
            catch (dbError) {
                this.logger.error(`Database also unavailable for user ${userId} in tenant ${tenantId}:`, dbError);
                throw dbError;
            }
        }
    }
    async validateEntityTypeWithFallback(entityType) {
        try {
            const entity = await this.entityRegistryRepository.query(`
        SELECT id FROM entity_registry 
        WHERE LOWER(code) = LOWER(?)
        LIMIT 1
      `, [entityType]);
            const isValid = entity && entity.length > 0;
            if (isValid) {
                this.logger.debug(`Entity type ${entityType} validated from entity_registry`);
            }
            else {
                this.logger.debug(`Entity type ${entityType} not found in entity_registry`);
            }
            return isValid;
        }
        catch (registryError) {
            this.logger.warn(`Entity Registry query failed for entity type: ${entityType}`, registryError);
            try {
                const knownEntityTypes = [
                    'user', 'customer', 'lead', 'order', 'product', 'invoice', 'report',
                    'tenant', 'role', 'permission', 'userrole', 'rolepermission',
                    'activity', 'auditlog', 'activities', 'customers', 'leads'
                ];
                const isKnownEntity = knownEntityTypes.includes(entityType.toLowerCase());
                if (isKnownEntity) {
                    this.logger.debug(`Entity type ${entityType} validated using fallback list`);
                }
                else {
                    this.logger.warn(`Unknown entity type ${entityType} - not in fallback list`);
                }
                return isKnownEntity;
            }
            catch (fallbackError) {
                this.logger.error(`All entity validation methods failed for ${entityType}:`, fallbackError);
                return false;
            }
        }
    }
    isCriticalSystemError(error) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return true;
        }
        if (error.message?.includes('ECONNREFUSED')) {
            return true;
        }
        if (error.name === 'ConnectionNotFoundError' || error.name === 'QueryFailedError') {
            return true;
        }
        if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
            return true;
        }
        if (error.name === 'RangeError' || error.message?.includes('out of memory')) {
            return true;
        }
        if (error.message?.includes('Role not found') ||
            error.message?.includes('Tenant not found') ||
            error.message?.includes('Database down')) {
            return true;
        }
        return false;
    }
    async getSystemHealthStatus() {
        const health = {
            status: 'healthy',
            services: {
                database: 'healthy',
                cache: 'healthy',
                entityRegistry: 'healthy',
            },
            issues: [],
            timestamp: new Date().toISOString(),
        };
        try {
            await this.permissionRepository.createQueryBuilder().select('1').limit(1).getRawOne();
            health.services.database = 'healthy';
        }
        catch (error) {
            health.services.database = 'critical';
            health.issues.push('Database connectivity failed');
            this.logger.error('Database health check failed:', error);
        }
        try {
            const cacheStats = this.permissionCacheService.getCacheStats();
            health.services.cache = 'healthy';
        }
        catch (error) {
            health.services.cache = 'critical';
            health.issues.push('Cache service unavailable');
            this.logger.error('Cache health check failed:', error);
        }
        try {
            await this.entityRegistryRepository.createQueryBuilder().select('1').limit(1).getRawOne();
            health.services.entityRegistry = 'healthy';
        }
        catch (error) {
            health.services.entityRegistry = 'degraded';
            health.issues.push('Entity Registry unavailable - using fallback validation');
            this.logger.warn('Entity Registry health check failed:', error);
        }
        const criticalServices = Object.values(health.services).filter(status => status === 'critical');
        const degradedServices = Object.values(health.services).filter(status => status === 'degraded');
        if (criticalServices.length > 0) {
            health.status = 'critical';
        }
        else if (degradedServices.length > 0) {
            health.status = 'degraded';
        }
        this.logger.debug(`System health check completed: ${health.status}`, health);
        return health;
    }
    setGracefulDegradationMode(enabled) {
        this.logger.log(`Graceful degradation mode ${enabled ? 'enabled' : 'disabled'}`);
        this.gracefulDegradationEnabled = enabled;
    }
    isGracefulDegradationEnabled() {
        return this.gracefulDegradationEnabled || false;
    }
    async getUserRoles(userId, tenantId) {
        const userRoles = await this.userRoleRepository
            .createQueryBuilder('ur')
            .innerJoin('ur.role', 'r')
            .select([
            'r.id',
            'r.name',
            'r.description',
            'r.isSystemRole',
            'r.createdAt',
            'r.updatedAt'
        ])
            .where('ur.user_id = :userId', { userId })
            .andWhere('ur.tenant_id = :tenantId', { tenantId })
            .getMany();
        return userRoles.map(ur => ur.role);
    }
};
exports.PermissionService = PermissionService;
exports.PermissionService = PermissionService = PermissionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __param(1, (0, typeorm_1.InjectRepository)(user_role_entity_1.UserRole)),
    __param(2, (0, typeorm_1.InjectRepository)(role_permission_entity_1.RolePermission)),
    __param(3, (0, typeorm_1.InjectRepository)(entity_registry_entity_1.EntityRegistry)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        tenant_context_service_1.TenantContextService,
        permission_cache_service_1.PermissionCacheService,
        permission_version_service_1.PermissionVersionService,
        query_cache_service_1.QueryCacheService])
], PermissionService);
//# sourceMappingURL=permission.service.js.map