import { AuditLogService } from '../services/audit-log.service';
import { AuditAction, AuditResult } from '../../../entities/rbac/audit-log.entity';
import { TenantContextService } from '../services/tenant-context.service';
export declare class AuditLogQueryDto {
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
export declare class AuditLogController {
    private readonly auditLogService;
    private readonly tenantContextService;
    constructor(auditLogService: AuditLogService, tenantContextService: TenantContextService);
    getAuditLogs(userId?: string, actorId?: string, action?: AuditAction, result?: AuditResult, resourceType?: string, entityType?: string, startDate?: string, endDate?: string, limit?: number, offset?: number): Promise<{
        logs: import("../../../entities/rbac/audit-log.entity").AuditLog[];
        total: number;
    }>;
    getUserAuditLogs(userId: string, limit?: number, offset?: number): Promise<{
        logs: import("../../../entities/rbac/audit-log.entity").AuditLog[];
        total: number;
    }>;
    getRoleAuditLogs(roleId: string, limit?: number, offset?: number): Promise<{
        logs: import("../../../entities/rbac/audit-log.entity").AuditLog[];
        total: number;
    }>;
    getFailedAccessAttempts(hours?: number, limit?: number): Promise<{
        logs: import("../../../entities/rbac/audit-log.entity").AuditLog[];
        total: number;
    }>;
    getPermissionChanges(days?: number, limit?: number): Promise<{
        logs: import("../../../entities/rbac/audit-log.entity").AuditLog[];
        total: number;
    }>;
    getAuditLogsByDateRange(startDate: string, endDate: string, limit?: number, offset?: number): Promise<{
        logs: import("../../../entities/rbac/audit-log.entity").AuditLog[];
        total: number;
    }>;
    getSecuritySummary(hours?: number): Promise<{
        timeRange: string;
        failedAccessAttempts: {
            total: number;
            byUser: Record<string, number>;
            topUsers: {
                userId: string;
                count: number;
            }[];
        };
        permissionChanges: {
            total: number;
            byType: Record<string, number>;
        };
    }>;
    getAuditStatistics(days?: number): Promise<{
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
    searchAuditLogs(searchTerm: string, limit?: number, offset?: number): Promise<{
        logs: import("../../../entities/rbac/audit-log.entity").AuditLog[];
        total: number;
    }>;
    getComplianceExport(startDate: string, endDate: string, actions?: string): Promise<import("../../../entities/rbac/audit-log.entity").AuditLog[]>;
    getUserRecentActivity(userId: string, hours?: number, limit?: number): Promise<import("../../../entities/rbac/audit-log.entity").AuditLog[]>;
    getSuspiciousActivity(hours?: number): Promise<{
        multipleFailedAttempts: Array<{
            userId: string;
            count: number;
            lastAttempt: Date;
        }>;
        unusualPermissionChanges: import("../../../entities/rbac/audit-log.entity").AuditLog[];
        crossTenantAttempts: import("../../../entities/rbac/audit-log.entity").AuditLog[];
    }>;
}
