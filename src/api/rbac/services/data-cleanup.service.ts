/**
 * RBAC Data Cleanup Service
 * 
 * Provides utilities for cleaning up orphaned data and monitoring data integrity issues.
 * Implements comprehensive cleanup strategies and integrity monitoring for the RBAC system.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { RBACTenant } from '../../../entities/rbac/tenant.entity';
import { Role } from '../../../entities/rbac/role.entity';
import { Permission } from '../../../entities/rbac/permission.entity';
import { UserRole } from '../../../entities/rbac/user-role.entity';
import { RolePermission } from '../../../entities/rbac/role-permission.entity';
import { AuditLog } from '../../../entities/rbac/audit-log.entity';
import { User } from '../../../entities/users/user.entity';
import { AuditLogService, AuditAction, AuditResult } from './audit-log.service';
import { RBACErrorUtils } from '../errors/error-utils';

export interface CleanupOptions {
  /** Whether to perform a dry run without making changes */
  dryRun?: boolean;
  /** Batch size for processing large datasets */
  batchSize?: number;
  /** Whether to clean up orphaned user roles */
  cleanupUserRoles?: boolean;
  /** Whether to clean up orphaned role permissions */
  cleanupRolePermissions?: boolean;
  /** Whether to clean up unused roles (non-system roles with no assignments) */
  cleanupUnusedRoles?: boolean;
  /** Whether to clean up unused permissions (permissions with no role assignments) */
  cleanupUnusedPermissions?: boolean;
  /** Whether to clean up empty tenants (tenants with no roles or users) */
  cleanupEmptyTenants?: boolean;
  /** Whether to clean up old audit logs */
  cleanupOldAuditLogs?: boolean;
  /** Age in days for audit logs to be considered old */
  auditLogRetentionDays?: number;
  /** Specific tenant ID to limit cleanup scope */
  tenantId?: string;
}

export interface CleanupResult {
  /** Total execution time in milliseconds */
  executionTime: number;
  /** Whether this was a dry run */
  dryRun: boolean;
  /** Cleanup statistics */
  statistics: {
    orphanedUserRoles: number;
    orphanedRolePermissions: number;
    unusedRoles: number;
    unusedPermissions: number;
    emptyTenants: number;
    oldAuditLogs: number;
  };
  /** Detailed cleanup actions performed */
  actions: string[];
  /** Any warnings or issues encountered */
  warnings: string[];
  /** Errors that occurred during cleanup */
  errors: string[];
}

export interface IntegrityCheckResult {
  /** Overall integrity status */
  isHealthy: boolean;
  /** Timestamp of the check */
  checkedAt: Date;
  /** Detailed integrity issues found */
  issues: Array<{
    type: 'orphaned_data' | 'missing_reference' | 'duplicate_data' | 'constraint_violation' | 'performance_issue';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedCount: number;
    recommendation: string;
    tenantId?: string;
  }>;
  /** Performance metrics */
  performance: {
    totalUsers: number;
    totalRoles: number;
    totalPermissions: number;
    totalUserRoles: number;
    totalRolePermissions: number;
    totalTenants: number;
    averageRolesPerUser: number;
    averagePermissionsPerRole: number;
  };
  /** Recommendations for system optimization */
  recommendations: string[];
}

export interface MaintenanceSchedule {
  /** Whether automatic cleanup is enabled */
  enabled: boolean;
  /** Cron expression for cleanup schedule */
  schedule: string;
  /** Default cleanup options for scheduled runs */
  defaultOptions: CleanupOptions;
  /** Whether to send notifications on cleanup completion */
  notifyOnCompletion: boolean;
  /** Email addresses to notify (if notifications enabled) */
  notificationEmails: string[];
}

@Injectable()
export class DataCleanupService {
  private readonly logger = new Logger(DataCleanupService.name);
  private isCleanupRunning = false;
  private lastCleanupResult: CleanupResult | null = null;
  private lastIntegrityCheck: IntegrityCheckResult | null = null;

  constructor(
    @InjectRepository(RBACTenant)
    private tenantRepository: Repository<RBACTenant>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private auditLogService: AuditLogService,
    private configService: ConfigService,
  ) {}

