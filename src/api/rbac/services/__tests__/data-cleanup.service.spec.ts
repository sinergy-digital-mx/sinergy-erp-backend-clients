/**
 * Unit tests for DataCleanupService
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DataCleanupService, CleanupOptions, IntegrityCheckResult } from '../data-cleanup.service';
import { AuditLogService } from '../audit-log.service';
import { RBACTenant } from '../../../../entities/rbac/tenant.entity';
import { Role } from '../../../../entities/rbac/role.entity';
import { Permission } from '../../../../entities/rbac/permission.entity';
import { UserRole } from '../../../../entities/rbac/user-role.entity';
import { RolePermission } from '../../../../entities/rbac/role-permission.entity';
import { AuditLog } from '../../../../entities/rbac/audit-log.entity';
import { User } from '../../../../entities/users/user.entity';

describe('DataCleanupService', () => {
  let service: DataCleanupService;
  let tenantRepository: jest.Mocked<Repository<RBACTenant>>;
  let roleRepository: jest.Mocked<Repository<Role>>;
  let permissionRepository: jest.Mocked<Repository<Permission>>;
  let userRoleRepository: jest.Mocked<Repository<UserRole>>;
  let rolePermissionRepository: jest.Mocked<Repository<RolePermission>>;
  let auditLogRepository: jest.Mocked<Repository<AuditLog>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let dataSource: jest.Mocked<DataSource>;
  let queryRunner: jest.Mocked<QueryRunner>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    // Create mock query runner
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        remove: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
      },
    } as any;

    // Create mock data source
    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as any;

    // Create mock repositories
    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    tenantRepository = mockRepository as any;
    roleRepository = mockRepository as any;
    permissionRepository = mockRepository as any;
    userRoleRepository = mockRepository as any;
    rolePermissionRepository = mockRepository as any;
    auditLogRepository = mockRepository as any;
    userRepository = mockRepository as any;

    // Create mock services
    auditLogService = {
      createAuditLog: jest.fn(),
    } as any;

    configService = {
      get: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataCleanupService,
        {
          provide: getRepositoryToken(RBACTenant),
          useValue: tenantRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: roleRepository,
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: permissionRepository,
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: userRoleRepository,
        },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: rolePermissionRepository,
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: auditLogRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: AuditLogService,
          useValue: auditLogService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<DataCleanupService>(DataCleanupService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('performCleanup', () => {
    it('should perform dry run cleanup successfully', async () => {
      // Arrange
      const options: CleanupOptions = {
        dryRun: true,
        cleanupUserRoles: true,
        cleanupRolePermissions: true,
      };

      // Mock orphaned user roles
      const mockOrphanedUserRoles = [
        { id: 'ur1', user_id: 'nonexistent-user', role_id: 'role1', tenant_id: 'tenant1' },
        { id: 'ur2', user_id: 'nonexistent-user2', role_id: 'role2', tenant_id: 'tenant1' },
      ];

      const mockUserRoleQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOrphanedUserRoles),
      };

      userRoleRepository.createQueryBuilder.mockReturnValue(mockUserRoleQueryBuilder as any);

      // Mock orphaned role permissions
      const mockOrphanedRolePermissions = [
        { id: 'rp1', role_id: 'nonexistent-role', permission_id: 'perm1' },
      ];

      const mockRolePermissionQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOrphanedRolePermissions),
      };

      rolePermissionRepository.createQueryBuilder.mockReturnValue(mockRolePermissionQueryBuilder as any);

      auditLogService.createAuditLog.mockResolvedValue({} as any);

      // Act
      const result = await service.performCleanup(options);

      // Assert
      expect(result.dryRun).toBe(true);
      expect(result.statistics.orphanedUserRoles).toBe(2);
      expect(result.statistics.orphanedRolePermissions).toBe(1);
      expect(result.actions).toContain('[DRY RUN] Removed 2 orphaned user role assignments');
      expect(result.actions).toContain('[DRY RUN] Removed 1 orphaned role permission assignments');
      expect(result.errors).toHaveLength(0);
      expect(queryRunner.manager.remove).not.toHaveBeenCalled(); // Dry run should not remove anything
    });

    it('should perform actual cleanup successfully', async () => {
      // Arrange
      const options: CleanupOptions = {
        dryRun: false,
        cleanupUserRoles: true,
        batchSize: 1000,
      };

      const mockOrphanedUserRoles = [
        { id: 'ur1', user_id: 'nonexistent-user', role_id: 'role1', tenant_id: 'tenant1' },
      ];

      const mockUserRoleQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOrphanedUserRoles),
      };

      userRoleRepository.createQueryBuilder.mockReturnValue(mockUserRoleQueryBuilder as any);

      // Mock empty results for other cleanup types
      rolePermissionRepository.createQueryBuilder.mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      } as any);

      auditLogService.createAuditLog.mockResolvedValue({} as any);

      // Act
      const result = await service.performCleanup(options);

      // Assert
      expect(result.dryRun).toBe(false);
      expect(result.statistics.orphanedUserRoles).toBe(1);
      expect(result.actions).toContain('Removed 1 orphaned user role assignments');
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.remove).toHaveBeenCalledWith(UserRole, mockOrphanedUserRoles);
    });

    it('should handle cleanup errors and rollback transaction', async () => {
      // Arrange
      const options: CleanupOptions = {
        dryRun: false,
        cleanupUserRoles: true,
      };

      userRoleRepository.createQueryBuilder.mockImplementation(() => {
        throw new Error('Database error');
      });

      auditLogService.createAuditLog.mockResolvedValue({} as any);

      // Act & Assert
      await expect(service.performCleanup(options)).rejects.toThrow();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(auditLogService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          result: 'failure',
          errorMessage: expect.stringContaining('Database error'),
        })
      );
    });

    it('should prevent concurrent cleanup operations', async () => {
      // Arrange
      const options: CleanupOptions = { dryRun: true };

      // Mock a long-running cleanup
      userRoleRepository.createQueryBuilder.mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 100));
      });

      // Act
      const firstCleanup = service.performCleanup(options);
      
      // Try to start second cleanup immediately
      await expect(service.performCleanup(options)).rejects.toThrow('Cleanup operation is already running');

      // Wait for first cleanup to complete
      await firstCleanup.catch(() => {}); // Ignore the error from the mock
    });

    it('should respect tenant filtering', async () => {
      // Arrange
      const options: CleanupOptions = {
        dryRun: true,
        cleanupUserRoles: true,
        tenantId: 'specific-tenant',
      };

      const mockUserRoleQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      userRoleRepository.createQueryBuilder.mockReturnValue(mockUserRoleQueryBuilder as any);
      auditLogService.createAuditLog.mockResolvedValue({} as any);

      // Act
      await service.performCleanup(options);

      // Assert
      expect(mockUserRoleQueryBuilder.andWhere).toHaveBeenCalledWith('ur.tenant_id = :tenantId', { tenantId: 'specific-tenant' });
    });
  });

  describe('performIntegrityCheck', () => {
    it('should perform comprehensive integrity check', async () => {
      // Arrange
      // Mock performance metrics
      userRepository.count.mockResolvedValue(100);
      roleRepository.count.mockResolvedValue(10);
      permissionRepository.count.mockResolvedValue(50);
      userRoleRepository.count.mockResolvedValue(150);
      rolePermissionRepository.count.mockResolvedValue(200);
      tenantRepository.count.mockResolvedValue(5);

      // Mock orphaned data checks
      const mockOrphanedUserRolesQB = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      };
      userRoleRepository.createQueryBuilder.mockReturnValue(mockOrphanedUserRolesQB as any);

      const mockOrphanedRolePermissionsQB = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };
      rolePermissionRepository.createQueryBuilder.mockReturnValue(mockOrphanedRolePermissionsQB as any);

      // Mock missing references checks
      const mockRolesWithoutTenantsQB = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      roleRepository.createQueryBuilder.mockReturnValue(mockRolesWithoutTenantsQB as any);

      // Mock duplicate data checks
      userRoleRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      } as any);

      rolePermissionRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      } as any);

      // Mock constraint violation checks
      userRoleRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      } as any);

      // Mock performance issue checks
      auditLogRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(50000),
      } as any);

      // Act
      const result = await service.performIntegrityCheck();

      // Assert
      expect(result.isHealthy).toBe(false); // Should be false due to orphaned data
      expect(result.performance.totalUsers).toBe(100);
      expect(result.performance.totalRoles).toBe(10);
      expect(result.performance.averageRolesPerUser).toBe(1.5);
      expect(result.issues).toHaveLength(2); // Orphaned user roles and role permissions
      expect(result.issues[0].type).toBe('orphaned_data');
      expect(result.issues[0].severity).toBe('high');
      expect(result.recommendations).toContain('Address 2 high-priority issues to maintain data integrity');
    });

    it('should return healthy status when no issues found', async () => {
      // Arrange
      // Mock performance metrics
      userRepository.count.mockResolvedValue(10);
      roleRepository.count.mockResolvedValue(3);
      permissionRepository.count.mockResolvedValue(15);
      userRoleRepository.count.mockResolvedValue(20);
      rolePermissionRepository.count.mockResolvedValue(30);
      tenantRepository.count.mockResolvedValue(2);

      // Mock no issues found
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      userRoleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      rolePermissionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      roleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await service.performIntegrityCheck();

      // Assert
      expect(result.isHealthy).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.recommendations).toContain('System integrity is healthy - continue regular monitoring');
    });

    it('should handle integrity check errors gracefully', async () => {
      // Arrange
      userRepository.count.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await service.performIntegrityCheck();

      // Assert
      expect(result.isHealthy).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('constraint_violation');
      expect(result.issues[0].severity).toBe('critical');
      expect(result.issues[0].description).toContain('Integrity check failed');
    });
  });

  describe('getMaintenanceSchedule', () => {
    it('should return maintenance schedule from configuration', () => {
      // Arrange
      configService.get.mockImplementation((key, defaultValue) => {
        const config = {
          'RBAC_CLEANUP_ENABLED': 'true',
          'RBAC_CLEANUP_SCHEDULE': '0 3 * * 1',
          'RBAC_CLEANUP_BATCH_SIZE': '500',
          'RBAC_CLEANUP_OLD_AUDIT_LOGS': 'true',
          'RBAC_AUDIT_LOG_RETENTION_DAYS': '180',
          'RBAC_CLEANUP_NOTIFY': 'true',
          'RBAC_CLEANUP_NOTIFICATION_EMAILS': 'admin@example.com,ops@example.com',
        };
        return config[key] || defaultValue;
      });

      // Act
      const schedule = service.getMaintenanceSchedule();

      // Assert
      expect(schedule.enabled).toBe(true);
      expect(schedule.schedule).toBe('0 3 * * 1');
      expect(schedule.defaultOptions.batchSize).toBe('500');
      expect(schedule.defaultOptions.cleanupOldAuditLogs).toBe(true);
      expect(schedule.defaultOptions.auditLogRetentionDays).toBe('180');
      expect(schedule.notifyOnCompletion).toBe(true);
      expect(schedule.notificationEmails).toEqual(['admin@example.com', 'ops@example.com']);
    });

    it('should return default values when configuration is not set', () => {
      // Arrange
      configService.get.mockImplementation((key, defaultValue) => defaultValue);

      // Act
      const schedule = service.getMaintenanceSchedule();

      // Assert
      expect(schedule.enabled).toBe(false);
      expect(schedule.schedule).toBe('0 2 * * 0');
      expect(schedule.defaultOptions.batchSize).toBe(1000);
      expect(schedule.defaultOptions.cleanupOldAuditLogs).toBe(false);
      expect(schedule.defaultOptions.auditLogRetentionDays).toBe(365);
      expect(schedule.notifyOnCompletion).toBe(false);
      expect(schedule.notificationEmails).toEqual([]);
    });
  });

  describe('cleanup status tracking', () => {
    it('should track cleanup status correctly', async () => {
      // Arrange
      expect(service.isCleanupInProgress()).toBe(false);
      expect(service.getLastCleanupResult()).toBeNull();

      // Mock successful cleanup
      userRoleRepository.createQueryBuilder.mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      } as any);

      auditLogService.createAuditLog.mockResolvedValue({} as any);

      // Act
      const result = await service.performCleanup({ dryRun: true });

      // Assert
      expect(service.isCleanupInProgress()).toBe(false);
      expect(service.getLastCleanupResult()).toBe(result);
    });

    it('should track integrity check results', async () => {
      // Arrange
      expect(service.getLastIntegrityCheck()).toBeNull();

      // Mock repositories for integrity check
      userRepository.count.mockResolvedValue(0);
      roleRepository.count.mockResolvedValue(0);
      permissionRepository.count.mockResolvedValue(0);
      userRoleRepository.count.mockResolvedValue(0);
      rolePermissionRepository.count.mockResolvedValue(0);
      tenantRepository.count.mockResolvedValue(0);

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      userRoleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      rolePermissionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      roleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await service.performIntegrityCheck();

      // Assert
      expect(service.getLastIntegrityCheck()).toBe(result);
    });
  });

  describe('batch processing', () => {
    it('should process cleanup in batches', async () => {
      // Arrange
      const options: CleanupOptions = {
        dryRun: false,
        cleanupUserRoles: true,
        batchSize: 2,
      };

      // Create 5 orphaned user roles to test batching
      const mockOrphanedUserRoles = [
        { id: 'ur1' }, { id: 'ur2' }, { id: 'ur3' }, { id: 'ur4' }, { id: 'ur5' }
      ];

      userRoleRepository.createQueryBuilder.mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOrphanedUserRoles),
      } as any);

      auditLogService.createAuditLog.mockResolvedValue({} as any);

      // Act
      await service.performCleanup(options);

      // Assert
      // Should be called 3 times: batch 1 (2 items), batch 2 (2 items), batch 3 (1 item)
      expect(queryRunner.manager.remove).toHaveBeenCalledTimes(3);
      expect(queryRunner.manager.remove).toHaveBeenNthCalledWith(1, UserRole, [{ id: 'ur1' }, { id: 'ur2' }]);
      expect(queryRunner.manager.remove).toHaveBeenNthCalledWith(2, UserRole, [{ id: 'ur3' }, { id: 'ur4' }]);
      expect(queryRunner.manager.remove).toHaveBeenNthCalledWith(3, UserRole, [{ id: 'ur5' }]);
    });
  });
});