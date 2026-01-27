/**
 * RBAC Data Cleanup Controller
 * 
 * Provides REST API endpoints for data cleanup utilities and integrity monitoring.
 * Allows administrators to manage data maintenance operations.
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { DataCleanupService, CleanupOptions, CleanupResult, IntegrityCheckResult, MaintenanceSchedule } from '../services/data-cleanup.service';
import { TenantContextService } from '../services/tenant-context.service';

class CleanupOptionsDto {
  dryRun?: boolean = true; // Default to dry run for safety
  batchSize?: number = 1000;
  cleanupUserRoles?: boolean = true;
  cleanupRolePermissions?: boolean = true;
  cleanupUnusedRoles?: boolean = true;
  cleanupUnusedPermissions?: boolean = true;
  cleanupEmptyTenants?: boolean = false;
  cleanupOldAuditLogs?: boolean = false;
  auditLogRetentionDays?: number = 365;
  tenantId?: string;
}

class IntegrityCheckDto {
  tenantId?: string;
}

@ApiTags('RBAC Data Cleanup')
@Controller('rbac/cleanup')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class DataCleanupController {
  constructor(
    private readonly dataCleanupService: DataCleanupService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Perform data cleanup operation
   */
  @Post('perform')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ entityType: 'System', action: 'Maintain' })
  @ApiOperation({
    summary: 'Perform data cleanup',
    description: 'Execute data cleanup operations to remove orphaned data and maintain system integrity. Defaults to dry run for safety.',
  })
  @ApiBody({ type: CleanupOptionsDto })
  @ApiResponse({
    status: 200,
    description: 'Cleanup operation completed successfully',
    schema: {
      type: 'object',
      properties: {
        executionTime: { type: 'number', description: 'Execution time in milliseconds' },
        dryRun: { type: 'boolean', description: 'Whether this was a dry run' },
        statistics: {
          type: 'object',
          properties: {
            orphanedUserRoles: { type: 'number' },
            orphanedRolePermissions: { type: 'number' },
            unusedRoles: { type: 'number' },
            unusedPermissions: { type: 'number' },
            emptyTenants: { type: 'number' },
            oldAuditLogs: { type: 'number' },
          },
        },
        actions: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid cleanup options' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'Cleanup operation already in progress' })
  async performCleanup(@Body() options: CleanupOptionsDto): Promise<CleanupResult> {
    // Validate options
    this.validateCleanupOptions(options);

    // Check if cleanup is already running
    if (this.dataCleanupService.isCleanupInProgress()) {
      throw new BadRequestException('Cleanup operation is already in progress');
    }

    // Restrict tenant-specific cleanup to current tenant context
    if (options.tenantId) {
      const currentTenantId = this.tenantContextService.getCurrentTenantId();
      if (options.tenantId !== currentTenantId) {
        throw new ForbiddenException('Cannot perform cleanup for different tenant');
      }
    }

    return await this.dataCleanupService.performCleanup(options);
  }

  /**
   * Perform data integrity check
   */
  @Post('integrity-check')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ entityType: 'System', action: 'Read' })
  @ApiOperation({
    summary: 'Perform data integrity check',
    description: 'Check system data integrity and identify potential issues without making changes.',
  })
  @ApiBody({ type: IntegrityCheckDto })
  @ApiResponse({
    status: 200,
    description: 'Integrity check completed successfully',
    schema: {
      type: 'object',
      properties: {
        isHealthy: { type: 'boolean', description: 'Overall system health status' },
        checkedAt: { type: 'string', format: 'date-time' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['orphaned_data', 'missing_reference', 'duplicate_data', 'constraint_violation', 'performance_issue'] },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              description: { type: 'string' },
              affectedCount: { type: 'number' },
              recommendation: { type: 'string' },
              tenantId: { type: 'string', nullable: true },
            },
          },
        },
        performance: {
          type: 'object',
          properties: {
            totalUsers: { type: 'number' },
            totalRoles: { type: 'number' },
            totalPermissions: { type: 'number' },
            totalUserRoles: { type: 'number' },
            totalRolePermissions: { type: 'number' },
            totalTenants: { type: 'number' },
            averageRolesPerUser: { type: 'number' },
            averagePermissionsPerRole: { type: 'number' },
          },
        },
        recommendations: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async performIntegrityCheck(@Body() options: IntegrityCheckDto): Promise<IntegrityCheckResult> {
    // Restrict tenant-specific check to current tenant context
    if (options.tenantId) {
      const currentTenantId = this.tenantContextService.getCurrentTenantId();
      if (options.tenantId !== currentTenantId) {
        throw new ForbiddenException('Cannot perform integrity check for different tenant');
      }
    }

    return await this.dataCleanupService.performIntegrityCheck(options.tenantId);
  }

  /**
   * Get last cleanup result
   */
  @Get('last-cleanup')
  @RequirePermissions({ entityType: 'System', action: 'Read' })
  @ApiOperation({
    summary: 'Get last cleanup result',
    description: 'Retrieve the results of the most recent cleanup operation.',
  })
  @ApiResponse({
    status: 200,
    description: 'Last cleanup result retrieved successfully',
    schema: {
      type: 'object',
      nullable: true,
      properties: {
        executionTime: { type: 'number' },
        dryRun: { type: 'boolean' },
        statistics: { type: 'object' },
        actions: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getLastCleanupResult(): Promise<CleanupResult | null> {
    return this.dataCleanupService.getLastCleanupResult();
  }

  /**
   * Get last integrity check result
   */
  @Get('last-integrity-check')
  @RequirePermissions({ entityType: 'System', action: 'Read' })
  @ApiOperation({
    summary: 'Get last integrity check result',
    description: 'Retrieve the results of the most recent integrity check.',
  })
  @ApiResponse({
    status: 200,
    description: 'Last integrity check result retrieved successfully',
    schema: {
      type: 'object',
      nullable: true,
      properties: {
        isHealthy: { type: 'boolean' },
        checkedAt: { type: 'string', format: 'date-time' },
        issues: { type: 'array' },
        performance: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getLastIntegrityCheck(): Promise<IntegrityCheckResult | null> {
    return this.dataCleanupService.getLastIntegrityCheck();
  }

  /**
   * Get cleanup status
   */
  @Get('status')
  @RequirePermissions({ entityType: 'System', action: 'Read' })
  @ApiOperation({
    summary: 'Get cleanup status',
    description: 'Check if a cleanup operation is currently in progress.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cleanup status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        isRunning: { type: 'boolean', description: 'Whether cleanup is currently running' },
        lastCleanupAt: { type: 'string', format: 'date-time', nullable: true },
        lastIntegrityCheckAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getCleanupStatus(): Promise<{
    isRunning: boolean;
    lastCleanupAt: Date | null;
    lastIntegrityCheckAt: Date | null;
  }> {
    const lastCleanup = this.dataCleanupService.getLastCleanupResult();
    const lastIntegrityCheck = this.dataCleanupService.getLastIntegrityCheck();

    return {
      isRunning: this.dataCleanupService.isCleanupInProgress(),
      lastCleanupAt: lastCleanup ? new Date(Date.now() - lastCleanup.executionTime) : null,
      lastIntegrityCheckAt: lastIntegrityCheck ? lastIntegrityCheck.checkedAt : null,
    };
  }

  /**
   * Get maintenance schedule configuration
   */
  @Get('maintenance-schedule')
  @RequirePermissions({ entityType: 'System', action: 'Read' })
  @ApiOperation({
    summary: 'Get maintenance schedule',
    description: 'Retrieve the current maintenance schedule configuration.',
  })
  @ApiResponse({
    status: 200,
    description: 'Maintenance schedule retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        schedule: { type: 'string', description: 'Cron expression' },
        defaultOptions: { type: 'object' },
        notifyOnCompletion: { type: 'boolean' },
        notificationEmails: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getMaintenanceSchedule(): Promise<MaintenanceSchedule> {
    return this.dataCleanupService.getMaintenanceSchedule();
  }

  /**
   * Preview cleanup operation (dry run with detailed analysis)
   */
  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ entityType: 'System', action: 'Read' })
  @ApiOperation({
    summary: 'Preview cleanup operation',
    description: 'Preview what would be cleaned up without making any changes. Always performs a dry run.',
  })
  @ApiBody({ type: CleanupOptionsDto })
  @ApiResponse({
    status: 200,
    description: 'Cleanup preview completed successfully',
    schema: {
      type: 'object',
      properties: {
        wouldCleanup: {
          type: 'object',
          properties: {
            orphanedUserRoles: { type: 'number' },
            orphanedRolePermissions: { type: 'number' },
            unusedRoles: { type: 'number' },
            unusedPermissions: { type: 'number' },
            emptyTenants: { type: 'number' },
            oldAuditLogs: { type: 'number' },
          },
        },
        estimatedExecutionTime: { type: 'string', description: 'Estimated time to complete' },
        recommendations: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid cleanup options' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async previewCleanup(@Body() options: CleanupOptionsDto): Promise<{
    wouldCleanup: CleanupResult['statistics'];
    estimatedExecutionTime: string;
    recommendations: string[];
    warnings: string[];
  }> {
    // Validate options
    this.validateCleanupOptions(options);

    // Force dry run for preview
    const previewOptions = { ...options, dryRun: true };

    // Restrict tenant-specific preview to current tenant context
    if (previewOptions.tenantId) {
      const currentTenantId = this.tenantContextService.getCurrentTenantId();
      if (previewOptions.tenantId !== currentTenantId) {
        throw new ForbiddenException('Cannot preview cleanup for different tenant');
      }
    }

    const result = await this.dataCleanupService.performCleanup(previewOptions);

    // Estimate execution time based on data volume
    const totalItems = Object.values(result.statistics).reduce((sum, count) => sum + count, 0);
    const estimatedSeconds = Math.max(1, Math.ceil(totalItems / 1000)); // Rough estimate: 1000 items per second
    const estimatedExecutionTime = estimatedSeconds < 60 
      ? `${estimatedSeconds} seconds`
      : `${Math.ceil(estimatedSeconds / 60)} minutes`;

    const recommendations: string[] = [];
    const warnings: string[] = [...result.warnings];

    // Generate recommendations based on what would be cleaned
    if (result.statistics.orphanedUserRoles > 0) {
      recommendations.push(`${result.statistics.orphanedUserRoles} orphaned user roles will be removed`);
    }
    if (result.statistics.orphanedRolePermissions > 0) {
      recommendations.push(`${result.statistics.orphanedRolePermissions} orphaned role permissions will be removed`);
    }
    if (result.statistics.unusedRoles > 0) {
      recommendations.push(`${result.statistics.unusedRoles} unused roles will be removed`);
    }
    if (result.statistics.unusedPermissions > 0) {
      recommendations.push(`${result.statistics.unusedPermissions} unused permissions will be removed`);
    }
    if (result.statistics.emptyTenants > 0) {
      recommendations.push(`${result.statistics.emptyTenants} empty tenants will be removed`);
      warnings.push('Tenant deletion is irreversible - ensure these tenants are truly unused');
    }
    if (result.statistics.oldAuditLogs > 0) {
      recommendations.push(`${result.statistics.oldAuditLogs} old audit logs will be removed`);
      warnings.push('Audit log deletion may impact compliance requirements');
    }

    if (totalItems === 0) {
      recommendations.push('No cleanup needed - system is clean');
    }

    return {
      wouldCleanup: result.statistics,
      estimatedExecutionTime,
      recommendations,
      warnings,
    };
  }

  /**
   * Get system health summary
   */
  @Get('health')
  @RequirePermissions({ entityType: 'System', action: 'Read' })
  @ApiOperation({
    summary: 'Get system health summary',
    description: 'Get a quick overview of system health and data integrity status.',
  })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Limit health check to specific tenant' })
  @ApiResponse({
    status: 200,
    description: 'System health summary retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        overallHealth: { type: 'string', enum: ['healthy', 'warning', 'critical'] },
        lastChecked: { type: 'string', format: 'date-time', nullable: true },
        criticalIssues: { type: 'number' },
        highIssues: { type: 'number' },
        mediumIssues: { type: 'number' },
        lowIssues: { type: 'number' },
        cleanupRecommended: { type: 'boolean' },
        nextScheduledCleanup: { type: 'string', nullable: true },
        quickStats: {
          type: 'object',
          properties: {
            totalUsers: { type: 'number' },
            totalRoles: { type: 'number' },
            totalPermissions: { type: 'number' },
            totalTenants: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getSystemHealth(@Query('tenantId') tenantId?: string): Promise<{
    overallHealth: 'healthy' | 'warning' | 'critical';
    lastChecked: Date | null;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    cleanupRecommended: boolean;
    nextScheduledCleanup: string | null;
    quickStats: {
      totalUsers: number;
      totalRoles: number;
      totalPermissions: number;
      totalTenants: number;
    };
  }> {
    // Restrict tenant-specific health check to current tenant context
    if (tenantId) {
      const currentTenantId = this.tenantContextService.getCurrentTenantId();
      if (tenantId !== currentTenantId) {
        throw new ForbiddenException('Cannot check health for different tenant');
      }
    }

    const lastIntegrityCheck = this.dataCleanupService.getLastIntegrityCheck();
    const schedule = this.dataCleanupService.getMaintenanceSchedule();

    let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    let criticalIssues = 0;
    let highIssues = 0;
    let mediumIssues = 0;
    let lowIssues = 0;

    if (lastIntegrityCheck) {
      criticalIssues = lastIntegrityCheck.issues.filter(i => i.severity === 'critical').length;
      highIssues = lastIntegrityCheck.issues.filter(i => i.severity === 'high').length;
      mediumIssues = lastIntegrityCheck.issues.filter(i => i.severity === 'medium').length;
      lowIssues = lastIntegrityCheck.issues.filter(i => i.severity === 'low').length;

      if (criticalIssues > 0) {
        overallHealth = 'critical';
      } else if (highIssues > 0 || mediumIssues > 5) {
        overallHealth = 'warning';
      }
    }

    const cleanupRecommended = criticalIssues > 0 || highIssues > 0 || mediumIssues > 3;

    return {
      overallHealth,
      lastChecked: lastIntegrityCheck?.checkedAt || null,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      cleanupRecommended,
      nextScheduledCleanup: schedule.enabled ? schedule.schedule : null,
      quickStats: lastIntegrityCheck?.performance || {
        totalUsers: 0,
        totalRoles: 0,
        totalPermissions: 0,
        totalTenants: 0,
      },
    };
  }

  /**
   * Validate cleanup options
   * @private
   */
  private validateCleanupOptions(options: CleanupOptionsDto): void {
    if (options.batchSize && (options.batchSize < 1 || options.batchSize > 10000)) {
      throw new BadRequestException('Batch size must be between 1 and 10000');
    }

    if (options.auditLogRetentionDays && options.auditLogRetentionDays < 1) {
      throw new BadRequestException('Audit log retention days must be at least 1');
    }

    // Warn about potentially destructive operations
    if (options.cleanupEmptyTenants && !options.dryRun) {
      // This is handled by the service, but we can add additional validation here
    }

    if (options.cleanupOldAuditLogs && !options.dryRun && (options.auditLogRetentionDays || 365) < 90) {
      throw new BadRequestException('Audit log retention period less than 90 days requires explicit confirmation');
    }
  }
}