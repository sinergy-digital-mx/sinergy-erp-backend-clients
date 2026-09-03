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
var MigrationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../../entities/users/user.entity");
const user_role_entity_1 = require("../../../entities/rbac/user-role.entity");
const role_entity_1 = require("../../../entities/rbac/role.entity");
const tenant_entity_1 = require("../../../entities/rbac/tenant.entity");
const audit_log_entity_1 = require("../../../entities/rbac/audit-log.entity");
const role_template_service_1 = require("./role-template.service");
const audit_log_service_1 = require("./audit-log.service");
const error_utils_1 = require("../errors/error-utils");
let MigrationService = MigrationService_1 = class MigrationService {
    userRepository;
    userRoleRepository;
    roleRepository;
    tenantRepository;
    dataSource;
    roleTemplateService;
    auditLogService;
    logger = new common_1.Logger(MigrationService_1.name);
    constructor(userRepository, userRoleRepository, roleRepository, tenantRepository, dataSource, roleTemplateService, auditLogService) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.roleRepository = roleRepository;
        this.tenantRepository = tenantRepository;
        this.dataSource = dataSource;
        this.roleTemplateService = roleTemplateService;
        this.auditLogService = auditLogService;
    }
    async migrateUsersToRBAC(options = {}) {
        const startTime = Date.now();
        const { defaultRoleName = 'Viewer', createMissingTenants = true, skipExistingRoles = true, batchSize = 100, dryRun = false, } = options;
        this.logger.log(`Starting RBAC migration with options: ${JSON.stringify(options)}`);
        const result = {
            totalUsers: 0,
            migratedUsers: 0,
            skippedUsers: 0,
            failedUsers: 0,
            failures: [],
            successes: [],
            executionTime: 0,
        };
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            if (!dryRun) {
                await queryRunner.startTransaction();
            }
            const totalUsers = await this.userRepository.count();
            result.totalUsers = totalUsers;
            this.logger.log(`Found ${totalUsers} users to process`);
            for (let offset = 0; offset < totalUsers; offset += batchSize) {
                const users = await this.userRepository.find({
                    take: batchSize,
                    skip: offset,
                    relations: ['tenant'],
                });
                for (const user of users) {
                    try {
                        const migrationSuccess = await this.migrateUser(user, defaultRoleName, createMissingTenants, skipExistingRoles, queryRunner, dryRun);
                        if (migrationSuccess.skipped) {
                            result.skippedUsers++;
                        }
                        else if (migrationSuccess.success) {
                            result.migratedUsers++;
                            result.successes.push({
                                userId: user.id,
                                email: user.email,
                                tenantId: migrationSuccess.tenantId,
                                assignedRole: migrationSuccess.roleName,
                            });
                        }
                    }
                    catch (error) {
                        result.failedUsers++;
                        result.failures.push({
                            userId: user.id,
                            email: user.email,
                            error: error.message,
                        });
                        this.logger.error(`Failed to migrate user ${user.email}: ${error.message}`);
                    }
                }
                this.logger.log(`Processed batch ${Math.floor(offset / batchSize) + 1}/${Math.ceil(totalUsers / batchSize)}`);
            }
            if (!dryRun) {
                await queryRunner.commitTransaction();
                this.logger.log('Migration transaction committed successfully');
            }
            else {
                this.logger.log('Dry run completed - no changes made');
            }
            try {
                await this.auditLogService.createAuditLog({
                    action: audit_log_entity_1.AuditAction.TENANT_CREATED,
                    result: audit_log_entity_1.AuditResult.SUCCESS,
                    actorId: 'system',
                    tenantId: undefined,
                    resourceType: 'migration',
                    resourceId: 'rbac-migration',
                    details: JSON.stringify({
                        event: 'RBAC_MIGRATION_COMPLETED',
                        totalUsers: result.totalUsers,
                        migratedUsers: result.migratedUsers,
                        skippedUsers: result.skippedUsers,
                        failedUsers: result.failedUsers,
                        dryRun,
                    }),
                });
            }
            catch (auditError) {
                this.logger.warn(`Failed to log migration audit event: ${auditError.message}`);
            }
        }
        catch (error) {
            if (!dryRun) {
                await queryRunner.rollbackTransaction();
                this.logger.error('Migration transaction rolled back due to error');
            }
            try {
                await this.auditLogService.createAuditLog({
                    action: audit_log_entity_1.AuditAction.TENANT_CREATED,
                    result: audit_log_entity_1.AuditResult.FAILURE,
                    actorId: 'system',
                    tenantId: undefined,
                    resourceType: 'migration',
                    resourceId: 'rbac-migration',
                    details: JSON.stringify({
                        event: 'RBAC_MIGRATION_FAILED',
                        error: error.message,
                        dryRun,
                    }),
                    errorMessage: error.message,
                });
            }
            catch (auditError) {
                this.logger.warn(`Failed to log migration failure audit event: ${auditError.message}`);
            }
            throw error_utils_1.RBACErrorUtils.throwSystemError('MigrationService', 'migrateUsersToRBAC', error);
        }
        finally {
            await queryRunner.release();
            result.executionTime = Date.now() - startTime;
        }
        this.logger.log(`Migration completed in ${result.executionTime}ms`);
        return result;
    }
    async migrateUser(user, defaultRoleName, createMissingTenants, skipExistingRoles, queryRunner, dryRun) {
        if (skipExistingRoles) {
            const existingRoles = await this.userRoleRepository.count({
                where: { user_id: user.id },
            });
            if (existingRoles > 0) {
                this.logger.debug(`Skipping user ${user.email} - already has RBAC roles`);
                return { success: false, skipped: true };
            }
        }
        let rbacTenant = await this.tenantRepository.findOne({
            where: { legacy_tenant_id: user.tenant?.id?.toString() },
        });
        if (!rbacTenant && createMissingTenants && user.tenant) {
            if (!dryRun) {
                rbacTenant = await this.createRBACTenantFromLegacy(user.tenant, queryRunner);
            }
            else {
                rbacTenant = {
                    id: 'dry-run-tenant-id',
                    name: `Tenant for ${user.tenant.id}`,
                    subdomain: `tenant-${user.tenant.id}`,
                    legacy_tenant_id: user.tenant.id,
                };
            }
        }
        if (!rbacTenant) {
            throw new Error(`No RBAC tenant found for user ${user.email}`);
        }
        const roleName = await this.determineUserRole(user, defaultRoleName);
        let role = await this.roleRepository.findOne({
            where: {
                name: roleName,
                tenant_id: rbacTenant.id,
            },
        });
        if (!role && !dryRun) {
            try {
                const roleResult = await this.roleTemplateService.createRoleFromSystemTemplate(roleName, rbacTenant.id, true);
                role = roleResult.role;
            }
            catch (error) {
                this.logger.warn(`Could not create role ${roleName} from system template: ${error.message}`);
                throw new Error(`Could not create role ${roleName} for tenant ${rbacTenant.id}: ${error.message}`);
            }
        }
        if (!role && dryRun) {
            role = { id: 'dry-run-role-id', name: roleName };
        }
        if (!role) {
            throw new Error(`Could not find or create role ${roleName} for tenant ${rbacTenant.id}`);
        }
        if (!dryRun) {
            const userRole = queryRunner.manager.create(user_role_entity_1.UserRole, {
                user_id: user.id,
                role_id: role.id,
                tenant_id: rbacTenant.id,
            });
            await queryRunner.manager.save(user_role_entity_1.UserRole, userRole);
            this.logger.debug(`Assigned role ${roleName} to user ${user.email} in tenant ${rbacTenant.id}`);
        }
        return {
            success: true,
            skipped: false,
            tenantId: rbacTenant.id,
            roleName: roleName,
        };
    }
    async createRBACTenantFromLegacy(legacyTenant, queryRunner) {
        const rbacTenant = queryRunner.manager.create(tenant_entity_1.RBACTenant, {
            name: legacyTenant.name || `Tenant ${legacyTenant.id}`,
            subdomain: legacyTenant.subdomain || `tenant-${legacyTenant.id}`,
            legacy_tenant_id: legacyTenant.id?.toString(),
        });
        const savedTenant = await queryRunner.manager.save(tenant_entity_1.RBACTenant, rbacTenant);
        try {
            await this.roleTemplateService.createSystemRolesForTenant(savedTenant.id, true);
        }
        catch (error) {
            this.logger.warn(`Could not create system roles for tenant ${savedTenant.id}: ${error.message}`);
        }
        this.logger.debug(`Created RBAC tenant ${savedTenant.id} from legacy tenant ${legacyTenant.id}`);
        return savedTenant;
    }
    async determineUserRole(user, defaultRoleName) {
        const email = (user.email ?? '').toLowerCase();
        if (email.includes('admin') || email.includes('administrator')) {
            return 'Admin';
        }
        if (email.includes('operator') || email.includes('manager')) {
            return 'Operator';
        }
        if (user.last_login_at) {
            const daysSinceLogin = Math.floor((Date.now() - user.last_login_at.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceLogin <= 30) {
                return 'Operator';
            }
        }
        return defaultRoleName;
    }
    async rollbackMigration(options = {}) {
        const startTime = Date.now();
        const { tenantId, userIds, afterDate, beforeDate, batchSize = 100, dryRun = false, preserveSystemRoles = true, } = options;
        this.logger.log(`Starting RBAC migration rollback with options: ${JSON.stringify(options)}`);
        const result = {
            totalRolesRemoved: 0,
            usersAffected: 0,
            failures: [],
            successes: [],
            executionTime: 0,
            dryRun,
        };
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            if (!dryRun) {
                await queryRunner.startTransaction();
            }
            const userRoleQuery = this.userRoleRepository
                .createQueryBuilder('ur')
                .leftJoinAndSelect('ur.role', 'role')
                .leftJoinAndSelect('ur.user', 'user')
                .leftJoinAndSelect('ur.tenant', 'tenant');
            if (tenantId) {
                userRoleQuery.andWhere('ur.tenant_id = :tenantId', { tenantId });
            }
            if (userIds && userIds.length > 0) {
                userRoleQuery.andWhere('ur.user_id IN (:...userIds)', { userIds });
            }
            if (afterDate) {
                userRoleQuery.andWhere('ur.created_at >= :afterDate', { afterDate });
            }
            if (beforeDate) {
                userRoleQuery.andWhere('ur.created_at <= :beforeDate', { beforeDate });
            }
            if (preserveSystemRoles) {
                userRoleQuery.andWhere('role.is_system_role = :isSystemRole', { isSystemRole: false });
            }
            const userRoles = await userRoleQuery.getMany();
            result.totalRolesRemoved = userRoles.length;
            if (userRoles.length === 0) {
                this.logger.log('No user roles found matching rollback criteria');
                result.executionTime = Date.now() - startTime;
                return result;
            }
            const userRolesByUser = new Map();
            for (const userRole of userRoles) {
                const userId = userRole.user_id;
                if (!userRolesByUser.has(userId)) {
                    userRolesByUser.set(userId, []);
                }
                userRolesByUser.get(userId).push(userRole);
            }
            result.usersAffected = userRolesByUser.size;
            const userIds_array = Array.from(userRolesByUser.keys());
            for (let i = 0; i < userIds_array.length; i += batchSize) {
                const batchUserIds = userIds_array.slice(i, i + batchSize);
                for (const userId of batchUserIds) {
                    const userRolesToRemove = userRolesByUser.get(userId);
                    try {
                        if (!dryRun) {
                            const roleIds = userRolesToRemove.map(ur => ur.id);
                            await queryRunner.manager.delete(user_role_entity_1.UserRole, roleIds);
                        }
                        const user = userRolesToRemove[0].user;
                        result.successes.push({
                            userId,
                            email: user?.email || 'unknown',
                            rolesRemoved: userRolesToRemove.length,
                        });
                        this.logger.debug(`${dryRun ? '[DRY RUN] ' : ''}Removed ${userRolesToRemove.length} roles for user ${userId}`);
                    }
                    catch (error) {
                        result.failures.push({
                            userId,
                            error: error.message,
                        });
                        this.logger.error(`Failed to rollback user ${userId}: ${error.message}`);
                    }
                }
                this.logger.log(`${dryRun ? '[DRY RUN] ' : ''}Processed rollback batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(userIds_array.length / batchSize)}`);
            }
            if (!dryRun) {
                await queryRunner.commitTransaction();
                this.logger.log('Rollback transaction committed successfully');
            }
            else {
                this.logger.log('Dry run completed - no changes made');
            }
            try {
                await this.auditLogService.createAuditLog({
                    action: 'SYSTEM_EVENT',
                    result: audit_log_entity_1.AuditResult.SUCCESS,
                    actorId: 'system',
                    resourceType: 'migration',
                    resourceId: 'rbac-rollback',
                    tenantId: tenantId || undefined,
                    details: JSON.stringify({
                        event: dryRun ? 'RBAC_MIGRATION_ROLLBACK_DRY_RUN' : 'RBAC_MIGRATION_ROLLBACK_COMPLETED',
                        totalRolesRemoved: result.totalRolesRemoved,
                        usersAffected: result.usersAffected,
                        successCount: result.successes.length,
                        failureCount: result.failures.length,
                        options,
                    }),
                });
            }
            catch (auditError) {
                this.logger.warn(`Failed to log rollback audit event: ${auditError.message}`);
            }
        }
        catch (error) {
            if (!dryRun) {
                await queryRunner.rollbackTransaction();
                this.logger.error('Rollback transaction rolled back due to error');
            }
            try {
                await this.auditLogService.createAuditLog({
                    action: 'SYSTEM_EVENT',
                    result: audit_log_entity_1.AuditResult.FAILURE,
                    actorId: 'system',
                    resourceType: 'migration',
                    resourceId: 'rbac-rollback',
                    tenantId: tenantId || undefined,
                    details: JSON.stringify({
                        event: 'RBAC_MIGRATION_ROLLBACK_FAILED',
                        error: error.message,
                        options,
                    }),
                    errorMessage: error.message,
                });
            }
            catch (auditError) {
                this.logger.warn(`Failed to log rollback failure audit event: ${auditError.message}`);
            }
            throw error_utils_1.RBACErrorUtils.throwSystemError('MigrationService', 'rollbackMigration', error);
        }
        finally {
            await queryRunner.release();
            result.executionTime = Date.now() - startTime;
        }
        this.logger.log(`Migration rollback completed in ${result.executionTime}ms`);
        return result;
    }
    async validateMigration(tenantId) {
        this.logger.log(`Validating RBAC migration${tenantId ? ` for tenant ${tenantId}` : ''}`);
        const result = {
            totalUsers: 0,
            usersWithRoles: 0,
            usersWithoutRoles: 0,
            orphanedRoles: 0,
            invalidRoleAssignments: 0,
            crossTenantViolations: 0,
            validationErrors: [],
            isValid: true,
            recommendations: [],
        };
        const userQuery = this.userRepository.createQueryBuilder('user')
            .leftJoinAndSelect('user.tenant', 'tenant');
        if (tenantId) {
            userQuery.where('tenant.id = :tenantId', { tenantId });
        }
        const users = await userQuery.getMany();
        result.totalUsers = users.length;
        for (const user of users) {
            const userRoles = await this.userRoleRepository.find({
                where: { user_id: user.id },
                relations: ['role', 'tenant'],
            });
            if (userRoles.length === 0) {
                result.usersWithoutRoles++;
                result.validationErrors.push({
                    userId: user.id,
                    email: user.email,
                    issue: 'User has no RBAC role assignments',
                    severity: 'error',
                });
                result.isValid = false;
            }
            else {
                result.usersWithRoles++;
                for (const userRole of userRoles) {
                    if (!userRole.role) {
                        result.invalidRoleAssignments++;
                        result.validationErrors.push({
                            userId: user.id,
                            email: user.email,
                            issue: `User role ${userRole.id} references non-existent role`,
                            severity: 'error',
                        });
                        result.isValid = false;
                    }
                    if (!userRole.tenant) {
                        result.invalidRoleAssignments++;
                        result.validationErrors.push({
                            userId: user.id,
                            email: user.email,
                            issue: `User role ${userRole.id} references non-existent tenant`,
                            severity: 'error',
                        });
                        result.isValid = false;
                    }
                    if (user.tenant && userRole.tenant && user.tenant.id !== userRole.tenant.legacy_tenant_id) {
                        result.crossTenantViolations++;
                        result.validationErrors.push({
                            userId: user.id,
                            email: user.email,
                            issue: `User assigned to role in different tenant (user tenant: ${user.tenant.id}, role tenant: ${userRole.tenant.id})`,
                            severity: 'error',
                        });
                        result.isValid = false;
                    }
                    const duplicateRoles = userRoles.filter(ur => ur.role_id === userRole.role_id &&
                        ur.tenant_id === userRole.tenant_id &&
                        ur.id !== userRole.id);
                    if (duplicateRoles.length > 0) {
                        result.validationErrors.push({
                            userId: user.id,
                            email: user.email,
                            issue: `User has duplicate role assignments for role ${userRole.role?.name || userRole.role_id}`,
                            severity: 'warning',
                        });
                    }
                }
                if (userRoles.length > 5) {
                    result.validationErrors.push({
                        userId: user.id,
                        email: user.email,
                        issue: `User has ${userRoles.length} roles assigned - consider consolidating`,
                        severity: 'warning',
                    });
                }
            }
        }
        const orphanedRolesQuery = this.userRoleRepository
            .createQueryBuilder('ur')
            .leftJoin('users', 'u', 'u.id = ur.user_id')
            .where('u.id IS NULL');
        if (tenantId) {
            orphanedRolesQuery.andWhere('ur.tenant_id = :tenantId', { tenantId });
        }
        result.orphanedRoles = await orphanedRolesQuery.getCount();
        if (result.orphanedRoles > 0) {
            result.isValid = false;
            result.validationErrors.push({
                userId: 'system',
                email: 'system',
                issue: `Found ${result.orphanedRoles} orphaned user role assignments`,
                severity: 'error',
            });
        }
        if (result.usersWithoutRoles > 0) {
            result.recommendations.push(`${result.usersWithoutRoles} users need role assignments. Consider running migration again or manually assigning roles.`);
        }
        if (result.orphanedRoles > 0) {
            result.recommendations.push(`${result.orphanedRoles} orphaned role assignments should be cleaned up.`);
        }
        if (result.crossTenantViolations > 0) {
            result.recommendations.push(`${result.crossTenantViolations} cross-tenant violations detected. Review tenant assignments.`);
        }
        if (result.invalidRoleAssignments > 0) {
            result.recommendations.push(`${result.invalidRoleAssignments} invalid role assignments found. These should be corrected or removed.`);
        }
        const migrationCompleteness = result.totalUsers > 0 ? (result.usersWithRoles / result.totalUsers) * 100 : 0;
        if (migrationCompleteness < 100) {
            result.recommendations.push(`Migration is ${migrationCompleteness.toFixed(1)}% complete. Consider completing remaining users.`);
        }
        this.logger.log(`Migration validation completed: ${JSON.stringify({
            totalUsers: result.totalUsers,
            usersWithRoles: result.usersWithRoles,
            usersWithoutRoles: result.usersWithoutRoles,
            isValid: result.isValid,
            errorCount: result.validationErrors.filter(e => e.severity === 'error').length,
            warningCount: result.validationErrors.filter(e => e.severity === 'warning').length,
        })}`);
        return result;
    }
    async getMigrationStatus() {
        const [totalUsers, usersWithRoles, totalRoles, totalTenants] = await Promise.all([
            this.userRepository.count(),
            this.userRoleRepository
                .createQueryBuilder('ur')
                .select('COUNT(DISTINCT ur.user_id)', 'count')
                .getRawOne()
                .then(result => parseInt(result.count)),
            this.roleRepository.count(),
            this.tenantRepository.count(),
        ]);
        const usersWithoutRoles = totalUsers - usersWithRoles;
        const migrationProgress = totalUsers > 0 ? (usersWithRoles / totalUsers) * 100 : 0;
        return {
            totalUsers,
            usersWithRoles,
            usersWithoutRoles,
            totalRoles,
            totalTenants,
            migrationProgress: Math.round(migrationProgress * 100) / 100,
        };
    }
    async previewRollback(options = {}) {
        const { tenantId, userIds, afterDate, beforeDate, preserveSystemRoles = true, } = options;
        const userRoleQuery = this.userRoleRepository
            .createQueryBuilder('ur')
            .leftJoinAndSelect('ur.role', 'role')
            .leftJoinAndSelect('ur.user', 'user')
            .leftJoinAndSelect('ur.tenant', 'tenant');
        if (tenantId) {
            userRoleQuery.andWhere('ur.tenant_id = :tenantId', { tenantId });
        }
        if (userIds && userIds.length > 0) {
            userRoleQuery.andWhere('ur.user_id IN (:...userIds)', { userIds });
        }
        if (afterDate) {
            userRoleQuery.andWhere('ur.created_at >= :afterDate', { afterDate });
        }
        if (beforeDate) {
            userRoleQuery.andWhere('ur.created_at <= :beforeDate', { beforeDate });
        }
        if (preserveSystemRoles) {
            userRoleQuery.andWhere('role.is_system_role = :isSystemRole', { isSystemRole: false });
        }
        const userRoles = await userRoleQuery.getMany();
        const uniqueUserIds = new Set(userRoles.map(ur => ur.user_id));
        const tenantStats = new Map();
        const userStats = new Map();
        for (const userRole of userRoles) {
            const tenantKey = userRole.tenant_id;
            if (!tenantStats.has(tenantKey)) {
                tenantStats.set(tenantKey, {
                    tenantName: userRole.tenant?.name || 'Unknown',
                    users: new Set(),
                    roles: 0,
                });
            }
            const tenantStat = tenantStats.get(tenantKey);
            tenantStat.users.add(userRole.user_id);
            tenantStat.roles++;
            const userKey = userRole.user_id;
            if (!userStats.has(userKey)) {
                userStats.set(userKey, {
                    email: userRole.user?.email || 'Unknown',
                    roles: 0,
                    roleNames: [],
                });
            }
            const userStat = userStats.get(userKey);
            userStat.roles++;
            userStat.roleNames.push(userRole.role?.name || 'Unknown Role');
        }
        return {
            usersAffected: uniqueUserIds.size,
            rolesAffected: userRoles.length,
            tenantBreakdown: Array.from(tenantStats.entries()).map(([tenantId, stats]) => ({
                tenantId,
                tenantName: stats.tenantName,
                usersAffected: stats.users.size,
                rolesAffected: stats.roles,
            })),
            userBreakdown: Array.from(userStats.entries()).map(([userId, stats]) => ({
                userId,
                email: stats.email,
                rolesAffected: stats.roles,
                roleNames: stats.roleNames,
            })),
        };
    }
    async cleanupOrphanedData(dryRun = false) {
        const result = {
            orphanedUserRoles: 0,
            orphanedRoles: 0,
            orphanedTenants: 0,
            cleanupActions: [],
        };
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            if (!dryRun) {
                await queryRunner.startTransaction();
            }
            const orphanedUserRoles = await this.userRoleRepository
                .createQueryBuilder('ur')
                .leftJoin('users', 'u', 'u.id = ur.user_id')
                .where('u.id IS NULL')
                .getMany();
            result.orphanedUserRoles = orphanedUserRoles.length;
            if (orphanedUserRoles.length > 0) {
                if (!dryRun) {
                    await queryRunner.manager.remove(user_role_entity_1.UserRole, orphanedUserRoles);
                }
                result.cleanupActions.push((dryRun ? '[DRY RUN] ' : '') + `Removed ${orphanedUserRoles.length} orphaned user role assignments`);
            }
            const unusedRoles = await this.roleRepository
                .createQueryBuilder('role')
                .leftJoin('user_roles', 'ur', 'ur.role_id = role.id')
                .where('ur.id IS NULL')
                .andWhere('role.is_system_role = :isSystemRole', { isSystemRole: false })
                .getMany();
            result.orphanedRoles = unusedRoles.length;
            if (unusedRoles.length > 0) {
                if (!dryRun) {
                    await queryRunner.manager.remove(role_entity_1.Role, unusedRoles);
                }
                result.cleanupActions.push((dryRun ? '[DRY RUN] ' : '') + `Removed ${unusedRoles.length} unused roles`);
            }
            const unusedTenants = await this.tenantRepository
                .createQueryBuilder('tenant')
                .leftJoin('roles', 'r', 'r.tenant_id = tenant.id')
                .leftJoin('user_roles', 'ur', 'ur.tenant_id = tenant.id')
                .where('r.id IS NULL')
                .andWhere('ur.id IS NULL')
                .getMany();
            result.orphanedTenants = unusedTenants.length;
            if (unusedTenants.length > 0) {
                if (!dryRun) {
                    await queryRunner.manager.remove(tenant_entity_1.RBACTenant, unusedTenants);
                }
                result.cleanupActions.push((dryRun ? '[DRY RUN] ' : '') + `Removed ${unusedTenants.length} unused RBAC tenants`);
            }
            if (!dryRun) {
                await queryRunner.commitTransaction();
            }
        }
        catch (error) {
            if (!dryRun) {
                await queryRunner.rollbackTransaction();
            }
            error_utils_1.RBACErrorUtils.throwSystemError('MigrationService', 'cleanupOrphanedData', error);
        }
        finally {
            await queryRunner.release();
        }
        return result;
    }
};
exports.MigrationService = MigrationService;
exports.MigrationService = MigrationService = MigrationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(user_role_entity_1.UserRole)),
    __param(2, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(3, (0, typeorm_1.InjectRepository)(tenant_entity_1.RBACTenant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        role_template_service_1.RoleTemplateService,
        audit_log_service_1.AuditLogService])
], MigrationService);
//# sourceMappingURL=migration.service.js.map