  /**
   * Perform comprehensive data cleanup
   * @param options - Cleanup configuration options
   * @returns Promise<CleanupResult> - Results of the cleanup operation
   */
  async performCleanup(options: CleanupOptions = {}): Promise<CleanupResult> {
    if (this.isCleanupRunning) {
      throw new Error('Cleanup operation is already running');
    }

    const startTime = Date.now();
    this.isCleanupRunning = true;

    const {
      dryRun = false,
      batchSize = 1000,
      cleanupUserRoles = true,
      cleanupRolePermissions = true,
      cleanupUnusedRoles = true,
      cleanupUnusedPermissions = true,
      cleanupEmptyTenants = false, // Conservative default
      cleanupOldAuditLogs = false, // Conservative default
      auditLogRetentionDays = 365,
      tenantId,
    } = options;

    this.logger.log(`Starting data cleanup${dryRun ? ' (DRY RUN)' : ''} with options: ${JSON.stringify(options)}`);

    const result: CleanupResult = {
      executionTime: 0,
      dryRun,
      statistics: {
        orphanedUserRoles: 0,
        orphanedRolePermissions: 0,
        unusedRoles: 0,
        unusedPermissions: 0,
        emptyTenants: 0,
        oldAuditLogs: 0,
      },
      actions: [],
      warnings: [],
      errors: [],
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      if (!dryRun) {
        await queryRunner.startTransaction();
      }

      // 1. Clean up orphaned user roles
      if (cleanupUserRoles) {
        await this.cleanupOrphanedUserRoles(queryRunner, result, tenantId, batchSize, dryRun);
      }

      // 2. Clean up orphaned role permissions
      if (cleanupRolePermissions) {
        await this.cleanupOrphanedRolePermissions(queryRunner, result, tenantId, batchSize, dryRun);
      }

      // 3. Clean up unused roles
      if (cleanupUnusedRoles) {
        await this.cleanupUnusedRoles(queryRunner, result, tenantId, batchSize, dryRun);
      }

      // 4. Clean up unused permissions
      if (cleanupUnusedPermissions) {
        await this.cleanupUnusedPermissions(queryRunner, result, batchSize, dryRun);
      }

      // 5. Clean up empty tenants
      if (cleanupEmptyTenants) {
        await this.cleanupEmptyTenants(queryRunner, result, batchSize, dryRun);
      }

      // 6. Clean up old audit logs
      if (cleanupOldAuditLogs) {
        await this.cleanupOldAuditLogs(queryRunner, result, auditLogRetentionDays, tenantId, batchSize, dryRun);
      }

      if (!dryRun) {
        await queryRunner.commitTransaction();
        this.logger.log('Cleanup transaction committed successfully');
      } else {
        this.logger.log('Dry run completed - no changes made');
      }

      // Log audit entry for cleanup
      try {
        await this.auditLogService.createAuditLog({
          action: 'SYSTEM_EVENT' as AuditAction,
          result: AuditResult.SUCCESS,
          actorId: 'system',
          tenantId: tenantId || undefined,
          resourceType: 'cleanup',
          resourceId: 'data-cleanup',
          details: JSON.stringify({
            event: dryRun ? 'DATA_CLEANUP_DRY_RUN' : 'DATA_CLEANUP_COMPLETED',
            statistics: result.statistics,
            actionsCount: result.actions.length,
            warningsCount: result.warnings.length,
            options,
          }),
        });
      } catch (auditError) {
        this.logger.warn(`Failed to log cleanup audit event: ${auditError.message}`);
        result.warnings.push(`Failed to log audit event: ${auditError.message}`);
      }

    } catch (error) {
      if (!dryRun) {
        await queryRunner.rollbackTransaction();
        this.logger.error('Cleanup transaction rolled back due to error');
      }

      result.errors.push(`Cleanup failed: ${error.message}`);
      
      try {
        await this.auditLogService.createAuditLog({
          action: 'SYSTEM_EVENT' as AuditAction,
          result: AuditResult.FAILURE,
          actorId: 'system',
          tenantId: tenantId || undefined,
          resourceType: 'cleanup',
          resourceId: 'data-cleanup',
          details: JSON.stringify({
            event: 'DATA_CLEANUP_FAILED',
            error: error.message,
            options,
          }),
          errorMessage: error.message,
        });
      } catch (auditError) {
        this.logger.warn(`Failed to log cleanup failure audit event: ${auditError.message}`);
      }
      
      throw RBACErrorUtils.throwSystemError('DataCleanupService', 'performCleanup', error);
    } finally {
      await queryRunner.release();
      result.executionTime = Date.now() - startTime;
      this.isCleanupRunning = false;
      this.lastCleanupResult = result;
    }

    this.logger.log(`Data cleanup completed in ${result.executionTime}ms`);
    return result;
  }

