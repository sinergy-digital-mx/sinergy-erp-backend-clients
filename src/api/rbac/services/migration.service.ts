/**
 * RBAC Migration Service
 * 
 * Handles migration of existing users to the new RBAC system.
 * Provides functionality to assign default roles, preserve access patterns,
 * and support rollback capabilities.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { User } from '../../../entities/users/user.entity';
import { UserRole } from '../../../entities/rbac/user-role.entity';
import { Role } from '../../../entities/rbac/role.entity';
import { RBACTenant } from '../../../entities/rbac/tenant.entity';
import { AuditAction, AuditResult } from '../../../entities/rbac/audit-log.entity';
import { RoleTemplateService } from './role-template.service';
import { AuditLogService } from './audit-log.service';
import { RBACErrorUtils } from '../errors/error-utils';

export interface MigrationOptions {
  /** Default role to assign to users if no specific pattern is detected */
  defaultRoleName?: string;
  /** Whether to create missing tenants during migration */
  createMissingTenants?: boolean;
  /** Whether to skip users that already have RBAC roles */
  skipExistingRoles?: boolean;
  /** Batch size for processing users */
  batchSize?: number;
  /** Whether to perform a dry run without making changes */
  dryRun?: boolean;
}

export interface MigrationResult {
  /** Total number of users processed */
  totalUsers: number;
  /** Number of users successfully migrated */
  migratedUsers: number;
  /** Number of users skipped */
  skippedUsers: number;
  /** Number of users that failed migration */
  failedUsers: number;
  /** Details of failed migrations */
  failures: Array<{
    userId: string;
    email: string;
    error: string;
  }>;
  /** Details of successful migrations */
  successes: Array<{
    userId: string;
    email: string;
    tenantId: string;
    assignedRole: string;
  }>;
  /** Migration execution time in milliseconds */
  executionTime: number;
}

export interface RollbackOptions {
  /** Specific tenant ID to rollback */
  tenantId?: string;
  /** Specific user IDs to rollback */
  userIds?: string[];
  /** Rollback migrations after this date */
  afterDate?: Date;
  /** Rollback migrations before this date */
  beforeDate?: Date;
  /** Batch size for processing rollbacks */
  batchSize?: number;
  /** Whether to perform a dry run without making changes */
  dryRun?: boolean;
  /** Whether to preserve system roles during rollback */
  preserveSystemRoles?: boolean;
}

