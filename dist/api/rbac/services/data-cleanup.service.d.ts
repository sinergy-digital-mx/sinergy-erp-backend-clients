import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { RBACTenant } from '../../../entities/rbac/tenant.entity';
import { Role } from '../../../entities/rbac/role.entity';
import { Permission } from '../../../entities/rbac/permission.entity';
import { UserRole } from '../../../entities/rbac/user-role.entity';
import { RolePermission } from '../../../entities/rbac/role-permission.entity';
import { AuditLog } from '../../../entities/rbac/audit-log.entity';
import { User } from '../../../entities/users/user.entity';
import { AuditLogService } from './audit-log.service';
export interface CleanupOptions {
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
export interface CleanupResult {
    executionTime: number;
    dryRun: boolean;
    statistics: {
        orphanedUserRoles: number;
        orphanedRolePermissions: number;
        unusedRoles: number;
        unusedPermissions: number;
        emptyTenants: number;
        oldAuditLogs: number;
    };
    actions: string[];
    warnings: string[];
    errors: string[];
}
export interface IntegrityCheckResult {
    isHealthy: boolean;
    checkedAt: Date;
    issues: Array<{
        type: 'orphaned_data' | 'missing_reference' | 'duplicate_data' | 'constraint_violation' | 'performance_issue';
        severity: 'low' | 'medium' | 'high' | 'critical';
        description: string;
        affectedCount: number;
        recommendation: string;
        tenantId?: string;
    }>;
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
    recommendations: string[];
}
export interface MaintenanceSchedule {
    enabled: boolean;
    schedule: string;
    defaultOptions: CleanupOptions;
    notifyOnCompletion: boolean;
    notificationEmails: string[];
}
export declare class DataCleanupService {
    private tenantRepository;
    private roleRepository;
    private permissionRepository;
    private userRoleRepository;
    private rolePermissionRepository;
    private auditLogRepository;
    private userRepository;
    private dataSource;
    private auditLogService;
    private configService;
    private readonly logger;
    private isCleanupRunning;
    private lastCleanupResult;
    private lastIntegrityCheck;
    constructor(tenantRepository: Repository<RBACTenant>, roleRepository: Repository<Role>, permissionRepository: Repository<Permission>, userRoleRepository: Repository<UserRole>, rolePermissionRepository: Repository<RolePermission>, auditLogRepository: Repository<AuditLog>, userRepository: Repository<User>, dataSource: DataSource, auditLogService: AuditLogService, configService: ConfigService);
    performCleanup(options?: CleanupOptions): Promise<CleanupResult>;
    performIntegrityCheck(tenantId?: string): Promise<IntegrityCheckResult>;
    getLastCleanupResult(): CleanupResult | null;
    getLastIntegrityCheck(): IntegrityCheckResult | null;
    isCleanupInProgress(): boolean;
    getMaintenanceSchedule(): MaintenanceSchedule;
    scheduledCleanup(): Promise<void>;
    scheduledIntegrityCheck(): Promise<void>;
    private cleanupOrphanedUserRoles;
    private cleanupOrphanedRolePermissions;
    private cleanupUnusedRoles;
    private cleanupUnusedPermissions;
    private cleanupEmptyTenants;
    private cleanupOldAuditLogs;
    private collectPerformanceMetrics;
    private checkOrphanedData;
    private checkMissingReferences;
    private checkDuplicateData;
    private checkConstraintViolations;
    private checkPerformanceIssues;
    private generateRecommendations;
    private sendCleanupNotification;
    private sendCleanupFailureNotification;
}