  /**
   * Perform comprehensive data integrity check
   * @param tenantId - Optional tenant ID to limit check scope
   * @returns Promise<IntegrityCheckResult> - Results of the integrity check
   */
  async performIntegrityCheck(tenantId?: string): Promise<IntegrityCheckResult> {
    this.logger.log(`Starting data integrity check${tenantId ? ` for tenant ${tenantId}` : ''}`);

    const result: IntegrityCheckResult = {
      isHealthy: true,
      checkedAt: new Date(),
      issues: [],
      performance: {
        totalUsers: 0,
        totalRoles: 0,
        totalPermissions: 0,
        totalUserRoles: 0,
        totalRolePermissions: 0,
        totalTenants: 0,
        averageRolesPerUser: 0,
        averagePermissionsPerRole: 0,
      },
      recommendations: [],
    };

    try {
      // Collect performance metrics
      await this.collectPerformanceMetrics(result, tenantId);

      // Check for orphaned data
      await this.checkOrphanedData(result, tenantId);

      // Check for missing references
      await this.checkMissingReferences(result, tenantId);

      // Check for duplicate data
      await this.checkDuplicateData(result, tenantId);

      // Check for constraint violations
      await this.checkConstraintViolations(result, tenantId);

      // Check for performance issues
      await this.checkPerformanceIssues(result, tenantId);

      // Generate recommendations
      this.generateRecommendations(result);

      // Determine overall health
      result.isHealthy = !result.issues.some(issue => issue.severity === 'critical' || issue.severity === 'high');

      this.lastIntegrityCheck = result;

      this.logger.log(`Data integrity check completed: ${result.isHealthy ? 'HEALTHY' : 'ISSUES FOUND'} (${result.issues.length} issues)`);

    } catch (error) {
      this.logger.error(`Data integrity check failed: ${error.message}`);
      result.isHealthy = false;
      result.issues.push({
        type: 'constraint_violation',
        severity: 'critical',
        description: `Integrity check failed: ${error.message}`,
        affectedCount: 0,
        recommendation: 'Review system logs and contact support',
      });
    }

    return result;
  }

  /**
   * Get the last cleanup result
   * @returns CleanupResult | null - Last cleanup result or null if no cleanup has been performed
   */
  getLastCleanupResult(): CleanupResult | null {
    return this.lastCleanupResult;
  }

  /**
   * Get the last integrity check result
   * @returns IntegrityCheckResult | null - Last integrity check result or null if no check has been performed
   */
  getLastIntegrityCheck(): IntegrityCheckResult | null {
    return this.lastIntegrityCheck;
  }

  /**
   * Check if cleanup is currently running
   * @returns boolean - Whether cleanup is running
   */
  isCleanupInProgress(): boolean {
    return this.isCleanupRunning;
  }

  /**
   * Get maintenance schedule configuration
   * @returns MaintenanceSchedule - Current maintenance schedule
   */
  getMaintenanceSchedule(): MaintenanceSchedule {
    return {
      enabled: this.configService.get('RBAC_CLEANUP_ENABLED', 'false') === 'true',
      schedule: this.configService.get('RBAC_CLEANUP_SCHEDULE', '0 2 * * 0'), // Weekly at 2 AM on Sunday
      defaultOptions: {
        dryRun: false,
        batchSize: this.configService.get('RBAC_CLEANUP_BATCH_SIZE', 1000),
        cleanupUserRoles: true,
        cleanupRolePermissions: true,
        cleanupUnusedRoles: true,
        cleanupUnusedPermissions: true,
        cleanupEmptyTenants: false,
        cleanupOldAuditLogs: this.configService.get('RBAC_CLEANUP_OLD_AUDIT_LOGS', 'false') === 'true',
        auditLogRetentionDays: this.configService.get('RBAC_AUDIT_LOG_RETENTION_DAYS', 365),
      },
      notifyOnCompletion: this.configService.get('RBAC_CLEANUP_NOTIFY', 'false') === 'true',
      notificationEmails: this.configService.get('RBAC_CLEANUP_NOTIFICATION_EMAILS', '').split(',').filter(email => email.trim()),
    };
  }