export interface RollbackResult {
  /** Total number of user roles removed */
  totalRolesRemoved: number;
  /** Number of users affected */
  usersAffected: number;
  /** Details of rollback failures */
  failures: Array<{
    userId: string;
    error: string;
  }>;
  /** Details of successful rollbacks */
  successes: Array<{
    userId: string;
    email: string;
    rolesRemoved: number;
  }>;
  /** Rollback execution time in milliseconds */
  executionTime: number;
  /** Whether this was a dry run */
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
    email: string;
    issue: string;
    severity: 'error' | 'warning';
  }>;
  isValid: boolean;
  recommendations: string[];
}

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RBACTenant)
    private tenantRepository: Repository<RBACTenant>,
    private dataSource: DataSource,
    private roleTemplateService: RoleTemplateService,
    private auditLogService: AuditLogService,
  ) {}

  /**
   * Migrate existing users to the RBAC system
   * @param options - Migration configuration options
   * @returns Promise<MigrationResult> - Results of the migration
   */
  async migrateUsersToRBAC(options: MigrationOptions = {}): Promise<MigrationResult> {
    const startTime = Date.now();
    const {
      defaultRoleName = 'Viewer',
      createMissingTenants = true,
      skipExistingRoles = true,
      batchSize = 100,
      dryRun = false,
    } = options;

    this.logger.log(`Starting RBAC migration with options: ${JSON.stringify(options)}`);

    const result: MigrationResult = {
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

      // Get all users in batches
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
            const migrationSuccess = await this.migrateUser(
              user,
              defaultRoleName,
              createMissingTenants,
              skipExistingRoles,
              queryRunner,
              dryRun,
            );

            if (migrationSuccess.skipped) {
              result.skippedUsers++;
            } else if (migrationSuccess.success) {
              result.migratedUsers++;
              result.successes.push({
                userId: user.id,
                email: user.email,
                tenantId: migrationSuccess.tenantId!,
                assignedRole: migrationSuccess.roleName!,
              });
            }
          } catch (error) {
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
      } else {
        this.logger.log('Dry run completed - no changes made');
      }

      // Log audit entry for migration
      try {
        await this.auditLogService.createAuditLog({
          action: AuditAction.TENANT_CREATED, // Using closest available action
          result: AuditResult.SUCCESS,
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
      } catch (auditError) {
        this.logger.warn(`Failed to log migration audit event: ${auditError.message}`);
      }

    } catch (error) {
      if (!dryRun) {
        await queryRunner.rollbackTransaction();
        this.logger.error('Migration transaction rolled back due to error');
      }
      
      try {
        await this.auditLogService.createAuditLog({
          action: AuditAction.TENANT_CREATED,
          result: AuditResult.FAILURE,
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
      } catch (auditError) {
        this.logger.warn(`Failed to log migration failure audit event: ${auditError.message}`);
      }
      
      throw RBACErrorUtils.throwSystemError('MigrationService', 'migrateUsersToRBAC', error);
    } finally {
      await queryRunner.release();
      result.executionTime = Date.now() - startTime;
    }

    this.logger.log(`Migration completed in ${result.executionTime}ms`);
    return result;
  }

  /**
   * Migrate a single user to RBAC
   * @private
   */
  private async migrateUser(
    user: User,
    defaultRoleName: string,
    createMissingTenants: boolean,
    skipExistingRoles: boolean,
    queryRunner: QueryRunner,
    dryRun: boolean,
  ): Promise<{ success: boolean; skipped: boolean; tenantId?: string; roleName?: string }> {
    // Check if user already has RBAC roles
    if (skipExistingRoles) {
      const existingRoles = await this.userRoleRepository.count({
        where: { user_id: user.id },
      });

      if (existingRoles > 0) {
        this.logger.debug(`Skipping user ${user.email} - already has RBAC roles`);
        return { success: false, skipped: true };
      }
    }

    // Ensure tenant exists in RBAC system
    let rbacTenant = await this.tenantRepository.findOne({
      where: { legacy_tenant_id: user.tenant?.id?.toString() },
    });

    if (!rbacTenant && createMissingTenants && user.tenant) {
      if (!dryRun) {
        rbacTenant = await this.createRBACTenantFromLegacy(user.tenant, queryRunner);
      } else {
        // For dry run, simulate tenant creation
        rbacTenant = {
          id: 'dry-run-tenant-id',
          name: `Tenant for ${user.tenant.id}`,
          subdomain: `tenant-${user.tenant.id}`,
          legacy_tenant_id: user.tenant.id,
        } as any;
      }
    }

    if (!rbacTenant) {
      throw new Error(`No RBAC tenant found for user ${user.email}`);
    }

    // Determine appropriate role based on user's existing access patterns
    const roleName = await this.determineUserRole(user, defaultRoleName);

    // Find the role in the tenant
    let role = await this.roleRepository.findOne({
      where: {
        name: roleName,
        tenant_id: rbacTenant.id,
      },
    });

    if (!role && !dryRun) {
      // Create the role if it doesn't exist using system template
      try {
        const roleResult = await this.roleTemplateService.createRoleFromSystemTemplate(
          roleName,
          rbacTenant.id,
          true, // Skip if exists
        );
        role = roleResult.role;
      } catch (error) {
        this.logger.warn(`Could not create role ${roleName} from system template: ${error.message}`);
        // If system template fails, we'll need to handle this differently
        throw new Error(`Could not create role ${roleName} for tenant ${rbacTenant.id}: ${error.message}`);
      }
    }

    if (!role && dryRun) {
      // For dry run, simulate role existence
      role = { id: 'dry-run-role-id', name: roleName } as any;
    }

    if (!role) {
      throw new Error(`Could not find or create role ${roleName} for tenant ${rbacTenant.id}`);
    }

    // Assign role to user
    if (!dryRun) {
      const userRole = queryRunner.manager.create(UserRole, {
        user_id: user.id,
        role_id: role.id,
        tenant_id: rbacTenant.id,
      });

      await queryRunner.manager.save(UserRole, userRole);

      this.logger.debug(`Assigned role ${roleName} to user ${user.email} in tenant ${rbacTenant.id}`);
    }

    return {
      success: true,
      skipped: false,
      tenantId: rbacTenant.id,
      roleName: roleName,
    };
  }

  /**
   * Create RBAC tenant from legacy tenant
   * @private
   */
  private async createRBACTenantFromLegacy(
    legacyTenant: any,
    queryRunner: QueryRunner,
  ): Promise<RBACTenant> {
    const rbacTenant = queryRunner.manager.create(RBACTenant, {
      name: legacyTenant.name || `Tenant ${legacyTenant.id}`,
      subdomain: legacyTenant.subdomain || `tenant-${legacyTenant.id}`,
      legacy_tenant_id: legacyTenant.id?.toString(),
    });

    const savedTenant = await queryRunner.manager.save(RBACTenant, rbacTenant);

    // Create default roles for the new tenant
    try {
      await this.roleTemplateService.createSystemRolesForTenant(
        savedTenant.id,
        true, // Skip existing roles
      );
    } catch (error) {
      this.logger.warn(`Could not create system roles for tenant ${savedTenant.id}: ${error.message}`);
      // Continue with migration even if system roles fail
    }

    this.logger.debug(`Created RBAC tenant ${savedTenant.id} from legacy tenant ${legacyTenant.id}`);
    return savedTenant;
  }

  /**
   * Determine appropriate role for user based on existing access patterns
   * @private
   */
  private async determineUserRole(user: User, defaultRoleName: string): Promise<string> {
    // This is a simplified implementation. In a real scenario, you would
    // analyze the user's existing permissions, access history, or other
    // indicators to determine the most appropriate role.
    
    // For now, we'll use some basic heuristics:
    
    // Check if user email suggests admin role
    if (user.email.includes('admin') || user.email.includes('administrator')) {
      return 'Admin';
    }

    // Check if user email suggests operator role
    if (user.email.includes('operator') || user.email.includes('manager')) {
      return 'Operator';
    }

    // Check user's last login to determine activity level
    if (user.last_login_at) {
      const daysSinceLogin = Math.floor(
        (Date.now() - user.last_login_at.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Active users (logged in within 30 days) get Operator role
      if (daysSinceLogin <= 30) {
        return 'Operator';
      }
    }

    // Default to the specified default role
    return defaultRoleName;
  }

  /**
   * Rollback RBAC migration with enhanced options and validation
   * @param options - Rollback configuration options
   * @returns Promise<RollbackResult> - Results of the rollback
   */
  async rollbackMigration(options: RollbackOptions = {}): Promise<RollbackResult> {
    const startTime = Date.now();
    const {
      tenantId,
      userIds,
      afterDate,
      beforeDate,
      batchSize = 100,
      dryRun = false,
      preserveSystemRoles = true,
    } = options;
    
    this.logger.log(`Starting RBAC migration rollback with options: ${JSON.stringify(options)}`);

    const result: RollbackResult = {
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

      // Build query to find user roles to rollback
      const userRoleQuery = this.userRoleRepository
        .createQueryBuilder('ur')
        .leftJoinAndSelect('ur.role', 'role')
        .leftJoinAndSelect('ur.user', 'user')
        .leftJoinAndSelect('ur.tenant', 'tenant');

      // Apply filters
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

      // Group by user for processing
      const userRolesByUser = new Map<string, typeof userRoles>();
      for (const userRole of userRoles) {
        const userId = userRole.user_id;
        if (!userRolesByUser.has(userId)) {
          userRolesByUser.set(userId, []);
        }
        userRolesByUser.get(userId)!.push(userRole);
      }

      result.usersAffected = userRolesByUser.size;

      // Process rollbacks in batches
      const userIds_array = Array.from(userRolesByUser.keys());
      for (let i = 0; i < userIds_array.length; i += batchSize) {
        const batchUserIds = userIds_array.slice(i, i + batchSize);

        for (const userId of batchUserIds) {
          const userRolesToRemove = userRolesByUser.get(userId)!;
          
          try {
            if (!dryRun) {
              // Remove user roles
              const roleIds = userRolesToRemove.map(ur => ur.id);
              await queryRunner.manager.delete(UserRole, roleIds);
            }

            // Track success
            const user = userRolesToRemove[0].user;
            result.successes.push({
              userId,
              email: user?.email || 'unknown',
              rolesRemoved: userRolesToRemove.length,
            });

            this.logger.debug(`${dryRun ? '[DRY RUN] ' : ''}Removed ${userRolesToRemove.length} roles for user ${userId}`);

          } catch (error) {
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
      } else {
        this.logger.log('Dry run completed - no changes made');
      }

      // Log audit entry for rollback
      try {
        await this.auditLogService.createAuditLog({
          action: 'SYSTEM_EVENT' as any,
          result: AuditResult.SUCCESS,
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
      } catch (auditError) {
        this.logger.warn(`Failed to log rollback audit event: ${auditError.message}`);
      }

    } catch (error) {
      if (!dryRun) {
        await queryRunner.rollbackTransaction();
        this.logger.error('Rollback transaction rolled back due to error');
      }
      
      try {
        await this.auditLogService.createAuditLog({
          action: 'SYSTEM_EVENT' as any,
          result: AuditResult.FAILURE,
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
      } catch (auditError) {
        this.logger.warn(`Failed to log rollback failure audit event: ${auditError.message}`);
      }
      
      throw RBACErrorUtils.throwSystemError('MigrationService', 'rollbackMigration', error);
    } finally {
      await queryRunner.release();
      result.executionTime = Date.now() - startTime;
    }

    this.logger.log(`Migration rollback completed in ${result.executionTime}ms`);
    return result;
  }

  /**
   * Validate that all users have appropriate role assignments with enhanced checks
   * @param tenantId - Optional tenant ID to limit validation scope
   * @returns Promise<ValidationResult> - Results of the validation
   */
  async validateMigration(tenantId?: string): Promise<ValidationResult> {
    this.logger.log(`Validating RBAC migration${tenantId ? ` for tenant ${tenantId}` : ''}`);

    const result: ValidationResult = {
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

    // Build query for users
    const userQuery = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.tenant', 'tenant');

    if (tenantId) {
      userQuery.where('tenant.id = :tenantId', { tenantId });
    }

    const users = await userQuery.getMany();
    result.totalUsers = users.length;

    // Check each user for role assignments
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
      } else {
        result.usersWithRoles++;

        // Validate role assignments
        for (const userRole of userRoles) {
          // Check for missing role
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

          // Check for missing tenant
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

          // Check for cross-tenant violations
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

          // Check for duplicate role assignments
          const duplicateRoles = userRoles.filter(ur => 
            ur.role_id === userRole.role_id && 
            ur.tenant_id === userRole.tenant_id &&
            ur.id !== userRole.id
          );

          if (duplicateRoles.length > 0) {
            result.validationErrors.push({
              userId: user.id,
              email: user.email,
              issue: `User has duplicate role assignments for role ${userRole.role?.name || userRole.role_id}`,
              severity: 'warning',
            });
          }
        }

        // Check for users with too many roles (potential over-assignment)
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

    // Check for orphaned user roles (roles assigned to non-existent users)
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

    // Generate recommendations
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

  /**
   * Get migration status and statistics
   * @returns Promise with migration statistics
   */
  async getMigrationStatus(): Promise<{
    totalUsers: number;
    usersWithRoles: number;
    usersWithoutRoles: number;
    totalRoles: number;
    totalTenants: number;
    migrationProgress: number;
  }> {
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

  /**
   * Preview rollback operation without making changes
   * @param options - Rollback options
   * @returns Promise with rollback preview information
   */
  async previewRollback(options: RollbackOptions = {}): Promise<{
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
      email: string;
      rolesAffected: number;
      roleNames: string[];
    }>;
  }> {
    const {
      tenantId,
      userIds,
      afterDate,
      beforeDate,
      preserveSystemRoles = true,
    } = options;

    // Build query to find user roles that would be affected
    const userRoleQuery = this.userRoleRepository
      .createQueryBuilder('ur')
      .leftJoinAndSelect('ur.role', 'role')
      .leftJoinAndSelect('ur.user', 'user')
      .leftJoinAndSelect('ur.tenant', 'tenant');

    // Apply filters
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

    // Calculate statistics
    const uniqueUserIds = new Set(userRoles.map(ur => ur.user_id));
    const tenantStats = new Map<string, { tenantName: string; users: Set<string>; roles: number }>();
    const userStats = new Map<string, { email: string; roles: number; roleNames: string[] }>();

    for (const userRole of userRoles) {
      // Tenant breakdown
      const tenantKey = userRole.tenant_id;
      if (!tenantStats.has(tenantKey)) {
        tenantStats.set(tenantKey, {
          tenantName: userRole.tenant?.name || 'Unknown',
          users: new Set(),
          roles: 0,
        });
      }
      const tenantStat = tenantStats.get(tenantKey)!;
      tenantStat.users.add(userRole.user_id);
      tenantStat.roles++;

      // User breakdown
      const userKey = userRole.user_id;
      if (!userStats.has(userKey)) {
        userStats.set(userKey, {
          email: userRole.user?.email || 'Unknown',
          roles: 0,
          roleNames: [],
        });
      }
      const userStat = userStats.get(userKey)!;
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

  /**
   * Clean up orphaned data after rollback
   * @param dryRun - Whether to perform a dry run
   * @returns Promise with cleanup results
   */
  async cleanupOrphanedData(dryRun: boolean = false): Promise<{
    orphanedUserRoles: number;
    orphanedRoles: number;
    orphanedTenants: number;
    cleanupActions: string[];
  }> {
    const result = {
      orphanedUserRoles: 0,
      orphanedRoles: 0,
      orphanedTenants: 0,
      cleanupActions: [] as string[],
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      if (!dryRun) {
        await queryRunner.startTransaction();
      }

      // Find orphaned user roles (referencing non-existent users)
      const orphanedUserRoles = await this.userRoleRepository
        .createQueryBuilder('ur')
        .leftJoin('users', 'u', 'u.id = ur.user_id')
        .where('u.id IS NULL')
        .getMany();

      result.orphanedUserRoles = orphanedUserRoles.length;

      if (orphanedUserRoles.length > 0) {
        if (!dryRun) {
          await queryRunner.manager.remove(UserRole, orphanedUserRoles);
        }
        result.cleanupActions.push((dryRun ? '[DRY RUN] ' : '') + `Removed ${orphanedUserRoles.length} orphaned user role assignments`);
      }

      // Find roles with no user assignments (excluding system roles)
      const unusedRoles = await this.roleRepository
        .createQueryBuilder('role')
        .leftJoin('user_roles', 'ur', 'ur.role_id = role.id')
        .where('ur.id IS NULL')
        .andWhere('role.is_system_role = :isSystemRole', { isSystemRole: false })
        .getMany();

      result.orphanedRoles = unusedRoles.length;

      if (unusedRoles.length > 0) {
        if (!dryRun) {
          await queryRunner.manager.remove(Role, unusedRoles);
        }
        result.cleanupActions.push((dryRun ? '[DRY RUN] ' : '') + `Removed ${unusedRoles.length} unused roles`);
      }

      // Find tenants with no roles or users
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
          await queryRunner.manager.remove(RBACTenant, unusedTenants);
        }
        result.cleanupActions.push((dryRun ? '[DRY RUN] ' : '') + `Removed ${unusedTenants.length} unused RBAC tenants`);
      }

      if (!dryRun) {
        await queryRunner.commitTransaction();
      }

    } catch (error) {
      if (!dryRun) {
        await queryRunner.rollbackTransaction();
      }
      RBACErrorUtils.throwSystemError('MigrationService', 'cleanupOrphanedData', error);
    } finally {
      await queryRunner.release();
    }

    return result;
  }
}