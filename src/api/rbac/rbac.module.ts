import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Permission } from '../../entities/rbac/permission.entity';
import { Role } from '../../entities/rbac/role.entity';
import { UserRole } from '../../entities/rbac/user-role.entity';
import { RolePermission } from '../../entities/rbac/role-permission.entity';
import { RBACTenant } from '../../entities/rbac/tenant.entity';
import { AuditLog } from '../../entities/rbac/audit-log.entity';
import { EntityRegistry } from '../../entities/entity-registry/entity-registry.entity';
import { User } from '../../entities/users/user.entity';
import { PermissionService } from './services/permission.service';
import { RoleService } from './services/role.service';
import { RoleTemplateService } from './services/role-template.service';
import { TenantContextService } from './services/tenant-context.service';
import { TenantService } from './services/tenant.service';
import { PermissionCacheService } from './services/permission-cache.service';
import { QueryCacheService } from './services/query-cache.service';
import { AuditLogService } from './services/audit-log.service';
import { MigrationService } from './services/migration.service';
import { DataCleanupService } from './services/data-cleanup.service';
import { PermissionGuard } from './guards/permission.guard';
import { TenantController } from './controllers/tenant.controller';
import { AuditLogController } from './controllers/audit-log.controller';
import { DataCleanupController } from './controllers/data-cleanup.controller';
import { RBACErrorHandlerService } from './errors/error-handler.service';
import { RBACExceptionFilter } from './filters/rbac-exception.filter';
import { TenantContextMiddleware } from './middleware/tenant-context.middleware';
import rbacConfig from './config/rbac.config';

/**
 * RBAC Module - Comprehensive Role-Based Access Control System
 * 
 * This module provides a complete RBAC implementation with:
 * - Multi-tenant role and permission management
 * - Caching for optimal performance
 * - Audit logging for security compliance
 * - Guards and decorators for easy integration
 * - Migration tools for existing systems
 * - Error handling and graceful degradation
 * 
 * @example
 * ```typescript
 * // Import in your app module
 * @Module({
 *   imports: [RBACModule],
 *   // ... other configuration
 * })
 * export class AppModule {}
 * 
 * // Use in controllers
 * @Controller('customers')
 * @UseGuards(JwtAuthGuard, PermissionGuard)
 * export class CustomersController {
 *   @Get()
 *   @RequirePermissions({ entityType: 'Customer', action: 'Read' })
 *   async findAll() {
 *     // Only users with Customer:Read permission can access
 *   }
 * }
 * ```
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Permission,
      Role,
      UserRole,
      RolePermission,
      RBACTenant,
      AuditLog,
      EntityRegistry,
      User,
    ]),
    JwtModule.register({}), // Import JwtModule to make JwtService available
    ConfigModule.forFeature(rbacConfig),
    ScheduleModule.forRoot(), // Enable scheduled tasks
  ],
  controllers: [
    TenantController,
    AuditLogController,
    DataCleanupController,
  ],
  providers: [
    // Core Services
    PermissionService,
    RoleService,
    RoleTemplateService,
    TenantContextService,
    TenantService,
    
    // Caching Services
    PermissionCacheService,
    QueryCacheService,
    
    // Audit and Monitoring
    AuditLogService,
    
    // Migration and Maintenance
    MigrationService,
    DataCleanupService,
    
    // Security Components
    PermissionGuard,
    
    // Error Handling
    RBACErrorHandlerService,
    RBACExceptionFilter,
    
    // Middleware
    TenantContextMiddleware,
  ],
  exports: [
    // Core Services - Export for use in other modules
    PermissionService,
    RoleService,
    RoleTemplateService,
    TenantContextService,
    TenantService,
    
    // Caching Services
    PermissionCacheService,
    QueryCacheService,
    
    // Audit and Monitoring
    AuditLogService,
    
    // Migration and Maintenance
    MigrationService,
    DataCleanupService,
    
    // Security Components - Export for use in other modules
    PermissionGuard,
    
    // Error Handling
    RBACErrorHandlerService,
    RBACExceptionFilter,
    
    // Middleware
    TenantContextMiddleware,
    
    // TypeORM Repositories - Export for advanced use cases
    TypeOrmModule,
  ],
})
export class RBACModule {
  /**
   * Configure RBAC module with custom options
   * @param options - Configuration options for RBAC
   * @returns DynamicModule - Configured RBAC module
   */
  static forRoot(options?: {
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
  }) {
    return {
      module: RBACModule,
      providers: [
        {
          provide: 'RBAC_OPTIONS',
          useValue: {
            enableCaching: true,
            cacheTTL: 300,
            enableAuditLogging: true,
            enableRoleTemplates: true,
            customRoleTemplates: [],
            ...options,
          },
        },
      ],
      exports: [
        'RBAC_OPTIONS',
        PermissionService,
        RoleService,
        RoleTemplateService,
        TenantContextService,
        TenantService,
        PermissionCacheService,
        QueryCacheService,
        AuditLogService,
        MigrationService,
        DataCleanupService,
        PermissionGuard,
        RBACErrorHandlerService,
        RBACExceptionFilter,
        TenantContextMiddleware,
      ],
    };
  }

  /**
   * Configure RBAC module for feature modules
   * Provides a subset of services for feature-specific use
   * @returns DynamicModule - Feature-configured RBAC module
   */
  static forFeature() {
    return {
      module: RBACModule,
      exports: [
        PermissionService,
        RoleService,
        TenantContextService,
        PermissionGuard,
        RBACErrorHandlerService,
      ],
    };
  }
}