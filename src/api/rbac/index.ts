/**
 * RBAC System - Role-Based Access Control for NestJS
 * 
 * This module provides a comprehensive RBAC implementation with:
 * - Multi-tenant role and permission management
 * - Performance-optimized caching
 * - Comprehensive audit logging
 * - Easy-to-use guards and decorators
 * - Migration tools for existing systems
 * - Graceful error handling and degradation
 * 
 * @example Basic Usage
 * ```typescript
 * // In your app module
 * import { RBACModule } from './api/rbac';
 * 
 * @Module({
 *   imports: [
 *     RBACModule.forRoot({
 *       enableCaching: true,
 *       cacheTTL: 300,
 *       enableAuditLogging: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * 
 * // In your controllers
 * import { RequirePermissions, PermissionGuard } from './api/rbac';
 * 
 * @Controller('customers')
 * @UseGuards(JwtAuthGuard, PermissionGuard)
 * export class CustomersController {
 *   @Get()
 *   @RequirePermissions({ entityType: 'Customer', action: 'Read' })
 *   async findAll() {
 *     // Protected endpoint
 *   }
 * }
 * ```
 */

// Core Module
export * from './rbac.module';

// Services
export * from './services/permission.service';
export * from './services/role.service';
export * from './services/role-template.service';
export * from './services/tenant-context.service';
export * from './services/tenant.service';
export * from './services/permission-cache.service';
export * from './services/query-cache.service';
export * from './services/audit-log.service';
export * from './services/migration.service';
export * from './services/data-cleanup.service';

// Guards and Security
export * from './guards';

// Decorators
export * from './decorators';

// Error Handling
export * from './errors';

// Middleware
export * from './middleware/tenant-context.middleware';

// Controllers (for direct use if needed)
export * from './controllers/tenant.controller';
export * from './controllers/audit-log.controller';
export * from './controllers/data-cleanup.controller';

// Templates and Configuration
export * from './templates';
export { default as rbacConfig } from './config/rbac.config';

// Filters
export * from './filters/rbac-exception.filter';

// Entities (re-export for convenience)
export { Permission } from '../../entities/rbac/permission.entity';
export { Role } from '../../entities/rbac/role.entity';
export { UserRole } from '../../entities/rbac/user-role.entity';
export { RolePermission } from '../../entities/rbac/role-permission.entity';
export { RBACTenant } from '../../entities/rbac/tenant.entity';
export { AuditLog } from '../../entities/rbac/audit-log.entity';

// Type definitions and interfaces
export interface RBACModuleOptions {
  /** Enable/disable caching (default: true) */
  enableCaching?: boolean;
  /** Cache TTL in seconds (default: 300) */
  cacheTTL?: number;
  /** Enable/disable audit logging (default: true) */
  enableAuditLogging?: boolean;
  /** Enable/disable automatic role template creation (default: true) */
  enableRoleTemplates?: boolean;
  /** Custom role templates to create */
  customRoleTemplates?: any[];
}

export interface RBACHealthStatus {
  status: 'healthy' | 'degraded' | 'critical';
  services: {
    database: 'healthy' | 'degraded' | 'critical';
    cache: 'healthy' | 'degraded' | 'critical';
    entityRegistry: 'healthy' | 'degraded' | 'critical';
  };
  issues: string[];
  timestamp: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  size: number;
}

/**
 * Utility functions for RBAC integration
 */
export class RBACUtils {
  /**
   * Create a permission string from entity type and action
   * @param entityType - The entity type
   * @param action - The action
   * @returns string - Permission string in format "EntityType:Action"
   */
  static createPermissionString(entityType: string, action: string): string {
    return `${entityType}:${action}`;
  }

  /**
   * Parse a permission string into entity type and action
   * @param permissionString - Permission string in format "EntityType:Action"
   * @returns object - Object with entityType and action properties
   */
  static parsePermissionString(permissionString: string): { entityType: string; action: string } {
    const [entityType, action] = permissionString.split(':');
    return { entityType, action };
  }

  /**
   * Validate permission string format
   * @param permissionString - Permission string to validate
   * @returns boolean - True if valid format
   */
  static isValidPermissionString(permissionString: string): boolean {
    return /^[A-Za-z][A-Za-z0-9_]*:[A-Za-z][A-Za-z0-9_]*$/.test(permissionString);
  }

  /**
   * Generate role name from template and tenant
   * @param templateName - The role template name
   * @param tenantName - The tenant name (optional)
   * @returns string - Generated role name
   */
  static generateRoleName(templateName: string, tenantName?: string): string {
    return tenantName ? `${templateName}_${tenantName}` : templateName;
  }

  /**
   * Check if a role is a system role based on naming convention
   * @param roleName - The role name to check
   * @returns boolean - True if it appears to be a system role
   */
  static isSystemRole(roleName: string): boolean {
    const systemRoles = ['Admin', 'Operator', 'Viewer', 'SuperAdmin', 'SystemAdmin'];
    return systemRoles.includes(roleName);
  }

  /**
   * Normalize entity type name (PascalCase)
   * @param entityType - The entity type to normalize
   * @returns string - Normalized entity type
   */
  static normalizeEntityType(entityType: string): string {
    return entityType.charAt(0).toUpperCase() + entityType.slice(1).toLowerCase();
  }

  /**
   * Normalize action name (PascalCase)
   * @param action - The action to normalize
   * @returns string - Normalized action
   */
  static normalizeAction(action: string): string {
    return action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
  }
}

/**
 * Constants used throughout the RBAC system
 */
export const RBAC_CONSTANTS = {
  /** Default cache TTL in seconds */
  DEFAULT_CACHE_TTL: 300,
  
  /** Maximum number of roles per user */
  MAX_ROLES_PER_USER: 50,
  
  /** Maximum number of permissions per role */
  MAX_PERMISSIONS_PER_ROLE: 200,
  
  /** Default system role names */
  SYSTEM_ROLES: {
    ADMIN: 'Admin',
    OPERATOR: 'Operator',
    VIEWER: 'Viewer',
  },
  
  /** Common entity types */
  ENTITY_TYPES: {
    USER: 'User',
    CUSTOMER: 'Customer',
    LEAD: 'Lead',
    ORDER: 'Order',
    PRODUCT: 'Product',
    INVOICE: 'Invoice',
    REPORT: 'Report',
  },
  
  /** Common actions */
  ACTIONS: {
    CREATE: 'Create',
    READ: 'Read',
    UPDATE: 'Update',
    DELETE: 'Delete',
    EXPORT: 'Export',
    IMPORT: 'Import',
    DOWNLOAD_REPORT: 'Download_Report',
    BULK_UPDATE: 'Bulk_Update',
    BULK_DELETE: 'Bulk_Delete',
  },
  
  /** HTTP headers used by RBAC */
  HEADERS: {
    TENANT_ID: 'X-Tenant-ID',
    USER_ID: 'X-User-ID',
  },
  
  /** Metadata keys for decorators */
  METADATA_KEYS: {
    PERMISSIONS: 'permissions',
    ROLES: 'roles',
    TENANT_REQUIRED: 'tenant_required',
  },
} as const;