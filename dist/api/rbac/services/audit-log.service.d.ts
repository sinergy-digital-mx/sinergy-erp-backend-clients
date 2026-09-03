import { Repository } from 'typeorm';
import { AuditLog, AuditAction, AuditResult } from '../../../entities/rbac/audit-log.entity';
import { TenantContextService } from './tenant-context.service';
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
export declare class AuditLogService {
    private auditLogRepository;
    private tenantContextService;
    private readonly logger;
    constructor(auditLogRepository: Repository<AuditLog>, tenantContextService: TenantContextService);
    createAuditLog(data: CreateAuditLogDto): Promise<AuditLog>;
    logPermissionChange(action: AuditAction.PERMISSION_GRANTED | AuditAction.PERMISSION_REVOKED, userId: string, actorId: string, permissionId: string, entityType: string, permissionAction: string, tenantId?: string, metadata?: Record<string, any>): Promise<AuditLog>;
    logRoleAssignment(action: AuditAction.ROLE_ASSIGNED | AuditAction.ROLE_UNASSIGNED, userId: string, actorId: string, roleId: string, tenantId?: string, metadata?: Record<string, any>): Promise<AuditLog>;
    logAccessAttempt(granted: boolean, userId: string, entityType: string, permissionAction: string, resourceId?: string, tenantId?: string, errorMessage?: string, ipAddress?: string, userAgent?: string, metadata?: Record<string, any>): Promise<AuditLog>;
    logRoleManagement(action: AuditAction.ROLE_CREATED | AuditAction.ROLE_UPDATED | AuditAction.ROLE_DELETED, actorId: string, roleId: string, tenantId?: string, details?: string, metadata?: Record<string, any>): Promise<AuditLog>;
    logPermissionManagement(action: AuditAction.PERMISSION_CREATED | AuditAction.PERMISSION_UPDATED | AuditAction.PERMISSION_DELETED, actorId: string, permissionId: string, entityType: string, permissionAction: string, tenantId?: string, details?: string, metadata?: Record<string, any>): Promise<AuditLog>;
    logTenantManagement(action: AuditAction.TENANT_CREATED | AuditAction.TENANT_UPDATED | AuditAction.TENANT_DELETED, actorId: string, tenantId: string, details?: string, metadata?: Record<string, any>): Promise<AuditLog>;
    queryAuditLogs(options?: AuditLogQueryOptions): Promise<{
        logs: AuditLog[];
        total: number;
    }>;
    getUserAuditLogs(userId: string, tenantId?: string, limit?: number, offset?: number): Promise<{
        logs: AuditLog[];
        total: number;
    }>;
    getRoleAuditLogs(roleId: string, tenantId?: string, limit?: number, offset?: number): Promise<{
        logs: AuditLog[];
        total: number;
    }>;
    getAuditLogsByDateRange(startDate: Date, endDate: Date, tenantId?: string, limit?: number, offset?: number): Promise<{
        logs: AuditLog[];
        total: number;
    }>;
    getFailedAccessAttempts(tenantId?: string, hours?: number, limit?: number): Promise<{
        logs: AuditLog[];
        total: number;
    }>;
    getPermissionChanges(tenantId?: string, days?: number, limit?: number): Promise<{
        logs: AuditLog[];
        total: number;
    }>;
    getAuditStatistics(tenantId?: string, days?: number): Promise<{
        totalLogs: number;
        successfulActions: number;
        failedActions: number;
        actionBreakdown: Record<string, number>;
        userActivity: Record<string, number>;
        dailyActivity: Array<{
            date: string;
            count: number;
        }>;
    }>;
    searchAuditLogs(searchTerm: string, tenantId?: string, limit?: number, offset?: number): Promise<{
        logs: AuditLog[];
        total: number;
    }>;
    getComplianceExport(startDate: Date, endDate: Date, tenantId?: string, actions?: AuditAction[]): Promise<AuditLog[]>;
    getUserRecentActivity(userId: string, tenantId?: string, hours?: number, limit?: number): Promise<AuditLog[]>;
    getSuspiciousActivity(tenantId?: string, hours?: number): Promise<{
        multipleFailedAttempts: Array<{
            userId: string;
            count: number;
            lastAttempt: Date;
        }>;
        unusualPermissionChanges: AuditLog[];
        crossTenantAttempts: AuditLog[];
    }>;
}