  /**
   * Scheduled cleanup job (runs based on configuration)
   */
  @Cron(CronExpression.EVERY_WEEK, {
    name: 'rbac-data-cleanup',
    timeZone: 'UTC',
  })
  async scheduledCleanup(): Promise<void> {
    const schedule = this.getMaintenanceSchedule();
    
    if (!schedule.enabled) {
      this.logger.debug('Scheduled cleanup is disabled');
      return;
    }

    if (this.isCleanupRunning) {
      this.logger.warn('Skipping scheduled cleanup - another cleanup is already running');
      return;
    }

    this.logger.log('Starting scheduled data cleanup');

    try {
      const result = await this.performCleanup(schedule.defaultOptions);
      
      this.logger.log(`Scheduled cleanup completed: ${JSON.stringify({
        executionTime: result.executionTime,
        statistics: result.statistics,
        actionsCount: result.actions.length,
        warningsCount: result.warnings.length,
        errorsCount: result.errors.length,
      })}`);

      // Send notifications if configured
      if (schedule.notifyOnCompletion && schedule.notificationEmails.length > 0) {
        await this.sendCleanupNotification(result, schedule.notificationEmails);
      }

    } catch (error) {
      this.logger.error(`Scheduled cleanup failed: ${error.message}`);
      
      // Send failure notification if configured
      if (schedule.notifyOnCompletion && schedule.notificationEmails.length > 0) {
        await this.sendCleanupFailureNotification(error, schedule.notificationEmails);
      }
    }
  }

