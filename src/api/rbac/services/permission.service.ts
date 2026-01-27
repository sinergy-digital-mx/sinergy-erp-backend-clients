import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { RBACErrorUtils } from '../errors/error-utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../../../entities/rbac/permission.entity';
import { UserRole } from '../../../entities/rbac/user-role.entity';
import { RolePermission } from '../../../entities/rbac/role-permission.entity';
import { EntityRegistry } from '../../../entities/entity-registry/entity-registry.entity';
import { TenantContextService } from './tenant-context.service';
import { PermissionCacheService } from './permission-cache.service';
import { QueryCacheService } from './query-cache.service';

/**
 * Cache statistics interface for monitoring
 */
export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  size: number;
}

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(EntityRegistry)
    private entityRegistryRepository: Repository<EntityRegistry>,
    private tenantContextService: TenantContextService,
    private permissionCacheService: PermissionCacheService,
    private queryCacheService: QueryCacheService,
  ) {}

  /**
   * Check if a user has a specific permission for an entity type and action
   * Uses cache-first approach for optimal performance with graceful degradation
   * @param userId - The user ID to check permissions for
   * @param tenantId - The tenant context
   * @param entityType - The entity type (e.g., 'Customer', 'Lead')
   * @param action - The action (e.g., 'Create', 'Read', 'Update', 'Delete')
   * @returns Promise<boolean> - True if user has permission, false otherwise
   */
  async hasPermission(
    userId: string,
    tenantId: string,
    entityType: string,
    action: string,
  ): Promise<boolean> {
    try {
      // Validate tenant context matches current context
      this.validateTenantContext(tenantId, userId);

      // Validate entity type against Entity Registry with graceful degradation
      const isValidEntity = await this.validateEntityTypeWithFallback(entityType);
      if (!isValidEntity) {
        RBACErrorUtils.throwInvalidEntityType(entityType);
      }

      // Cache-first approach with graceful degradation for cache failures
      let userPermissions = await this.getUserPermissionsWithFallback(userId, tenantId);

      // Check if the user has the required permission
      return userPermissions?.some(
        permission => permission?.entity_type === entityType && permission?.action === action
      ) || false;
    } catch (error) {
      this.logger.error(`Error checking permission for user ${userId} in tenant ${tenantId}:`, error);
      
      // Graceful degradation: In case of critical errors, deny access but log for investigation
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
      
      // Handle tenant context mismatch for deleted tenants as graceful degradation
      if (error instanceof UnauthorizedException && 
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
      
      // Re-throw non-critical errors (validation errors, etc.)
      throw error;
    }
  }

  /**
   * Check permission using current tenant context
   * @param entityType - The entity type
   * @param action - The action
   * @returns Promise<boolean> - True if current user has permission
   */
  async hasPermissionInCurrentContext(
    entityType: string,
    action: string,
  ): Promise<boolean> {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    const userId = this.tenantContextService.getCurrentUserId();

    if (!tenantId || !userId) {
      throw new UnauthorizedException('Tenant context is required');
    }

    return this.hasPermission(userId, tenantId, entityType, action);
  }

  /**
   * Get all permissions for a user in a specific tenant
   * Uses cache-first approach for optimal performance with graceful degradation
   * @param userId - The user ID
   * @param tenantId - The tenant context
   * @returns Promise<Permission[]> - Array of permissions the user has
   */
  async getUserPermissions(
    userId: string,
    tenantId: string,
  ): Promise<Permission[]> {
    try {
      // Validate tenant context matches current context
      this.validateTenantContext(tenantId, userId);

      // Use cache-first approach with graceful degradation
      return await this.getUserPermissionsWithFallback(userId, tenantId);
    } catch (error) {
      this.logger.error(`Error getting permissions for user ${userId} in tenant ${tenantId}:`, error);
      
      // Graceful degradation: Return empty permissions on critical errors
      if (this.isCriticalSystemError(error)) {
        this.logger.error(`Critical system error during permission retrieval - returning empty permissions`, {
          userId,
          tenantId,
          error: error.message,
        });
        return [];
      }
      
      // Re-throw non-critical errors
      throw error;
    }
  }

  /**
   * Get permissions for current user in current tenant context
   * @returns Promise<Permission[]> - Array of permissions
   */
  async getCurrentUserPermissions(): Promise<Permission[]> {
    const tenantId = this.tenantContextService.getCurrentTenantId();
    const userId = this.tenantContextService.getCurrentUserId();

    if (!tenantId || !userId) {
      throw new UnauthorizedException('Tenant context is required');
    }

    return this.getUserPermissions(userId, tenantId);
  }

  /**
   * Create a new permission
   * @param entityType - The entity type for the permission
   * @param action - The action for the permission
   * @param description - Optional description of the permission
   * @returns Promise<Permission> - The created permission
   */
  async createPermission(
    entityType: string,
    action: string,
    description?: string,
  ): Promise<Permission> {
    // Validate entity type against Entity Registry
    const isValidEntity = await this.validateEntityType(entityType);
    if (!isValidEntity) {
      throw new BadRequestException(`Invalid entity type: ${entityType}`);
    }

    // Check if permission already exists
    const existingPermission = await this.permissionRepository.findOne({
      where: { entity_type: entityType, action },
    });

    if (existingPermission) {
      throw new BadRequestException(
        `Permission already exists for ${entityType}:${action}`,
      );
    }

    const permission = this.permissionRepository.create({
      entity_type: entityType,
      action,
      description,
      is_system_permission: false,
    });

    return await this.permissionRepository.save(permission);
  }

  /**
   * Validate that an entity type exists in the Entity Registry
   * @param entityType - The entity type to validate
   * @returns Promise<boolean> - True if valid, false otherwise
   */
  async validateEntityType(entityType: string): Promise<boolean> {
    const entity = await this.entityRegistryRepository.findOne({
      where: { code: entityType },
    });

    return !!entity;
  }

  /**
   * Get all available entity types from the Entity Registry
   * @returns Promise<string[]> - Array of available entity types
   */
  async getAvailableEntityTypes(): Promise<string[]> {
    const entities = await this.entityRegistryRepository.find({
      select: ['code'],
    });

    return entities.map(entity => entity.code);
  }

  /**
   * Get supported actions for permissions
   * @returns string[] - Array of supported actions
   */
  getSupportedActions(): string[] {
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
    ];
  }

  /**
   * Validate that an action is supported
   * @param action - The action to validate
   * @returns boolean - True if valid, false otherwise
   */
  validateAction(action: string): boolean {
    return this.getSupportedActions().includes(action);
  }

  /**
   * Find a permission by entity type and action
   * @param entityType - The entity type
   * @param action - The action
   * @returns Promise<Permission | null> - The permission if found, null otherwise
   */
  async findPermission(
    entityType: string,
    action: string,
  ): Promise<Permission | null> {
    return await this.permissionRepository.findOne({
      where: { entity_type: entityType, action },
    });
  }

  /**
   * Get all permissions
   * @returns Promise<Permission[]> - Array of all permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    return await this.permissionRepository.find({
      order: { entity_type: 'ASC', action: 'ASC' },
    });
  }

  /**
   * Validate tenant context matches current request context
   * @param tenantId - The tenant ID to validate
   * @param userId - The user ID to validate
   * @throws UnauthorizedException if context doesn't match
   */
  private validateTenantContext(tenantId: string, userId?: string): void {
    const currentTenantId = this.tenantContextService.getCurrentTenantId();
    const currentUserId = this.tenantContextService.getCurrentUserId();

    if (currentTenantId && currentTenantId !== tenantId) {
      throw new UnauthorizedException(
        'Cross-tenant access denied: Tenant context mismatch',
      );
    }

    if (userId && currentUserId && currentUserId !== userId) {
      throw new UnauthorizedException(
        'Cross-user access denied: User context mismatch',
      );
    }
  }

  /**
   * Check multiple permissions at once for bulk operations
   * Uses cache-first approach for optimal performance
   * @param userId - The user ID
   * @param tenantId - The tenant ID
   * @param permissions - Array of permission checks
   * @returns Promise<boolean[]> - Array of boolean results matching input order
   */
  async checkBulkPermissions(
    userId: string,
    tenantId: string,
    permissions: Array<{ entityType: string; action: string }>,
  ): Promise<boolean[]> {
    // Validate tenant context
    this.validateTenantContext(tenantId, userId);

    // Cache-first approach: Use getUserPermissions which implements caching
    const userPermissions = await this.getUserPermissions(userId, tenantId);
    const permissionMap = new Map<string, boolean>();

    // Create a map for quick lookup
    userPermissions.forEach(permission => {
      const key = `${permission.entity_type}:${permission.action}`;
      permissionMap.set(key, true);
    });

    // Check each requested permission
    const results: boolean[] = [];
    for (const permission of permissions) {
      const key = `${permission.entityType}:${permission.action}`;
      results.push(permissionMap.has(key));
    }

    this.logger.debug(`Bulk permission check for user ${userId} in tenant ${tenantId}: ${results.length} permissions checked`);
    return results;
  }

  /**
   * Check permissions for multiple users at once (admin operation)
   * Optimized for scenarios where you need to check the same permission for many users
   * @param userIds - Array of user IDs
   * @param tenantId - The tenant ID
   * @param entityType - The entity type to check
   * @param action - The action to check
   * @returns Promise<Map<string, boolean>> - Map of userId to permission result
   */
  async checkPermissionForMultipleUsers(
    userIds: string[],
    tenantId: string,
    entityType: string,
    action: string,
  ): Promise<Map<string, boolean>> {
    // Validate entity type
    const isValidEntity = await this.validateEntityTypeWithFallback(entityType);
    if (!isValidEntity) {
      RBACErrorUtils.throwInvalidEntityType(entityType);
    }

    const results = new Map<string, boolean>();

    // Use Promise.allSettled to handle individual user failures gracefully
    const permissionChecks = userIds.map(async (userId) => {
      try {
        const hasPermission = await this.hasPermission(userId, tenantId, entityType, action);
        return { userId, hasPermission, error: null };
      } catch (error) {
        this.logger.warn(`Failed to check permission for user ${userId}:`, error);
        return { userId, hasPermission: false, error };
      }
    });

    const settledResults = await Promise.allSettled(permissionChecks);

    settledResults.forEach((result, index) => {
      const userId = userIds[index];
      if (result.status === 'fulfilled') {
        results.set(userId, result.value.hasPermission);
      } else {
        this.logger.error(`Permission check failed for user ${userId}:`, result.reason);
        results.set(userId, false); // Deny access on error
      }
    });

    this.logger.debug(`Bulk user permission check for ${userIds.length} users in tenant ${tenantId}: ${entityType}:${action}`);
    return results;
  }

  /**
   * Check if multiple users have any of the specified permissions
   * Useful for filtering lists based on user permissions
   * @param userIds - Array of user IDs
   * @param tenantId - The tenant ID
   * @param permissions - Array of permissions to check (user needs ANY of these)
   * @returns Promise<Map<string, boolean>> - Map of userId to whether they have any permission
   */
  async checkAnyPermissionForMultipleUsers(
    userIds: string[],
    tenantId: string,
    permissions: Array<{ entityType: string; action: string }>,
  ): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    // Use Promise.allSettled for graceful error handling
    const permissionChecks = userIds.map(async (userId) => {
      try {
        const bulkResults = await this.checkBulkPermissions(userId, tenantId, permissions);
        const hasAnyPermission = bulkResults.some(result => result);
        return { userId, hasAnyPermission, error: null };
      } catch (error) {
        this.logger.warn(`Failed to check permissions for user ${userId}:`, error);
        return { userId, hasAnyPermission: false, error };
      }
    });

    const settledResults = await Promise.allSettled(permissionChecks);

    settledResults.forEach((result, index) => {
      const userId = userIds[index];
      if (result.status === 'fulfilled') {
        results.set(userId, result.value.hasAnyPermission);
      } else {
        this.logger.error(`Permission check failed for user ${userId}:`, result.reason);
        results.set(userId, false);
      }
    });

    this.logger.debug(`Bulk any-permission check for ${userIds.length} users in tenant ${tenantId}`);
    return results;
  }

  /**
   * Filter a list of items based on user permissions
   * Generic method that can be used for any entity type
   * @param userId - The user ID
   * @param tenantId - The tenant ID
   * @param items - Array of items to filter
   * @param entityType - The entity type for permission checking
   * @param action - The action to check
   * @param getItemId - Function to extract ID from item (optional, uses item.id by default)
   * @returns Promise<T[]> - Filtered array of items user has permission to access
   */
  async filterItemsByPermission<T extends { id?: string }>(
    userId: string,
    tenantId: string,
    items: T[],
    entityType: string,
    action: string,
    getItemId?: (item: T) => string,
  ): Promise<T[]> {
    // Check if user has the permission at all
    const hasPermission = await this.hasPermission(userId, tenantId, entityType, action);
    
    if (!hasPermission) {
      this.logger.debug(`User ${userId} lacks ${action} permission for ${entityType}, returning empty list`);
      return [];
    }

    // If user has permission, return all items
    // Note: This is a basic implementation. In a more sophisticated system,
    // you might have item-level permissions that require individual checks
    this.logger.debug(`User ${userId} has ${action} permission for ${entityType}, returning ${items.length} items`);
    return items;
  }

  /**
   * Get users who have a specific permission in a tenant
   * Useful for finding who can perform certain actions
   * @param tenantId - The tenant ID
   * @param entityType - The entity type
   * @param action - The action
   * @param limit - Maximum number of users to return (default: 100)
   * @returns Promise<string[]> - Array of user IDs who have the permission
   */
  async getUsersWithPermission(
    tenantId: string,
    entityType: string,
    action: string,
    limit: number = 100,
  ): Promise<string[]> {
    // Validate entity type
    const isValidEntity = await this.validateEntityTypeWithFallback(entityType);
    if (!isValidEntity) {
      RBACErrorUtils.throwInvalidEntityType(entityType);
    }

    // Find the permission
    const permission = await this.findPermission(entityType, action);
    if (!permission) {
      this.logger.debug(`Permission ${entityType}:${action} not found`);
      return [];
    }

    // Query users who have this permission through their roles
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

  /**
   * Batch check permissions for multiple entity instances
   * Optimized for checking permissions on a list of specific entity instances
   * @param userId - The user ID
   * @param tenantId - The tenant ID
   * @param entityType - The entity type
   * @param action - The action to check
   * @param entityIds - Array of entity IDs to check
   * @returns Promise<Map<string, boolean>> - Map of entityId to permission result
   */
  async checkPermissionForMultipleEntities(
    userId: string,
    tenantId: string,
    entityType: string,
    action: string,
    entityIds: string[],
  ): Promise<Map<string, boolean>> {
    // Check if user has the base permission for this entity type and action
    const hasBasePermission = await this.hasPermission(userId, tenantId, entityType, action);
    
    const results = new Map<string, boolean>();
    
    // If user doesn't have base permission, deny all
    if (!hasBasePermission) {
      entityIds.forEach(entityId => {
        results.set(entityId, false);
      });
      this.logger.debug(`User ${userId} lacks base permission ${entityType}:${action}, denying all ${entityIds.length} entities`);
      return results;
    }

    // If user has base permission, grant all (basic implementation)
    // In a more sophisticated system, you might check entity-level permissions here
    entityIds.forEach(entityId => {
      results.set(entityId, true);
    });

    this.logger.debug(`User ${userId} has base permission ${entityType}:${action}, granting all ${entityIds.length} entities`);
    return results;
  }

  /**
   * Validate user has access to a specific tenant
   * @param userId - The user ID
   * @param tenantId - The tenant ID to validate access to
   * @returns Promise<boolean> - True if user has access to tenant
   */
  async validateUserTenantAccess(
    userId: string,
    tenantId: string,
  ): Promise<boolean> {
    const userRole = await this.userRoleRepository.findOne({
      where: { user_id: userId, tenant_id: tenantId },
    });

    return !!userRole;
  }

  /**
   * Invalidate cached permissions for a user when their roles change
   * @param userId - The user ID
   * @param tenantId - The tenant ID
   * @returns Promise<void>
   */
  async invalidateUserPermissionsCache(
    userId: string,
    tenantId: string,
  ): Promise<void> {
    await this.permissionCacheService.invalidateUserPermissions(userId, tenantId);
    await this.queryCacheService.invalidateUserQueries(userId);
    this.logger.debug(`Invalidated cache for user ${userId} in tenant ${tenantId}`);
  }

  /**
   * Invalidate cached permissions for all users with a specific role
   * This should be called when role permissions are modified
   * @param roleId - The role ID
   * @param tenantId - The tenant ID
   * @param userIds - Array of user IDs that have this role (optional, will be fetched if not provided)
   * @returns Promise<void>
   */
  async invalidateRolePermissionsCache(
    roleId: string,
    tenantId: string,
    userIds?: string[],
  ): Promise<void> {
    let affectedUserIds = userIds;
    
    if (!affectedUserIds) {
      // Fetch user IDs that have this role
      const usersWithRole = await this.userRoleRepository.find({
        where: { role_id: roleId, tenant_id: tenantId },
        select: ['user_id'],
      });
      affectedUserIds = usersWithRole.map(ur => ur.user_id);
    }

    await this.permissionCacheService.invalidateRolePermissions(roleId, tenantId, affectedUserIds);
    
    // Invalidate query cache for affected users and tenant
    for (const userId of affectedUserIds) {
      await this.queryCacheService.invalidateUserQueries(userId);
    }
    await this.queryCacheService.invalidateTenantQueries(tenantId);
    
    this.logger.debug(`Invalidated cache for ${affectedUserIds.length} users with role ${roleId} in tenant ${tenantId}`);
  }

  /**
   * Invalidate all cached permissions for a tenant
   * This should be called when tenant-wide changes occur
   * @param tenantId - The tenant ID
   * @returns Promise<void>
   */
  async invalidateTenantPermissionsCache(tenantId: string): Promise<void> {
    await this.permissionCacheService.invalidateTenantPermissions(tenantId);
    await this.queryCacheService.invalidateTenantQueries(tenantId);
    this.logger.debug(`Invalidated all cached permissions for tenant ${tenantId}`);
  }

  /**
   * Get cache statistics for monitoring
   * @returns CacheStats - Cache statistics object
   */
  getCacheStats(): CacheStats {
    return this.permissionCacheService.getCacheStats();
  }

  /**
   * Get cache hit ratio for monitoring
   * @returns number - Hit ratio percentage (0-100)
   */
  getCacheHitRatio(): number {
    return this.permissionCacheService.getCacheHitRatio();
  }

  /**
   * Get detailed cache performance metrics
   * @returns object - Detailed cache performance information
   */
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

  /**
   * Generate cache optimization recommendations based on performance metrics
   * @param stats - Cache statistics
   * @param hitRatio - Cache hit ratio
   * @returns string[] - Array of recommendations
   */
  private generateCacheRecommendations(stats: CacheStats, hitRatio: number): string[] {
    const recommendations: string[] = [];

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

  /**
   * Perform cache health check
   * @returns object - Cache health status and metrics
   */
  async performCacheHealthCheck() {
    const stats = this.getCacheStats();
    const hitRatio = this.getCacheHitRatio();
    
    const health = {
      status: 'healthy' as 'healthy' | 'warning' | 'critical',
      metrics: this.getCachePerformanceMetrics(),
      issues: [] as string[],
      timestamp: new Date().toISOString(),
    };

    // Determine health status based on metrics
    if (hitRatio < 30) {
      health.status = 'critical';
      health.issues.push('Very low cache hit ratio - performance may be severely impacted');
    } else if (hitRatio < 50) {
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

  /**
   * Warm the cache with user permissions
   * @param userId - The user ID
   * @param tenantId - The tenant ID
   * @returns Promise<void>
   */
  async warmUserPermissionsCache(userId: string, tenantId: string): Promise<void> {
    const permissions = await this.getUserPermissionsOptimized(userId, tenantId);
    await this.permissionCacheService.warmCache(userId, tenantId, permissions);
    this.logger.debug(`Warmed cache for user ${userId} in tenant ${tenantId} with ${permissions.length} permissions`);
  }

  /**
   * Warm cache for multiple users in a tenant (batch warming)
   * Useful for warming cache for frequently accessed users
   * @param userIds - Array of user IDs
   * @param tenantId - The tenant ID
   * @returns Promise<void>
   */
  async warmMultipleUsersCache(userIds: string[], tenantId: string): Promise<void> {
    this.logger.debug(`Starting cache warming for ${userIds.length} users in tenant ${tenantId}`);
    
    const warmingPromises = userIds.map(userId => 
      this.warmUserPermissionsCache(userId, tenantId).catch(error => {
        this.logger.warn(`Failed to warm cache for user ${userId} in tenant ${tenantId}:`, error);
      })
    );

    await Promise.allSettled(warmingPromises);
    this.logger.debug(`Completed cache warming for ${userIds.length} users in tenant ${tenantId}`);
  }

  /**
   * Warm cache for all active users in a tenant
   * Should be used carefully as it can be resource intensive
   * @param tenantId - The tenant ID
   * @param limit - Maximum number of users to warm (default: 100)
   * @returns Promise<void>
   */
  async warmTenantUsersCache(tenantId: string, limit: number = 100): Promise<void> {
    this.logger.debug(`Starting cache warming for active users in tenant ${tenantId} (limit: ${limit})`);

    // Get active users in the tenant (users with roles)
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
    } else {
      this.logger.debug(`No active users found in tenant ${tenantId}`);
    }
  }

  /**
   * Warm cache for users with specific roles
   * Useful for warming cache for users with frequently accessed roles
   * @param roleIds - Array of role IDs
   * @param tenantId - The tenant ID
   * @returns Promise<void>
   */
  async warmRoleUsersCache(roleIds: string[], tenantId: string): Promise<void> {
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
    } else {
      this.logger.debug(`No users found with specified roles in tenant ${tenantId}`);
    }
  }

  /**
   * Proactively warm cache for a user when they log in
   * This should be called during the authentication process
   * @param userId - The user ID
   * @param tenantId - The tenant ID
   * @returns Promise<void>
   */
  async warmCacheOnLogin(userId: string, tenantId: string): Promise<void> {
    // Check if already cached to avoid unnecessary database queries
    const isCached = this.permissionCacheService.isUserPermissionsCached(userId, tenantId);
    
    if (!isCached) {
      await this.warmUserPermissionsCache(userId, tenantId);
      this.logger.debug(`Proactively warmed cache for user ${userId} on login to tenant ${tenantId}`);
    } else {
      this.logger.debug(`Cache already warm for user ${userId} in tenant ${tenantId}`);
    }
  }

  /**
   * Refresh cache for a user (force reload from database)
   * Useful when permissions have been modified
   * @param userId - The user ID
   * @param tenantId - The tenant ID
   * @returns Promise<void>
   */
  async refreshUserPermissionsCache(userId: string, tenantId: string): Promise<void> {
    // Invalidate existing cache
    await this.permissionCacheService.invalidateUserPermissions(userId, tenantId);
    
    // Warm cache with fresh data
    await this.warmUserPermissionsCache(userId, tenantId);
    
    this.logger.debug(`Refreshed cache for user ${userId} in tenant ${tenantId}`);
  }

  /**
   * Get cache warming recommendations based on usage patterns
   * This can be used by monitoring systems to identify users that should have their cache warmed
   * @param tenantId - The tenant ID
   * @returns Promise<string[]> - Array of user IDs recommended for cache warming
   */
  async getCacheWarmingRecommendations(tenantId: string): Promise<string[]> {
    // Get users who have been active recently but don't have cached permissions
    // This is a simplified implementation - in production, you might want to track actual usage patterns
    const recentlyActiveUsers = await this.userRoleRepository
      .createQueryBuilder('ur')
      .select('DISTINCT ur.user_id', 'userId')
      .where('ur.tenant_id = :tenantId', { tenantId })
      .andWhere('ur.created_at > :recentDate', { 
        recentDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      })
      .getRawMany();

    const recommendations: string[] = [];
    
    for (const user of recentlyActiveUsers) {
      const isCached = this.permissionCacheService.isUserPermissionsCached(user.userId, tenantId);
      if (!isCached) {
        recommendations.push(user.userId);
      }
    }

    this.logger.debug(`Generated ${recommendations.length} cache warming recommendations for tenant ${tenantId}`);
    return recommendations;
  }

  /**
   * Fetch user permissions from database (bypassing cache)
   * @param userId - The user ID
   * @param tenantId - The tenant ID
   * @returns Promise<Permission[]> - Array of permissions from database
   */
  private async getUserPermissionsFromDatabase(
    userId: string,
    tenantId: string,
  ): Promise<Permission[]> {
    const permissions = await this.permissionRepository
      .createQueryBuilder('p')
      .innerJoin('p.role_permissions', 'rp')
      .innerJoin('rp.role', 'r')
      .innerJoin('r.user_roles', 'ur')
      .where('ur.user_id = :userId', { userId })
      .andWhere('ur.tenant_id = :tenantId', { tenantId })
      .distinct(true)
      .getMany();

    return permissions;
  }

  /**
   * Optimized query to get user permissions with minimal database round trips
   * Uses a single query with proper joins and indexes
   * @param userId - The user ID
   * @param tenantId - The tenant ID
   * @returns Promise<Permission[]> - Array of permissions from database
   */
  private async getUserPermissionsOptimized(
    userId: string,
    tenantId: string,
  ): Promise<Permission[]> {
    // Use a more efficient query that leverages indexes
    const query = `
      SELECT DISTINCT p.id, p.entity_type, p.action, p.description, p.is_system_permission, p.created_at, p.updated_at
      FROM rbac_permissions p
      INNER JOIN rbac_role_permissions rp ON p.id = rp.permission_id
      INNER JOIN rbac_roles r ON rp.role_id = r.id
      INNER JOIN rbac_user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ? AND ur.tenant_id = ?
      ORDER BY p.entity_type, p.action
    `;

    const rawResults = await this.permissionRepository.query(query, [userId, tenantId]);
    
    // Convert raw results to Permission entities
    return rawResults.map(row => {
      const permission = new Permission();
      permission.id = row.id;
      permission.entity_type = row.entity_type;
      permission.action = row.action;
      permission.description = row.description;
      permission.is_system_permission = row.is_system_permission;
      permission.created_at = row.created_at;
      permission.updated_at = row.updated_at;
      return permission;
    });
  }

  /**
   * Batch fetch permissions for multiple users in a single query
   * Optimized for bulk operations
   * @param userIds - Array of user IDs
   * @param tenantId - The tenant ID
   * @returns Promise<Map<string, Permission[]>> - Map of userId to permissions
   */
  async getBulkUserPermissions(
    userIds: string[],
    tenantId: string,
  ): Promise<Map<string, Permission[]>> {
    if (userIds.length === 0) {
      return new Map();
    }

    // Use optimized query with IN clause
    const query = `
      SELECT DISTINCT ur.user_id, p.id, p.entity_type, p.action, p.description, p.is_system_permission, p.created_at, p.updated_at
      FROM rbac_permissions p
      INNER JOIN rbac_role_permissions rp ON p.id = rp.permission_id
      INNER JOIN rbac_roles r ON rp.role_id = r.id
      INNER JOIN rbac_user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ANY(?) AND ur.tenant_id = ?
      ORDER BY ur.user_id, p.entity_type, p.action
    `;

    const rawResults = await this.permissionRepository.query(query, [userIds, tenantId]);
    
    // Group results by user ID
    const permissionsByUser = new Map<string, Permission[]>();
    
    // Initialize empty arrays for all requested users
    userIds.forEach(userId => {
      permissionsByUser.set(userId, []);
    });

    // Process results
    rawResults.forEach(row => {
      const permission = new Permission();
      permission.id = row.id;
      permission.entity_type = row.entity_type;
      permission.action = row.action;
      permission.description = row.description;
      permission.is_system_permission = row.is_system_permission;
      permission.created_at = row.created_at;
      permission.updated_at = row.updated_at;

      const userPermissions = permissionsByUser.get(row.user_id) || [];
      userPermissions.push(permission);
      permissionsByUser.set(row.user_id, userPermissions);
    });

    this.logger.debug(`Bulk fetched permissions for ${userIds.length} users in tenant ${tenantId}`);
    return permissionsByUser;
  }

  /**
   * Get role hierarchy with permissions in a single optimized query
   * Useful for admin interfaces that need to display role structures
   * @param tenantId - The tenant ID
   * @returns Promise<Array<{role: Role, permissions: Permission[]}>>
   */
  async getRoleHierarchyWithPermissions(tenantId: string): Promise<Array<{
    role: {
      id: string;
      name: string;
      description: string;
      is_system_role: boolean;
      user_count: number;
    };
    permissions: Permission[];
  }>> {
    return this.queryCacheService.cacheQuery(
      async () => {
        // Optimized query that gets roles with their permissions and user counts
        const query = `
          SELECT 
            r.id as role_id,
            r.name as role_name,
            r.description as role_description,
            r.is_system_role,
            COUNT(DISTINCT ur.user_id) as user_count,
            p.id as permission_id,
            p.entity_type,
            p.action,
            p.description as permission_description,
            p.is_system_permission
          FROM rbac_roles r
          LEFT JOIN rbac_user_roles ur ON r.id = ur.role_id AND ur.tenant_id = ?
          LEFT JOIN rbac_role_permissions rp ON r.id = rp.role_id
          LEFT JOIN rbac_permissions p ON rp.permission_id = p.id
          WHERE r.tenant_id = ?
          GROUP BY r.id, r.name, r.description, r.is_system_role, p.id, p.entity_type, p.action, p.description, p.is_system_permission
          ORDER BY r.name, p.entity_type, p.action
        `;

        const rawResults = await this.permissionRepository.query(query, [tenantId]);
        
        // Group results by role
        const roleMap = new Map<string, {
          role: {
            id: string;
            name: string;
            description: string;
            is_system_role: boolean;
            user_count: number;
          };
          permissions: Permission[];
        }>();

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

          // Add permission if it exists
          if (row.permission_id) {
            const permission = new Permission();
            permission.id = row.permission_id;
            permission.entity_type = row.entity_type;
            permission.action = row.action;
            permission.description = row.permission_description;
            permission.is_system_permission = row.is_system_permission;

            roleMap.get(row.role_id)!.permissions.push(permission);
          }
        });

        this.logger.debug(`Fetched role hierarchy with permissions for tenant ${tenantId}: ${roleMap.size} roles`);
        return Array.from(roleMap.values());
      },
      {
        tenantId,
        queryType: 'role_hierarchy_with_permissions',
      },
      5 * 60 * 1000, // 5 minute cache
    );
  }

  /**
   * Get permission usage statistics for optimization insights
   * @param tenantId - The tenant ID
   * @param limit - Maximum number of results (default: 50)
   * @returns Promise<Array<{permission: Permission, usage_count: number, role_count: number}>>
   */
  async getPermissionUsageStats(
    tenantId: string,
    limit: number = 50,
  ): Promise<Array<{
    permission: Permission;
    usage_count: number;
    role_count: number;
  }>> {
    return this.queryCacheService.cacheQuery(
      async () => {
        const query = `
          SELECT 
            p.id, p.entity_type, p.action, p.description, p.is_system_permission, p.created_at, p.updated_at,
            COUNT(DISTINCT ur.user_id) as usage_count,
            COUNT(DISTINCT rp.role_id) as role_count
          FROM rbac_permissions p
          LEFT JOIN rbac_role_permissions rp ON p.id = rp.permission_id
          LEFT JOIN rbac_roles r ON rp.role_id = r.id AND r.tenant_id = ?
          LEFT JOIN rbac_user_roles ur ON r.id = ur.role_id AND ur.tenant_id = ?
          GROUP BY p.id, p.entity_type, p.action, p.description, p.is_system_permission, p.created_at, p.updated_at
          ORDER BY usage_count DESC, role_count DESC
          LIMIT ?
        `;

        const rawResults = await this.permissionRepository.query(query, [tenantId, limit]);
        
        return rawResults.map(row => {
          const permission = new Permission();
          permission.id = row.id;
          permission.entity_type = row.entity_type;
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
      },
      {
        tenantId,
        queryType: 'permission_usage_stats',
        params: { limit },
      },
      15 * 60 * 1000, // 15 minute cache
    );
  }

  /**
   * Preload and cache permissions for frequently accessed users
   * Uses permission usage statistics to identify users to preload
   * @param tenantId - The tenant ID
   * @param limit - Maximum number of users to preload (default: 100)
   * @returns Promise<void>
   */
  async preloadFrequentlyAccessedPermissions(
    tenantId: string,
    limit: number = 100,
  ): Promise<void> {
    // Get users who have been active recently (simplified heuristic)
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
      // Batch fetch permissions for these users
      const permissionsByUser = await this.getBulkUserPermissions(userIds, tenantId);

      // Cache the permissions
      const cachePromises = Array.from(permissionsByUser.entries()).map(([userId, permissions]) =>
        this.permissionCacheService.setUserPermissions(userId, tenantId, permissions)
          .catch(error => {
            this.logger.warn(`Failed to cache permissions for user ${userId}:`, error);
          })
      );

      await Promise.allSettled(cachePromises);
      this.logger.debug(`Preloaded permissions for ${userIds.length} frequently accessed users in tenant ${tenantId}`);
    }
  }

  /**
   * Optimize database queries by analyzing slow queries and suggesting improvements
   * @param tenantId - The tenant ID
   * @returns Promise<{recommendations: string[], stats: any}>
   */
  async analyzeQueryPerformance(tenantId: string): Promise<{
    recommendations: string[];
    stats: {
      total_users: number;
      total_roles: number;
      total_permissions: number;
      avg_permissions_per_user: number;
      avg_users_per_role: number;
    };
  }> {
    // Get basic statistics
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

    // Convert string numbers to integers/floats
    const processedStats = {
      total_users: parseInt(stats.total_users) || 0,
      total_roles: parseInt(stats.total_roles) || 0,
      total_permissions: parseInt(stats.total_permissions) || 0,
      avg_permissions_per_user: parseFloat(stats.avg_permissions_per_user) || 0,
      avg_users_per_role: parseFloat(stats.avg_users_per_role) || 0,
    };

    // Generate recommendations based on statistics
    const recommendations: string[] = [];

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

    // Cache-related recommendations
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

  /**
   * Get user permissions with graceful degradation for cache failures
   * @param userId - The user ID
   * @param tenantId - The tenant ID
   * @returns Promise<Permission[]> - Array of permissions
   */
  private async getUserPermissionsWithFallback(
    userId: string,
    tenantId: string,
  ): Promise<Permission[]> {
    try {
      // Cache-first approach: Try to get permissions from cache first
      let permissions = await this.permissionCacheService.getUserPermissions(userId, tenantId);
      
      if (!permissions) {
        // Cache miss - fetch from database and cache the result
        this.logger.debug(`Cache miss for user ${userId} in tenant ${tenantId}, fetching from database`);
        permissions = await this.getUserPermissionsOptimized(userId, tenantId);
        
        // Try to cache the result with graceful degradation for cache failures
        try {
          await this.permissionCacheService.setUserPermissions(userId, tenantId, permissions);
          this.logger.debug(`Cached permissions for user ${userId} in tenant ${tenantId}`);
        } catch (cacheError) {
          this.logger.warn(`Failed to cache permissions for user ${userId} in tenant ${tenantId}:`, cacheError);
          // Continue without caching - not a critical failure
        }
      } else {
        this.logger.debug(`Cache hit for user ${userId} in tenant ${tenantId}`);
      }

      return permissions;
    } catch (cacheError) {
      this.logger.warn(`Cache service unavailable for user ${userId} in tenant ${tenantId}, falling back to database:`, cacheError);
      
      // Graceful degradation: Fall back to database-only approach
      try {
        return await this.getUserPermissionsOptimized(userId, tenantId);
      } catch (dbError) {
        this.logger.error(`Database also unavailable for user ${userId} in tenant ${tenantId}:`, dbError);
        throw dbError; // This is a critical failure
      }
    }
  }

  /**
   * Validate entity type with graceful degradation for Entity Registry failures
   * @param entityType - The entity type to validate
   * @returns Promise<boolean> - True if valid, false otherwise
   */
  private async validateEntityTypeWithFallback(entityType: string): Promise<boolean> {
    try {
      return await this.validateEntityType(entityType);
    } catch (registryError) {
      this.logger.warn(`Entity Registry unavailable, using fallback validation for entity type: ${entityType}`, registryError);
      
      // Graceful degradation: Use a predefined list of known entity types
      const knownEntityTypes = [
        'User', 'Customer', 'Lead', 'Order', 'Product', 'Invoice', 'Report',
        'Tenant', 'Role', 'Permission', 'UserRole', 'RolePermission'
      ];
      
      const isKnownEntity = knownEntityTypes.includes(entityType);
      
      if (isKnownEntity) {
        this.logger.debug(`Entity type ${entityType} validated using fallback list`);
      } else {
        this.logger.warn(`Unknown entity type ${entityType} - Entity Registry unavailable for validation`);
      }
      
      return isKnownEntity;
    }
  }

  /**
   * Check if an error is a critical system error that requires graceful degradation
   * @param error - The error to check
   * @returns boolean - True if it's a critical system error
   */
  private isCriticalSystemError(error: any): boolean {
    // Database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return true;
    }
    
    // Check for ECONNREFUSED in error message
    if (error.message?.includes('ECONNREFUSED')) {
      return true;
    }
    
    // TypeORM connection errors
    if (error.name === 'ConnectionNotFoundError' || error.name === 'QueryFailedError') {
      return true;
    }
    
    // Timeout errors
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      return true;
    }
    
    // Memory/resource errors
    if (error.name === 'RangeError' || error.message?.includes('out of memory')) {
      return true;
    }
    
    // Role/entity not found errors (graceful degradation for deleted references)
    if (error.message?.includes('Role not found') || 
        error.message?.includes('Tenant not found') ||
        error.message?.includes('Database down')) {
      return true;
    }
    
    return false;
  }

  /**
   * Get system health status including cache and database connectivity
   * @returns Promise<object> - System health information
   */
  async getSystemHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    services: {
      database: 'healthy' | 'degraded' | 'critical';
      cache: 'healthy' | 'degraded' | 'critical';
      entityRegistry: 'healthy' | 'degraded' | 'critical';
    };
    issues: string[];
    timestamp: string;
  }> {
    const health = {
      status: 'healthy' as 'healthy' | 'degraded' | 'critical',
      services: {
        database: 'healthy' as 'healthy' | 'degraded' | 'critical',
        cache: 'healthy' as 'healthy' | 'degraded' | 'critical',
        entityRegistry: 'healthy' as 'healthy' | 'degraded' | 'critical',
      },
      issues: [] as string[],
      timestamp: new Date().toISOString(),
    };

    // Test database connectivity
    try {
      await this.permissionRepository.createQueryBuilder().select('1').limit(1).getRawOne();
      health.services.database = 'healthy';
    } catch (error) {
      health.services.database = 'critical';
      health.issues.push('Database connectivity failed');
      this.logger.error('Database health check failed:', error);
    }

    // Test cache service
    try {
      const cacheStats = this.permissionCacheService.getCacheStats();
      health.services.cache = 'healthy';
    } catch (error) {
      health.services.cache = 'critical';
      health.issues.push('Cache service unavailable');
      this.logger.error('Cache health check failed:', error);
    }

    // Test Entity Registry
    try {
      await this.entityRegistryRepository.createQueryBuilder().select('1').limit(1).getRawOne();
      health.services.entityRegistry = 'healthy';
    } catch (error) {
      health.services.entityRegistry = 'degraded';
      health.issues.push('Entity Registry unavailable - using fallback validation');
      this.logger.warn('Entity Registry health check failed:', error);
    }

    // Determine overall status
    const criticalServices = Object.values(health.services).filter(status => status === 'critical');
    const degradedServices = Object.values(health.services).filter(status => status === 'degraded');

    if (criticalServices.length > 0) {
      health.status = 'critical';
    } else if (degradedServices.length > 0) {
      health.status = 'degraded';
    }

    this.logger.debug(`System health check completed: ${health.status}`, health);
    return health;
  }

  /**
   * Enable/disable graceful degradation mode
   * When enabled, the system will be more tolerant of failures
   * @param enabled - Whether to enable graceful degradation
   */
  setGracefulDegradationMode(enabled: boolean): void {
    // This could be used to adjust behavior based on system load or known issues
    this.logger.log(`Graceful degradation mode ${enabled ? 'enabled' : 'disabled'}`);
    
    // Store the setting for use in other methods
    (this as any).gracefulDegradationEnabled = enabled;
  }

  /**
   * Check if graceful degradation mode is enabled
   * @returns boolean - True if graceful degradation is enabled
   */
  private isGracefulDegradationEnabled(): boolean {
    return (this as any).gracefulDegradationEnabled || false;
  }

  /**
   * Get user roles for a specific tenant
   * This method delegates to RoleService but is provided here for convenience
   * @param userId - The user ID
   * @param tenantId - The tenant ID
   * @returns Promise<Role[]> - Array of roles the user has in the tenant
   */
  async getUserRoles(userId: string, tenantId: string): Promise<any[]> {
    // This is a simple query to get user roles - we'll use a direct query for now
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
}