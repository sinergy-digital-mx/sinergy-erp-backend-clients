import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindManyOptions } from 'typeorm';
import { AuditLog, AuditAction, AuditResult } from '../../../entities/rbac/audit-log.entity';
import { TenantContextService } from './tenant-context.service';

// Re-export types for use in other services
export { AuditAction, AuditResult } from '../../../entities/rbac/audit-log.entity';

export interface CreateAuditLogDto {
  action: AuditAction;
  result: AuditResult;
  userId?: string;
  actorId?: string;
  tenantId?: string;
  resourceType?: string;
  resourceId?: string;
  entityType?: string;
  permissionAction?: string;
  roleId?: string;
  permissionId?: string;
  details?: string;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface AuditLogQueryOptions {
  userId?: string;
  actorId?: string;
  tenantId?: string;
  action?: AuditAction;
  result?: AuditResult;
  resourceType?: string;
  entityType?: string;
  roleId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private tenantContextService: TenantContextService,
  ) {}

  /**
   * Create an audit log entry
   */
  async createAuditLog(data: CreateAuditLogDto): Promise<AuditLog> {
    try {
      // Use current tenant context if not provided
      const tenantId = data.tenantId || this.tenantContextService.getCurrentTenantId() || undefined;

      const auditLog = this.auditLogRepository.create({
        ...data,
        tenantId,
      });

      const savedLog = await this.auditLogRepository.save(auditLog);

      // Also log to application logger for immediate visibility
      this.logger.log(
        `Audit: ${data.action} - ${data.result}`,
        {
          auditId: savedLog.id,
          userId: data.userId,
          actorId: data.actorId,
          tenantId,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          details: data.details,
        },
      );

      return savedLog;
    } catch (error) {
      this.logger.error('Failed to create audit log', error.stack, {
        action: data.action,
        userId: data.userId,
        tenantId: data.tenantId,
      });
      throw error;
    }
  }