  /**
   * Scheduled integrity check job
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM, {
    name: 'rbac-integrity-check',
    timeZone: 'UTC',
  })
  async scheduledIntegrityCheck(): Promise<void> {
    const enabled = this.configService.get('RBAC_INTEGRITY_CHECK_ENABLED', 'true') === 'true';
    
    if (!enabled) {
      this.logger.debug('Scheduled integrity check is disabled');
      return;
    }

    this.logger.log('Starting scheduled data integrity check');

    try {
      const result = await this.performIntegrityCheck();
      
      this.logger.log(`Scheduled integrity check completed: ${result.isHealthy ? 'HEALTHY' : 'ISSUES FOUND'} (${result.issues.length} issues)`);

      // Log critical issues
      const criticalIssues = result.issues.filter(issue => issue.severity === 'critical');
      if (criticalIssues.length > 0) {
        this.logger.error(`Found ${criticalIssues.length} critical integrity issues:`);
        criticalIssues.forEach(issue => {
          this.logger.error(`- ${issue.description} (${issue.affectedCount} affected)`);
        });
      }

    } catch (error) {
      this.logger.error(`Scheduled integrity check failed: ${error.message}`);
    }
  }

  // Private helper methods for cleanup operations

  private async cleanupOrphanedUserRoles(
    queryRunner: QueryRunner,
    result: CleanupResult,
    tenantId: string | undefined,
    batchSize: number,
    dryRun: boolean,
  ): Promise<void> {
    this.logger.debug('Cleaning up orphaned user roles');

    const query = this.userRoleRepository
      .createQueryBuilder('ur')
      .leftJoin('users', 'u', 'u.id = ur.user_id')
      .where('u.id IS NULL');

    if (tenantId) {
      query.andWhere('ur.tenant_id = :tenantId', { tenantId });
    }

    const orphanedUserRoles = await query.getMany();
    result.statistics.orphanedUserRoles = orphanedUserRoles.length;

    if (orphanedUserRoles.length > 0) {
      if (!dryRun) {
        // Process in batches to avoid memory issues
        for (let i = 0; i < orphanedUserRoles.length; i += batchSize) {
          const batch = orphanedUserRoles.slice(i, i + batchSize);
          await queryRunner.manager.remove(UserRole, batch);
        }
      }
      
      const action = `${dryRun ? '[DRY RUN] ' : ''}Removed ${orphanedUserRoles.length} orphaned user role assignments`;
      result.actions.push(action);
      this.logger.debug(action);
    }
  }

  private async cleanupOrphanedRolePermissions(
    queryRunner: QueryRunner,
    result: CleanupResult,
    tenantId: string | undefined,
    batchSize: number,
    dryRun: boolean,
  ): Promise<void> {
    this.logger.debug('Cleaning up orphaned role permissions');

    let query = this.rolePermissionRepository
      .createQueryBuilder('rp')
      .leftJoin('rp.role', 'r')
      .leftJoin('rp.permission', 'p')
      .where('r.id IS NULL OR p.id IS NULL');

    if (tenantId) {
      query = query.andWhere('r.tenant_id = :tenantId', { tenantId });
    }

    const orphanedRolePermissions = await query.getMany();
    result.statistics.orphanedRolePermissions = orphanedRolePermissions.length;

    if (orphanedRolePermissions.length > 0) {
      if (!dryRun) {
        for (let i = 0; i < orphanedRolePermissions.length; i += batchSize) {
          const batch = orphanedRolePermissions.slice(i, i + batchSize);
          await queryRunner.manager.remove(RolePermission, batch);
        }
      }
      
      const action = `${dryRun ? '[DRY RUN] ' : ''}Removed ${orphanedRolePermissions.length} orphaned role permission assignments`;
      result.actions.push(action);
      this.logger.debug(action);
    }
  }

  private async cleanupUnusedRoles(
    queryRunner: QueryRunner,
    result: CleanupResult,
    tenantId: string | undefined,
    batchSize: number,
    dryRun: boolean,
  ): Promise<void> {
    this.logger.debug('Cleaning up unused roles');

    let query = this.roleRepository
      .createQueryBuilder('role')
      .leftJoin('user_roles', 'ur', 'ur.role_id = role.id')
      .leftJoin('role_permissions', 'rp', 'rp.role_id = role.id')
      .where('ur.id IS NULL')
      .andWhere('rp.id IS NULL')
      .andWhere('role.is_system_role = :isSystemRole', { isSystemRole: false });

    if (tenantId) {
      query = query.andWhere('role.tenant_id = :tenantId', { tenantId });
    }

    const unusedRoles = await query.getMany();
    result.statistics.unusedRoles = unusedRoles.length;

    if (unusedRoles.length > 0) {
      if (!dryRun) {
        for (let i = 0; i < unusedRoles.length; i += batchSize) {
          const batch = unusedRoles.slice(i, i + batchSize);
          await queryRunner.manager.remove(Role, batch);
        }
      }
      
      const action = `${dryRun ? '[DRY RUN] ' : ''}Removed ${unusedRoles.length} unused roles`;
      result.actions.push(action);
      this.logger.debug(action);
    }
  }

  private async cleanupUnusedPermissions(
    queryRunner: QueryRunner,
    result: CleanupResult,
    batchSize: number,
    dryRun: boolean,
  ): Promise<void> {
    this.logger.debug('Cleaning up unused permissions');

    const unusedPermissions = await this.permissionRepository
      .createQueryBuilder('permission')
      .leftJoin('role_permissions', 'rp', 'rp.permission_id = permission.id')
      .where('rp.id IS NULL')
      .andWhere('permission.is_system_permission = :isSystemPermission', { isSystemPermission: false })
      .getMany();

    result.statistics.unusedPermissions = unusedPermissions.length;

    if (unusedPermissions.length > 0) {
      if (!dryRun) {
        for (let i = 0; i < unusedPermissions.length; i += batchSize) {
          const batch = unusedPermissions.slice(i, i + batchSize);
          await queryRunner.manager.remove(Permission, batch);
        }
      }
      
      const action = `${dryRun ? '[DRY RUN] ' : ''}Removed ${unusedPermissions.length} unused permissions`;
      result.actions.push(action);
      this.logger.debug(action);
    }
  }

  private async cleanupEmptyTenants(
    queryRunner: QueryRunner,
    result: CleanupResult,
    batchSize: number,
    dryRun: boolean,
  ): Promise<void> {
    this.logger.debug('Cleaning up empty tenants');

    const emptyTenants = await this.tenantRepository
      .createQueryBuilder('tenant')
      .leftJoin('roles', 'r', 'r.tenant_id = tenant.id')
      .leftJoin('user_roles', 'ur', 'ur.tenant_id = tenant.id')
      .where('r.id IS NULL')
      .andWhere('ur.id IS NULL')
      .getMany();

    result.statistics.emptyTenants = emptyTenants.length;

    if (emptyTenants.length > 0) {
      // Add warning about tenant deletion
      result.warnings.push(`Found ${emptyTenants.length} empty tenants. Consider manual review before deletion.`);
      
      if (!dryRun) {
        for (let i = 0; i < emptyTenants.length; i += batchSize) {
          const batch = emptyTenants.slice(i, i + batchSize);
          await queryRunner.manager.remove(RBACTenant, batch);
        }
      }
      
      const action = `${dryRun ? '[DRY RUN] ' : ''}Removed ${emptyTenants.length} empty tenants`;
      result.actions.push(action);
      this.logger.debug(action);
    }
  }

  private async cleanupOldAuditLogs(
    queryRunner: QueryRunner,
    result: CleanupResult,
    retentionDays: number,
    tenantId: string | undefined,
    batchSize: number,
    dryRun: boolean,
  ): Promise<void> {
    this.logger.debug(`Cleaning up audit logs older than ${retentionDays} days`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let query = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .where('audit_log.created_at < :cutoffDate', { cutoffDate });

    if (tenantId) {
      query = query.andWhere('audit_log.tenantId = :tenantId', { tenantId });
    }

    const oldAuditLogs = await query.getMany();
    result.statistics.oldAuditLogs = oldAuditLogs.length;

    if (oldAuditLogs.length > 0) {
      if (!dryRun) {
        for (let i = 0; i < oldAuditLogs.length; i += batchSize) {
          const batch = oldAuditLogs.slice(i, i + batchSize);
          await queryRunner.manager.remove(AuditLog, batch);
        }
      }
      
      const action = `${dryRun ? '[DRY RUN] ' : ''}Removed ${oldAuditLogs.length} old audit logs (older than ${retentionDays} days)`;
      result.actions.push(action);
      this.logger.debug(action);
    }
  }

  // Private helper methods for integrity checks

  private async collectPerformanceMetrics(result: IntegrityCheckResult, tenantId?: string): Promise<void> {
    const metrics = result.performance;

    if (tenantId) {
      // Tenant-specific metrics
      metrics.totalTenants = 1;
      metrics.totalRoles = await this.roleRepository.count({ where: { tenant_id: tenantId } });
      metrics.totalUserRoles = await this.userRoleRepository.count({ where: { tenant_id: tenantId } });
      
      // Get unique users in this tenant
      const uniqueUsersResult = await this.userRoleRepository
        .createQueryBuilder('ur')
        .select('COUNT(DISTINCT ur.user_id)', 'count')
        .where('ur.tenant_id = :tenantId', { tenantId })
        .getRawOne();
      metrics.totalUsers = parseInt(uniqueUsersResult?.count || '0', 10);
    } else {
      // Global metrics
      metrics.totalUsers = await this.userRepository.count();
      metrics.totalRoles = await this.roleRepository.count();
      metrics.totalUserRoles = await this.userRoleRepository.count();
      metrics.totalTenants = await this.tenantRepository.count();
    }

    metrics.totalPermissions = await this.permissionRepository.count();
    metrics.totalRolePermissions = await this.rolePermissionRepository.count();

    // Calculate averages
    metrics.averageRolesPerUser = metrics.totalUsers > 0 ? metrics.totalUserRoles / metrics.totalUsers : 0;
    metrics.averagePermissionsPerRole = metrics.totalRoles > 0 ? metrics.totalRolePermissions / metrics.totalRoles : 0;
  }

  private async checkOrphanedData(result: IntegrityCheckResult, tenantId?: string): Promise<void> {
    // Check orphaned user roles
    let orphanedUserRolesQuery = this.userRoleRepository
      .createQueryBuilder('ur')
      .leftJoin('users', 'u', 'u.id = ur.user_id')
      .where('u.id IS NULL');

    if (tenantId) {
      orphanedUserRolesQuery = orphanedUserRolesQuery.andWhere('ur.tenant_id = :tenantId', { tenantId });
    }

    const orphanedUserRolesCount = await orphanedUserRolesQuery.getCount();
    if (orphanedUserRolesCount > 0) {
      result.issues.push({
        type: 'orphaned_data',
        severity: 'high',
        description: `Found ${orphanedUserRolesCount} orphaned user role assignments`,
        affectedCount: orphanedUserRolesCount,
        recommendation: 'Run data cleanup to remove orphaned user role assignments',
        tenantId,
      });
    }

    // Check orphaned role permissions
    let orphanedRolePermissionsQuery = this.rolePermissionRepository
      .createQueryBuilder('rp')
      .leftJoin('rp.role', 'r')
      .leftJoin('rp.permission', 'p')
      .where('r.id IS NULL OR p.id IS NULL');

    if (tenantId) {
      orphanedRolePermissionsQuery = orphanedRolePermissionsQuery.andWhere('r.tenant_id = :tenantId', { tenantId });
    }

    const orphanedRolePermissionsCount = await orphanedRolePermissionsQuery.getCount();
    if (orphanedRolePermissionsCount > 0) {
      result.issues.push({
        type: 'orphaned_data',
        severity: 'high',
        description: `Found ${orphanedRolePermissionsCount} orphaned role permission assignments`,
        affectedCount: orphanedRolePermissionsCount,
        recommendation: 'Run data cleanup to remove orphaned role permission assignments',
        tenantId,
      });
    }
  }

  private async checkMissingReferences(result: IntegrityCheckResult, tenantId?: string): Promise<void> {
    // Check for roles without tenants
    let rolesWithoutTenantsQuery = this.roleRepository
      .createQueryBuilder('role')
      .leftJoin('role.tenant', 'tenant')
      .where('tenant.id IS NULL');

    if (tenantId) {
      rolesWithoutTenantsQuery = rolesWithoutTenantsQuery.andWhere('role.tenant_id = :tenantId', { tenantId });
    }

    const rolesWithoutTenantsCount = await rolesWithoutTenantsQuery.getCount();
    if (rolesWithoutTenantsCount > 0) {
      result.issues.push({
        type: 'missing_reference',
        severity: 'critical',
        description: `Found ${rolesWithoutTenantsCount} roles with missing tenant references`,
        affectedCount: rolesWithoutTenantsCount,
        recommendation: 'Investigate and fix missing tenant references or remove invalid roles',
        tenantId,
      });
    }
  }

  private async checkDuplicateData(result: IntegrityCheckResult, tenantId?: string): Promise<void> {
    // Check for duplicate user role assignments
    let duplicateUserRolesQuery = this.userRoleRepository
      .createQueryBuilder('ur')
      .select('ur.user_id, ur.role_id, ur.tenant_id, COUNT(*) as count')
      .groupBy('ur.user_id, ur.role_id, ur.tenant_id')
      .having('COUNT(*) > 1');

    if (tenantId) {
      duplicateUserRolesQuery = duplicateUserRolesQuery.andWhere('ur.tenant_id = :tenantId', { tenantId });
    }

    const duplicateUserRoles = await duplicateUserRolesQuery.getRawMany();
    if (duplicateUserRoles.length > 0) {
      const totalDuplicates = duplicateUserRoles.reduce((sum, dup) => sum + parseInt(dup.count) - 1, 0);
      result.issues.push({
        type: 'duplicate_data',
        severity: 'medium',
        description: `Found ${totalDuplicates} duplicate user role assignments`,
        affectedCount: totalDuplicates,
        recommendation: 'Remove duplicate user role assignments to improve performance',
        tenantId,
      });
    }

    // Check for duplicate role permission assignments
    const duplicateRolePermissions = await this.rolePermissionRepository
      .createQueryBuilder('rp')
      .select('rp.role_id, rp.permission_id, COUNT(*) as count')
      .groupBy('rp.role_id, rp.permission_id')
      .having('COUNT(*) > 1')
      .getRawMany();

    if (duplicateRolePermissions.length > 0) {
      const totalDuplicates = duplicateRolePermissions.reduce((sum, dup) => sum + parseInt(dup.count) - 1, 0);
      result.issues.push({
        type: 'duplicate_data',
        severity: 'medium',
        description: `Found ${totalDuplicates} duplicate role permission assignments`,
        affectedCount: totalDuplicates,
        recommendation: 'Remove duplicate role permission assignments to improve performance',
      });
    }
  }

  private async checkConstraintViolations(result: IntegrityCheckResult, tenantId?: string): Promise<void> {
    // Check for users with excessive role assignments
    let excessiveRolesQuery = this.userRoleRepository
      .createQueryBuilder('ur')
      .select('ur.user_id, COUNT(*) as role_count')
      .groupBy('ur.user_id')
      .having('COUNT(*) > :maxRoles', { maxRoles: 10 });

    if (tenantId) {
      excessiveRolesQuery = excessiveRolesQuery.andWhere('ur.tenant_id = :tenantId', { tenantId });
    }

    const usersWithExcessiveRoles = await excessiveRolesQuery.getRawMany();
    if (usersWithExcessiveRoles.length > 0) {
      result.issues.push({
        type: 'constraint_violation',
        severity: 'medium',
        description: `Found ${usersWithExcessiveRoles.length} users with more than 10 role assignments`,
        affectedCount: usersWithExcessiveRoles.length,
        recommendation: 'Review users with excessive role assignments and consolidate roles where possible',
        tenantId,
      });
    }

    // Check for roles with excessive permission assignments
    const rolesWithExcessivePermissions = await this.rolePermissionRepository
      .createQueryBuilder('rp')
      .select('rp.role_id, COUNT(*) as permission_count')
      .groupBy('rp.role_id')
      .having('COUNT(*) > :maxPermissions', { maxPermissions: 50 })
      .getRawMany();

    if (rolesWithExcessivePermissions.length > 0) {
      result.issues.push({
        type: 'constraint_violation',
        severity: 'low',
        description: `Found ${rolesWithExcessivePermissions.length} roles with more than 50 permission assignments`,
        affectedCount: rolesWithExcessivePermissions.length,
        recommendation: 'Review roles with excessive permissions and consider role decomposition',
      });
    }
  }

  private async checkPerformanceIssues(result: IntegrityCheckResult, tenantId?: string): Promise<void> {
    // Check for tenants with excessive data
    if (!tenantId) {
      const tenantDataCounts = await this.userRoleRepository
        .createQueryBuilder('ur')
        .select('ur.tenant_id, COUNT(*) as user_role_count')
        .groupBy('ur.tenant_id')
        .having('COUNT(*) > :maxUserRoles', { maxUserRoles: 10000 })
        .getRawMany();

      if (tenantDataCounts.length > 0) {
        result.issues.push({
          type: 'performance_issue',
          severity: 'medium',
          description: `Found ${tenantDataCounts.length} tenants with more than 10,000 user role assignments`,
          affectedCount: tenantDataCounts.length,
          recommendation: 'Consider implementing data archiving or tenant optimization strategies',
        });
      }
    }

    // Check for old audit logs that might impact performance
    const oldAuditLogsCount = await this.auditLogRepository
      .createQueryBuilder('audit_log')
      .where('audit_log.created_at < :cutoffDate', { 
        cutoffDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // 1 year ago
      })
      .getCount();

    if (oldAuditLogsCount > 100000) {
      result.issues.push({
        type: 'performance_issue',
        severity: 'low',
        description: `Found ${oldAuditLogsCount} audit logs older than 1 year`,
        affectedCount: oldAuditLogsCount,
        recommendation: 'Consider implementing audit log archiving to improve query performance',
        tenantId,
      });
    }
  }

  private generateRecommendations(result: IntegrityCheckResult): void {
    const criticalIssues = result.issues.filter(issue => issue.severity === 'critical').length;
    const highIssues = result.issues.filter(issue => issue.severity === 'high').length;
    const mediumIssues = result.issues.filter(issue => issue.severity === 'medium').length;

    if (criticalIssues > 0) {
      result.recommendations.push(`Address ${criticalIssues} critical issues immediately to prevent system instability`);
    }

    if (highIssues > 0) {
      result.recommendations.push(`Resolve ${highIssues} high-priority issues to maintain data integrity`);
    }

    if (mediumIssues > 0) {
      result.recommendations.push(`Consider addressing ${mediumIssues} medium-priority issues during next maintenance window`);
    }

    if (result.performance.averageRolesPerUser > 5) {
      result.recommendations.push('High average roles per user detected - consider role consolidation');
    }

    if (result.performance.averagePermissionsPerRole > 30) {
      result.recommendations.push('High average permissions per role detected - consider role decomposition');
    }

    if (result.issues.length === 0) {
      result.recommendations.push('System integrity is healthy - continue regular monitoring');
    }
  }

  private async sendCleanupNotification(result: CleanupResult, emails: string[]): Promise<void> {
    // This would integrate with your notification system
    // For now, just log the notification
    this.logger.log(`Would send cleanup notification to: ${emails.join(', ')}`);
    this.logger.log(`Cleanup summary: ${JSON.stringify(result.statistics)}`);
  }

  private async sendCleanupFailureNotification(error: Error, emails: string[]): Promise<void> {
    // This would integrate with your notification system
    // For now, just log the notification
    this.logger.error(`Would send cleanup failure notification to: ${emails.join(', ')}`);
    this.logger.error(`Cleanup error: ${error.message}`);
  }
}