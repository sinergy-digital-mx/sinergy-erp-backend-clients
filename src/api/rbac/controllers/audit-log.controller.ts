import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
  ParseEnumPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { AuditLogService } from '../services/audit-log.service';
import { AuditAction, AuditResult } from '../../../entities/rbac/audit-log.entity';
import { TenantContextService } from '../services/tenant-context.service';

export class AuditLogQueryDto {
  userId?: string;
  actorId?: string;
  action?: AuditAction;
  result?: AuditResult;
  resourceType?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

@Controller('rbac/audit-logs')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AuditLogController {
  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Get()
  @RequirePermissions({ entityType: 'AuditLog', action: 'Read' })
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('actorId') actorId?: string,
    @Query('action') action?: AuditAction,
    @Query('result') result?: AuditResult,
    @Query('resourceType') resourceType?: string,
    @Query('entityType') entityType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number = 100,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number = 0,
  ) {
    const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;

    const queryOptions = {
      userId,
      actorId,
      tenantId,
      action,
      result,
      resourceType,
      entityType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: Math.min(limit, 1000), // Cap at 1000 for performance
      offset,
    };

    return this.auditLogService.queryAuditLogs(queryOptions);
  }

  @Get('user/:userId')
  @RequirePermissions({ entityType: 'AuditLog', action: 'Read' })
  async getUserAuditLogs(
    @Query('userId') userId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number = 0,
  ) {
    const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;
    return this.auditLogService.getUserAuditLogs(userId, tenantId, limit, offset);
  }

  @Get('role/:roleId')
  @RequirePermissions({ entityType: 'AuditLog', action: 'Read' })
  async getRoleAuditLogs(
    @Query('roleId') roleId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number = 0,
  ) {
    const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;
    return this.auditLogService.getRoleAuditLogs(roleId, tenantId, limit, offset);
  }

  @Get('failed-access')
  @RequirePermissions({ entityType: 'AuditLog', action: 'Read' })
  async getFailedAccessAttempts(
    @Query('hours', new DefaultValuePipe(24), ParseIntPipe) hours: number = 24,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number = 100,
  ) {
    const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;
    return this.auditLogService.getFailedAccessAttempts(tenantId, hours, limit);
  }

  @Get('permission-changes')
  @RequirePermissions({ entityType: 'AuditLog', action: 'Read' })
  async getPermissionChanges(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number = 30,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number = 100,
  ) {
    const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;
    return this.auditLogService.getPermissionChanges(tenantId, days, limit);
  }

  @Get('date-range')
  @RequirePermissions({ entityType: 'AuditLog', action: 'Read' })
  async getAuditLogsByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number = 100,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number = 0,
  ) {
    const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;
    
    if (!startDate || !endDate) {
      throw new Error('Both startDate and endDate are required');
    }

    return this.auditLogService.getAuditLogsByDateRange(
      new Date(startDate),
      new Date(endDate),
      tenantId,
      limit,
      offset,
    );
  }

  @Get('security-summary')
  @RequirePermissions({ entityType: 'AuditLog', action: 'Read' })
  async getSecuritySummary(
    @Query('hours', new DefaultValuePipe(24), ParseIntPipe) hours: number = 24,
  ) {
    const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;
    
    const [failedAttempts, permissionChanges] = await Promise.all([
      this.auditLogService.getFailedAccessAttempts(tenantId, hours, 1000),
      this.auditLogService.getPermissionChanges(tenantId, 1, 1000),
    ]);

    // Group failed attempts by user
    const failedByUser = failedAttempts.logs.reduce((acc, log) => {
      if (log.userId) {
        acc[log.userId] = (acc[log.userId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Group permission changes by type
    const changesByType = permissionChanges.logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      timeRange: `${hours} hours`,
      failedAccessAttempts: {
        total: failedAttempts.total,
        byUser: failedByUser,
        topUsers: Object.entries(failedByUser)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([userId, count]) => ({ userId, count })),
      },
      permissionChanges: {
        total: permissionChanges.total,
        byType: changesByType,
      },
    };
  }

  @Get('statistics')
  @RequirePermissions({ entityType: 'AuditLog', action: 'Read' })
  async getAuditStatistics(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number = 30,
  ) {
    const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;
    return this.auditLogService.getAuditStatistics(tenantId, days);
  }

  @Get('search')
  @RequirePermissions({ entityType: 'AuditLog', action: 'Read' })
  async searchAuditLogs(
    @Query('q') searchTerm: string,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number = 100,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number = 0,
  ) {
    if (!searchTerm) {
      throw new Error('Search term is required');
    }

    const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;
    return this.auditLogService.searchAuditLogs(searchTerm, tenantId, limit, offset);
  }

  @Get('compliance-export')
  @RequirePermissions({ entityType: 'AuditLog', action: 'Export' })
  async getComplianceExport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('actions') actions?: string,
  ) {
    if (!startDate || !endDate) {
      throw new Error('Both startDate and endDate are required');
    }

    const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;
    const actionList = actions ? actions.split(',') as AuditAction[] : undefined;

    return this.auditLogService.getComplianceExport(
      new Date(startDate),
      new Date(endDate),
      tenantId,
      actionList,
    );
  }

  @Get('user/:userId/recent-activity')
  @RequirePermissions({ entityType: 'AuditLog', action: 'Read' })
  async getUserRecentActivity(
    @Query('userId') userId: string,
    @Query('hours', new DefaultValuePipe(24), ParseIntPipe) hours: number = 24,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
  ) {
    const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;
    return this.auditLogService.getUserRecentActivity(userId, tenantId, hours, limit);
  }

  @Get('suspicious-activity')
  @RequirePermissions({ entityType: 'AuditLog', action: 'Read' })
  async getSuspiciousActivity(
    @Query('hours', new DefaultValuePipe(24), ParseIntPipe) hours: number = 24,
  ) {
    const tenantId = this.tenantContextService.getCurrentTenantId() || undefined;
    return this.auditLogService.getSuspiciousActivity(tenantId, hours);
  }
}