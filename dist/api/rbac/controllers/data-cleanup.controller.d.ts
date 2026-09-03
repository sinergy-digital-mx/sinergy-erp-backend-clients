import { DataCleanupService, CleanupResult, IntegrityCheckResult, MaintenanceSchedule } from '../services/data-cleanup.service';
import { TenantContextService } from '../services/tenant-context.service';
declare class CleanupOptionsDto {
    dryRun?: boolean;
    batchSize?: number;
    cleanupUserRoles?: boolean;
    cleanupRolePermissions?: boolean;
    cleanupUnusedRoles?: boolean;
    cleanupUnusedPermissions?: boolean;
    cleanupEmptyTenants?: boolean;
    cleanupOldAuditLogs?: boolean;
    auditLogRetentionDays?: number;
    tenantId?: string;
}
declare class IntegrityCheckDto {
    tenantId?: string;
}
export declare class DataCleanupController {
    private readonly dataCleanupService;
    private readonly tenantContextService;
    constructor(dataCleanupService: DataCleanupService, tenantContextService: TenantContextService);
    performCleanup(options: CleanupOptionsDto): Promise<CleanupResult>;
    performIntegrityCheck(options: IntegrityCheckDto): Promise<IntegrityCheckResult>;
    getLastCleanupResult(): Promise<CleanupResult | null>;
    getLastIntegrityCheck(): Promise<IntegrityCheckResult | null>;
    getCleanupStatus(): Promise<{
        isRunning: boolean;
        lastCleanupAt: Date | null;
        lastIntegrityCheckAt: Date | null;
    }>;
    getMaintenanceSchedule(): Promise<MaintenanceSchedule>;
    previewCleanup(options: CleanupOptionsDto): Promise<{
        wouldCleanup: CleanupResult['statistics'];
        estimatedExecutionTime: string;
        recommendations: string[];
        warnings: string[];
    }>;
    getSystemHealth(tenantId?: string): Promise<{
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
    }>;
    private validateCleanupOptions;
}
export {};
