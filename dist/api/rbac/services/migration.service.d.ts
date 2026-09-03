import { Repository, DataSource } from 'typeorm';
import { User } from '../../../entities/users/user.entity';
import { UserRole } from '../../../entities/rbac/user-role.entity';
import { Role } from '../../../entities/rbac/role.entity';
import { RBACTenant } from '../../../entities/rbac/tenant.entity';
import { RoleTemplateService } from './role-template.service';
import { AuditLogService } from './audit-log.service';
export interface MigrationOptions {
    defaultRoleName?: string;
    createMissingTenants?: boolean;
    skipExistingRoles?: boolean;
    batchSize?: number;
    dryRun?: boolean;
}
export interface MigrationResult {
    totalUsers: number;
    migratedUsers: number;
    skippedUsers: number;
    failedUsers: number;
    failures: Array<{
        userId: string;
        email: string | null;
        error: string;
    }>;
    successes: Array<{
        userId: string;
        email: string | null;
        tenantId: string;
        assignedRole: string;
    }>;
    executionTime: number;
}
export interface RollbackOptions {
    tenantId?: string;
    userIds?: string[];
    afterDate?: Date;
    beforeDate?: Date;
    batchSize?: number;
    dryRun?: boolean;
    preserveSystemRoles?: boolean;
}
export interface RollbackResult {
    totalRolesRemoved: number;
    usersAffected: number;
    failures: Array<{
        userId: string;
        error: string;
    }>;
    successes: Array<{
        userId: string;
        email: string | null;
        rolesRemoved: number;
    }>;
    executionTime: number;
    dryRun: boolean;
}
export interface ValidationResult {
    totalUsers: number;
    usersWithRoles: number;
    usersWithoutRoles: number;
    orphanedRoles: number;
    invalidRoleAssignments: number;
    crossTenantViolations: number;
    validationErrors: Array<{
        userId: string;
        email: string | null;
        issue: string;
        severity: 'error' | 'warning';
    }>;
    isValid: boolean;
    recommendations: string[];
}
export declare class MigrationService {
    private userRepository;
    private userRoleRepository;
    private roleRepository;
    private tenantRepository;
    private dataSource;
    private roleTemplateService;
    private auditLogService;
    private readonly logger;
    constructor(userRepository: Repository<User>, userRoleRepository: Repository<UserRole>, roleRepository: Repository<Role>, tenantRepository: Repository<RBACTenant>, dataSource: DataSource, roleTemplateService: RoleTemplateService, auditLogService: AuditLogService);
    migrateUsersToRBAC(options?: MigrationOptions): Promise<MigrationResult>;
    private migrateUser;
    private createRBACTenantFromLegacy;
    private determineUserRole;
    rollbackMigration(options?: RollbackOptions): Promise<RollbackResult>;
    validateMigration(tenantId?: string): Promise<ValidationResult>;
    getMigrationStatus(): Promise<{
        totalUsers: number;
        usersWithRoles: number;
        usersWithoutRoles: number;
        totalRoles: number;
        totalTenants: number;
        migrationProgress: number;
    }>;
    previewRollback(options?: RollbackOptions): Promise<{
        usersAffected: number;
        rolesAffected: number;
        tenantBreakdown: Array<{
            tenantId: string;
            tenantName: string;
            usersAffected: number;
            rolesAffected: number;
        }>;
        userBreakdown: Array<{
            userId: string;
            email: string | null;
            rolesAffected: number;
            roleNames: string[];
        }>;
    }>;
    cleanupOrphanedData(dryRun?: boolean): Promise<{
        orphanedUserRoles: number;
        orphanedRoles: number;
        orphanedTenants: number;
        cleanupActions: string[];
    }>;
}