  /**
   * Log permission change events
   */
  async logPermissionChange(
    action: AuditAction.PERMISSION_GRANTED | AuditAction.PERMISSION_REVOKED,
    userId: string,
    actorId: string,
    permissionId: string,
    entityType: string,
    permissionAction: string,
    tenantId?: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLog> {
    return this.createAuditLog({
      action,
      result: AuditResult.SUCCESS,
      userId,
      actorId,
      tenantId,
      permissionId,
      entityType,
      permissionAction,
      resourceType: 'permission',
      resourceId: permissionId,
      details: `${action === AuditAction.PERMISSION_GRANTED ? 'Granted' : 'Revoked'} permission ${permissionAction} on ${entityType}`,
      metadata,
    });
  }

  /**
   * Log role assignment events
   */
  async logRoleAssignment(
    action: AuditAction.ROLE_ASSIGNED | AuditAction.ROLE_UNASSIGNED,
    userId: string,
    actorId: string,
    roleId: string,
    tenantId?: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLog> {
    return this.createAuditLog({
      action,
      result: AuditResult.SUCCESS,
      userId,
      actorId,
      tenantId,
      roleId,
      resourceType: 'role',
      resourceId: roleId,
      details: `${action === AuditAction.ROLE_ASSIGNED ? 'Assigned' : 'Unassigned'} role to user`,
      metadata,
    });
  }

  /**
   * Log access attempts (both granted and denied)
   */
  async logAccessAttempt(
    granted: boolean,
    userId: string,
    entityType: string,
    permissionAction: string,
    resourceId?: string,
    tenantId?: string,
    errorMessage?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLog> {
    return this.createAuditLog({
      action: granted ? AuditAction.ACCESS_GRANTED : AuditAction.ACCESS_DENIED,
      result: granted ? AuditResult.SUCCESS : AuditResult.FAILURE,
      userId,
      tenantId,
      entityType,
      permissionAction,
      resourceType: entityType.toLowerCase(),
      resourceId,
      details: `Access ${granted ? 'granted' : 'denied'} for ${permissionAction} on ${entityType}`,
      errorMessage,
      ipAddress,
      userAgent,
      metadata,
    });
  }

  /**
   * Log role management events
   */
  async logRoleManagement(
    action: AuditAction.ROLE_CREATED | AuditAction.ROLE_UPDATED | AuditAction.ROLE_DELETED,
    actorId: string,
    roleId: string,
    tenantId?: string,
    details?: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLog> {
    return this.createAuditLog({
      action,
      result: AuditResult.SUCCESS,
      actorId,
      tenantId,
      roleId,
      resourceType: 'role',
      resourceId: roleId,
      details: details || `Role ${action.replace('role_', '')}`,
      metadata,
    });
  }

  /**
   * Log permission management events
   */
  async logPermissionManagement(
    action: AuditAction.PERMISSION_CREATED | AuditAction.PERMISSION_UPDATED | AuditAction.PERMISSION_DELETED,
    actorId: string,
    permissionId: string,
    entityType: string,
    permissionAction: string,
    tenantId?: string,
    details?: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLog> {
    return this.createAuditLog({
      action,
      result: AuditResult.SUCCESS,
      actorId,
      tenantId,
      permissionId,
      entityType,
      permissionAction,
      resourceType: 'permission',
      resourceId: permissionId,
      details: details || `Permission ${action.replace('permission_', '')} for ${permissionAction} on ${entityType}`,
      metadata,
    });
  }

  /**
   * Log tenant management events
   */
  async logTenantManagement(
    action: AuditAction.TENANT_CREATED | AuditAction.TENANT_UPDATED | AuditAction.TENANT_DELETED,
    actorId: string,
    tenantId: string,
    details?: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLog> {
    return this.createAuditLog({
      action,
      result: AuditResult.SUCCESS,
      actorId,
      tenantId,
      resourceType: 'tenant',
      resourceId: tenantId,
      details: details || `Tenant ${action.replace('tenant_', '')}`,
      metadata,
    });
  }

  /**
   * Query audit logs with filtering options
   */
  async queryAuditLogs(options: AuditLogQueryOptions = {}): Promise<{
    logs: AuditLog[];
    total: number;
  }> {
    const {
      userId,
      actorId,
      tenantId,
      action,
      result,
      resourceType,
      entityType,
      roleId,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = options;

    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.tenant', 'tenant');

    // Apply filters
    if (userId) {
      queryBuilder.andWhere('audit_log.userId = :userId', { userId });
    }

    if (actorId) {
      queryBuilder.andWhere('audit_log.actorId = :actorId', { actorId });
    }

    if (tenantId) {
      queryBuilder.andWhere('audit_log.tenantId = :tenantId', { tenantId });
    }

    if (action) {
      queryBuilder.andWhere('audit_log.action = :action', { action });
    }

    if (result) {
      queryBuilder.andWhere('audit_log.result = :result', { result });
    }

    if (resourceType) {
      queryBuilder.andWhere('audit_log.resourceType = :resourceType', { resourceType });
    }

    if (entityType) {
      queryBuilder.andWhere('audit_log.entityType = :entityType', { entityType });
    }

    if (roleId) {
      queryBuilder.andWhere('audit_log.roleId = :roleId', { roleId });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('audit_log.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('audit_log.createdAt >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('audit_log.createdAt <= :endDate', { endDate });
    }

    // Order by most recent first
    queryBuilder.orderBy('audit_log.createdAt', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(offset).take(limit);

    const logs = await queryBuilder.getMany();

    return { logs, total };
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(
    userId: string,
    tenantId?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    return this.queryAuditLogs({
      userId,
      tenantId,
      limit,
      offset,
    });
  }

  /**
   * Get audit logs for a specific role
   */
  async getRoleAuditLogs(
    roleId: string,
    tenantId?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    return this.queryAuditLogs({
      roleId,
      tenantId,
      limit,
      offset,
    });
  }

  /**
   * Get audit logs for a specific time period
   */
  async getAuditLogsByDateRange(
    startDate: Date,
    endDate: Date,
    tenantId?: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    return this.queryAuditLogs({
      startDate,
      endDate,
      tenantId,
      limit,
      offset,
    });
  }

  /**
   * Get failed access attempts for security monitoring
   */
  async getFailedAccessAttempts(
    tenantId?: string,
    hours: number = 24,
    limit: number = 100,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    return this.queryAuditLogs({
      action: AuditAction.ACCESS_DENIED,
      result: AuditResult.FAILURE,
      startDate,
      tenantId,
      limit,
    });
  }

  /**
   * Get permission changes for compliance reporting
   */
  async getPermissionChanges(
    tenantId?: string,
    days: number = 30,
    limit: number = 100,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.tenant', 'tenant')
      .where('audit_log.action IN (:...actions)', {
        actions: [
          AuditAction.PERMISSION_GRANTED,
          AuditAction.PERMISSION_REVOKED,
          AuditAction.ROLE_ASSIGNED,
          AuditAction.ROLE_UNASSIGNED,
        ],
      })
      .andWhere('audit_log.createdAt >= :startDate', { startDate });

    if (tenantId) {
      queryBuilder.andWhere('audit_log.tenantId = :tenantId', { tenantId });
    }

    queryBuilder
      .orderBy('audit_log.createdAt', 'DESC')
      .take(limit);

    const logs = await queryBuilder.getMany();
    const total = await queryBuilder.getCount();

    return { logs, total };
  }

  /**
   * Get audit statistics for a tenant
   */
  async getAuditStatistics(
    tenantId?: string,
    days: number = 30,
  ): Promise<{
    totalLogs: number;
    successfulActions: number;
    failedActions: number;
    actionBreakdown: Record<string, number>;
    userActivity: Record<string, number>;
    dailyActivity: Array<{ date: string; count: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log')
      .where('audit_log.createdAt >= :startDate', { startDate });

    if (tenantId) {
      queryBuilder.andWhere('audit_log.tenantId = :tenantId', { tenantId });
    }

    const logs = await queryBuilder.getMany();

    const totalLogs = logs.length;
    const successfulActions = logs.filter(log => log.result === AuditResult.SUCCESS).length;
    const failedActions = logs.filter(log => log.result === AuditResult.FAILURE).length;

    // Action breakdown
    const actionBreakdown = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // User activity
    const userActivity = logs.reduce((acc, log) => {
      if (log.userId) {
        acc[log.userId] = (acc[log.userId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Daily activity
    const dailyActivity = logs.reduce((acc, log) => {
      const date = log.createdAt.toISOString().split('T')[0];
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ date, count: 1 });
      }
      return acc;
    }, [] as Array<{ date: string; count: number }>);

    return {
      totalLogs,
      successfulActions,
      failedActions,
      actionBreakdown,
      userActivity,
      dailyActivity: dailyActivity.sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  /**
   * Search audit logs by text content
   */
  async searchAuditLogs(
    searchTerm: string,
    tenantId?: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.tenant', 'tenant')
      .where('(audit_log.details ILIKE :searchTerm OR audit_log.errorMessage ILIKE :searchTerm)', {
        searchTerm: `%${searchTerm}%`,
      });

    if (tenantId) {
      queryBuilder.andWhere('audit_log.tenantId = :tenantId', { tenantId });
    }

    queryBuilder.orderBy('audit_log.createdAt', 'DESC');

    const total = await queryBuilder.getCount();
    
    queryBuilder.skip(offset).take(limit);
    const logs = await queryBuilder.getMany();

    return { logs, total };
  }

  /**
   * Get audit logs for compliance export
   */
  async getComplianceExport(
    startDate: Date,
    endDate: Date,
    tenantId?: string,
    actions?: AuditAction[],
  ): Promise<AuditLog[]> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.tenant', 'tenant')
      .where('audit_log.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (tenantId) {
      queryBuilder.andWhere('audit_log.tenantId = :tenantId', { tenantId });
    }

    if (actions && actions.length > 0) {
      queryBuilder.andWhere('audit_log.action IN (:...actions)', { actions });
    }

    queryBuilder.orderBy('audit_log.createdAt', 'ASC');

    return queryBuilder.getMany();
  }

  /**
   * Get recent activity for a user
   */
  async getUserRecentActivity(
    userId: string,
    tenantId?: string,
    hours: number = 24,
    limit: number = 50,
  ): Promise<AuditLog[]> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.tenant', 'tenant')
      .where('(audit_log.userId = :userId OR audit_log.actorId = :userId)', { userId })
      .andWhere('audit_log.createdAt >= :startDate', { startDate });

    if (tenantId) {
      queryBuilder.andWhere('audit_log.tenantId = :tenantId', { tenantId });
    }

    queryBuilder
      .orderBy('audit_log.createdAt', 'DESC')
      .take(limit);

    return queryBuilder.getMany();
  }

  /**
   * Get suspicious activity patterns
   */
  async getSuspiciousActivity(
    tenantId?: string,
    hours: number = 24,
  ): Promise<{
    multipleFailedAttempts: Array<{ userId: string; count: number; lastAttempt: Date }>;
    unusualPermissionChanges: AuditLog[];
    crossTenantAttempts: AuditLog[];
  }> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    // Multiple failed attempts by user
    const failedAttemptsQuery = this.auditLogRepository.createQueryBuilder('audit_log')
      .select('audit_log.userId', 'userId')
      .addSelect('COUNT(*)', 'count')
      .addSelect('MAX(audit_log.createdAt)', 'lastAttempt')
      .where('audit_log.action = :action', { action: AuditAction.ACCESS_DENIED })
      .andWhere('audit_log.createdAt >= :startDate', { startDate })
      .andWhere('audit_log.userId IS NOT NULL');

    if (tenantId) {
      failedAttemptsQuery.andWhere('audit_log.tenantId = :tenantId', { tenantId });
    }

    const multipleFailedAttempts = await failedAttemptsQuery
      .groupBy('audit_log.userId')
      .having('COUNT(*) >= 5') // 5 or more failed attempts
      .getRawMany();

    // Unusual permission changes (multiple changes in short time)
    const permissionChangesQuery = this.auditLogRepository.createQueryBuilder('audit_log')
      .where('audit_log.action IN (:...actions)', {
        actions: [AuditAction.PERMISSION_GRANTED, AuditAction.PERMISSION_REVOKED],
      })
      .andWhere('audit_log.createdAt >= :startDate', { startDate });

    if (tenantId) {
      permissionChangesQuery.andWhere('audit_log.tenantId = :tenantId', { tenantId });
    }

    const unusualPermissionChanges = await permissionChangesQuery
      .orderBy('audit_log.createdAt', 'DESC')
      .getMany();

    // Cross-tenant attempts (if we can detect them)
    const crossTenantQuery = this.auditLogRepository.createQueryBuilder('audit_log')
      .where('audit_log.action = :action', { action: AuditAction.ACCESS_DENIED })
      .andWhere('audit_log.errorMessage ILIKE :error', { error: '%tenant%' })
      .andWhere('audit_log.createdAt >= :startDate', { startDate });

    if (tenantId) {
      crossTenantQuery.andWhere('audit_log.tenantId = :tenantId', { tenantId });
    }

    const crossTenantAttempts = await crossTenantQuery
      .orderBy('audit_log.createdAt', 'DESC')
      .getMany();

    return {
      multipleFailedAttempts,
      unusualPermissionChanges,
      crossTenantAttempts,
    };
  }
}