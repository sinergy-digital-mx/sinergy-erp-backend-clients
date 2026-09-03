"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DataCleanupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataCleanupService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const config_1 = require("@nestjs/config");
const tenant_entity_1 = require("../../../entities/rbac/tenant.entity");
const role_entity_1 = require("../../../entities/rbac/role.entity");
const permission_entity_1 = require("../../../entities/rbac/permission.entity");
const user_role_entity_1 = require("../../../entities/rbac/user-role.entity");
const role_permission_entity_1 = require("../../../entities/rbac/role-permission.entity");
const audit_log_entity_1 = require("../../../entities/rbac/audit-log.entity");
const user_entity_1 = require("../../../entities/users/user.entity");
const audit_log_service_1 = require("./audit-log.service");
const error_utils_1 = require("../errors/error-utils");
let DataCleanupService = DataCleanupService_1 = class DataCleanupService {
    tenantRepository;
    roleRepository;
    permissionRepository;
    userRoleRepository;
    rolePermissionRepository;
    auditLogRepository;
    userRepository;
    dataSource;
    auditLogService;
    configService;
    logger = new common_1.Logger(DataCleanupService_1.name);
    isCleanupRunning = false;
    lastCleanupResult = null;
    lastIntegrityCheck = null;
    constructor(tenantRepository, roleRepository, permissionRepository, userRoleRepository, rolePermissionRepository, auditLogRepository, userRepository, dataSource, auditLogService, configService) {
        this.tenantRepository = tenantRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.userRoleRepository = userRoleRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.dataSource = dataSource;
        this.auditLogService = auditLogService;
        this.configService = configService;
    }
    async performCleanup(options = {}) {
        if (this.isCleanupRunning) {
            throw new Error('Cleanup operation is already running');
        }
        const startTime = Date.now();
        this.isCleanupRunning = true;
        const { dryRun = false, batchSize = 1000, cleanupUserRoles = true, cleanupRolePermissions = true, cleanupUnusedRoles = true, cleanupUnusedPermissions = true, cleanupEmptyTenants = false, cleanupOldAuditLogs = false, auditLogRetentionDays = 365, tenantId, } = options;
        this.logger.log(`Starting data cleanup${dryRun ? ' (DRY RUN)' : ''} with options: ${JSON.stringify(options)}`);
        const result = {
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
            if (cleanupUserRoles) {
                await this.cleanupOrphanedUserRoles(queryRunner, result, tenantId, batchSize, dryRun);
            }
            if (cleanupRolePermissions) {
                await this.cleanupOrphanedRolePermissions(queryRunner, result, tenantId, batchSize, dryRun);
            }
            if (cleanupUnusedRoles) {
                await this.cleanupUnusedRoles(queryRunner, result, tenantId, batchSize, dryRun);
            }
            if (cleanupUnusedPermissions) {
                await this.cleanupUnusedPermissions(queryRunner, result, batchSize, dryRun);
            }
            if (cleanupEmptyTenants) {
                await this.cleanupEmptyTenants(queryRunner, result, batchSize, dryRun);
            }
            if (cleanupOldAuditLogs) {
                await this.cleanupOldAuditLogs(queryRunner, result, auditLogRetentionDays, tenantId, batchSize, dryRun);
            }
            if (!dryRun) {
                await queryRunner.commitTransaction();
                this.logger.log('Cleanup transaction committed successfully');
            }
            else {
                this.logger.log('Dry run completed - no changes made');
            }
            try {
                await this.auditLogService.createAuditLog({
                    action: 'SYSTEM_EVENT',
                    result: audit_log_service_1.AuditResult.SUCCESS,
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
            }
            catch (auditError) {
                this.logger.warn(`Failed to log cleanup audit event: ${auditError.message}`);
                result.warnings.push(`Failed to log audit event: ${auditError.message}`);
            }
        }
        catch (error) {
            if (!dryRun) {
                await queryRunner.rollbackTransaction();
                this.logger.error('Cleanup transaction rolled back due to error');
            }
            result.errors.push(`Cleanup failed: ${error.message}`);
            try {
                await this.auditLogService.createAuditLog({
                    action: 'SYSTEM_EVENT',
                    result: audit_log_service_1.AuditResult.FAILURE,
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
            }
            catch (auditError) {
                this.logger.warn(`Failed to log cleanup failure audit event: ${auditError.message}`);
            }
            throw error_utils_1.RBACErrorUtils.throwSystemError('DataCleanupService', 'performCleanup', error);
        }
        finally {
            await queryRunner.release();
            result.executionTime = Date.now() - startTime;
            this.isCleanupRunning = false;
            this.lastCleanupResult = result;
        }
        this.logger.log(`Data cleanup completed in ${result.executionTime}ms`);
        return result;
    }
    async performIntegrityCheck(tenantId) {
        this.logger.log(`Starting data integrity check${tenantId ? ` for tenant ${tenantId}` : ''}`);
        const result = {
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
            await this.collectPerformanceMetrics(result, tenantId);
            await this.checkOrphanedData(result, tenantId);
            await this.checkMissingReferences(result, tenantId);
            await this.checkDuplicateData(result, tenantId);
            await this.checkConstraintViolations(result, tenantId);
            await this.checkPerformanceIssues(result, tenantId);
            this.generateRecommendations(result);
            result.isHealthy = !result.issues.some(issue => issue.severity === 'critical' || issue.severity === 'high');
            this.lastIntegrityCheck = result;
            this.logger.log(`Data integrity check completed: ${result.isHealthy ? 'HEALTHY' : 'ISSUES FOUND'} (${result.issues.length} issues)`);
        }
        catch (error) {
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
    getLastCleanupResult() {
        return this.lastCleanupResult;
    }
    getLastIntegrityCheck() {
        return this.lastIntegrityCheck;
    }
    isCleanupInProgress() {
        return this.isCleanupRunning;
    }
    getMaintenanceSchedule() {
        return {
            enabled: this.configService.get('RBAC_CLEANUP_ENABLED', 'false') === 'true',
            schedule: this.configService.get('RBAC_CLEANUP_SCHEDULE', '0 2 * * 0'),
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
    async scheduledCleanup() {
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
            if (schedule.notifyOnCompletion && schedule.notificationEmails.length > 0) {
                await this.sendCleanupNotification(result, schedule.notificationEmails);
            }
        }
        catch (error) {
            this.logger.error(`Scheduled cleanup failed: ${error.message}`);
            if (schedule.notifyOnCompletion && schedule.notificationEmails.length > 0) {
                await this.sendCleanupFailureNotification(error, schedule.notificationEmails);
            }
        }
    }
    async scheduledIntegrityCheck() {
        const enabled = this.configService.get('RBAC_INTEGRITY_CHECK_ENABLED', 'true') === 'true';
        if (!enabled) {
            this.logger.debug('Scheduled integrity check is disabled');
            return;
        }
        this.logger.log('Starting scheduled data integrity check');
        try {
            const result = await this.performIntegrityCheck();
            this.logger.log(`Scheduled integrity check completed: ${result.isHealthy ? 'HEALTHY' : 'ISSUES FOUND'} (${result.issues.length} issues)`);
            const criticalIssues = result.issues.filter(issue => issue.severity === 'critical');
            if (criticalIssues.length > 0) {
                this.logger.error(`Found ${criticalIssues.length} critical integrity issues:`);
                criticalIssues.forEach(issue => {
                    this.logger.error(`- ${issue.description} (${issue.affectedCount} affected)`);
                });
            }
        }
        catch (error) {
            this.logger.error(`Scheduled integrity check failed: ${error.message}`);
        }
    }
    async cleanupOrphanedUserRoles(queryRunner, result, tenantId, batchSize, dryRun) {
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
                for (let i = 0; i < orphanedUserRoles.length; i += batchSize) {
                    const batch = orphanedUserRoles.slice(i, i + batchSize);
                    await queryRunner.manager.remove(user_role_entity_1.UserRole, batch);
                }
            }
            const action = `${dryRun ? '[DRY RUN] ' : ''}Removed ${orphanedUserRoles.length} orphaned user role assignments`;
            result.actions.push(action);
            this.logger.debug(action);
        }
    }
    async cleanupOrphanedRolePermissions(queryRunner, result, tenantId, batchSize, dryRun) {
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
                    await queryRunner.manager.remove(role_permission_entity_1.RolePermission, batch);
                }
            }
            const action = `${dryRun ? '[DRY RUN] ' : ''}Removed ${orphanedRolePermissions.length} orphaned role permission assignments`;
            result.actions.push(action);
            this.logger.debug(action);
        }
    }
    async cleanupUnusedRoles(queryRunner, result, tenantId, batchSize, dryRun) {
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
                    await queryRunner.manager.remove(role_entity_1.Role, batch);
                }
            }
            const action = `${dryRun ? '[DRY RUN] ' : ''}Removed ${unusedRoles.length} unused roles`;
            result.actions.push(action);
            this.logger.debug(action);
        }
    }
    async cleanupUnusedPermissions(queryRunner, result, batchSize, dryRun) {
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
                    await queryRunner.manager.remove(permission_entity_1.Permission, batch);
                }
            }
            const action = `${dryRun ? '[DRY RUN] ' : ''}Removed ${unusedPermissions.length} unused permissions`;
            result.actions.push(action);
            this.logger.debug(action);
        }
    }
    async cleanupEmptyTenants(queryRunner, result, batchSize, dryRun) {
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
            result.warnings.push(`Found ${emptyTenants.length} empty tenants. Consider manual review before deletion.`);
            if (!dryRun) {
                for (let i = 0; i < emptyTenants.length; i += batchSize) {
                    const batch = emptyTenants.slice(i, i + batchSize);
                    await queryRunner.manager.remove(tenant_entity_1.RBACTenant, batch);
                }
            }
            const action = `${dryRun ? '[DRY RUN] ' : ''}Removed ${emptyTenants.length} empty tenants`;
            result.actions.push(action);
            this.logger.debug(action);
        }
    }
    async cleanupOldAuditLogs(queryRunner, result, retentionDays, tenantId, batchSize, dryRun) {
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
                    await queryRunner.manager.remove(audit_log_entity_1.AuditLog, batch);
                }
            }
            const action = `${dryRun ? '[DRY RUN] ' : ''}Removed ${oldAuditLogs.length} old audit logs (older than ${retentionDays} days)`;
            result.actions.push(action);
            this.logger.debug(action);
        }
    }
    async collectPerformanceMetrics(result, tenantId) {
        const metrics = result.performance;
        if (tenantId) {
            metrics.totalTenants = 1;
            metrics.totalRoles = await this.roleRepository.count({ where: { tenant_id: tenantId } });
            metrics.totalUserRoles = await this.userRoleRepository.count({ where: { tenant_id: tenantId } });
            const uniqueUsersResult = await this.userRoleRepository
                .createQueryBuilder('ur')
                .select('COUNT(DISTINCT ur.user_id)', 'count')
                .where('ur.tenant_id = :tenantId', { tenantId })
                .getRawOne();
            metrics.totalUsers = parseInt(uniqueUsersResult?.count || '0', 10);
        }
        else {
            metrics.totalUsers = await this.userRepository.count();
            metrics.totalRoles = await this.roleRepository.count();
            metrics.totalUserRoles = await this.userRoleRepository.count();
            metrics.totalTenants = await this.tenantRepository.count();
        }
        metrics.totalPermissions = await this.permissionRepository.count();
        metrics.totalRolePermissions = await this.rolePermissionRepository.count();
        metrics.averageRolesPerUser = metrics.totalUsers > 0 ? metrics.totalUserRoles / metrics.totalUsers : 0;
        metrics.averagePermissionsPerRole = metrics.totalRoles > 0 ? metrics.totalRolePermissions / metrics.totalRoles : 0;
    }
    async checkOrphanedData(result, tenantId) {
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
    async checkMissingReferences(result, tenantId) {
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
    async checkDuplicateData(result, tenantId) {
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
    async checkConstraintViolations(result, tenantId) {
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
    async checkPerformanceIssues(result, tenantId) {
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
        const oldAuditLogsCount = await this.auditLogRepository
            .createQueryBuilder('audit_log')
            .where('audit_log.created_at < :cutoffDate', {
            cutoffDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
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
    generateRecommendations(result) {
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
    async sendCleanupNotification(result, emails) {
        this.logger.log(`Would send cleanup notification to: ${emails.join(', ')}`);
        this.logger.log(`Cleanup summary: ${JSON.stringify(result.statistics)}`);
    }
    async sendCleanupFailureNotification(error, emails) {
        this.logger.error(`Would send cleanup failure notification to: ${emails.join(', ')}`);
        this.logger.error(`Cleanup error: ${error.message}`);
    }
};
exports.DataCleanupService = DataCleanupService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_WEEK, {
        name: 'rbac-data-cleanup',
        timeZone: 'UTC',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DataCleanupService.prototype, "scheduledCleanup", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_3AM, {
        name: 'rbac-integrity-check',
        timeZone: 'UTC',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DataCleanupService.prototype, "scheduledIntegrityCheck", null);
exports.DataCleanupService = DataCleanupService = DataCleanupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tenant_entity_1.RBACTenant)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(2, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __param(3, (0, typeorm_1.InjectRepository)(user_role_entity_1.UserRole)),
    __param(4, (0, typeorm_1.InjectRepository)(role_permission_entity_1.RolePermission)),
    __param(5, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __param(6, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        audit_log_service_1.AuditLogService,
        config_1.ConfigService])
], DataCleanupService);
//# sourceMappingURL=data-cleanup.service.js.map