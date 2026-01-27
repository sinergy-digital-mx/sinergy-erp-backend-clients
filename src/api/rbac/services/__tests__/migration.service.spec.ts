/**
 * Migration Service Unit Tests
 * 
 * Tests for the RBAC migration service including rollback capabilities
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { MigrationService, RollbackOptions } from '../migration.service';
import { User } from '../../../../entities/users/user.entity';
import { UserRole } from '../../../../entities/rbac/user-role.entity';
import { Role } from '../../../../entities/rbac/role.entity';
import { RBACTenant } from '../../../../entities/rbac/tenant.entity';
import { RoleTemplateService } from '../role-template.service';
import { AuditLogService } from '../audit-log.service';

describe('MigrationService', () => {
  let service: MigrationService;
  let userRepository: jest.Mocked<Repository<User>>;
  let userRoleRepository: jest.Mocked<Repository<UserRole>>;
  let roleRepository: jest.Mocked<Repository<Role>>;
  let tenantRepository: jest.Mocked<Repository<RBACTenant>>;
  let dataSource: jest.Mocked<DataSource>;
  let queryRunner: jest.Mocked<QueryRunner>;
  let roleTemplateService: jest.Mocked<RoleTemplateService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    // Create mock query runner
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        create: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
        remove: jest.fn(),
      },
    } as any;

    // Create mock data source
    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as any;

    // Create mock repositories
    userRepository = {
      count: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    userRoleRepository = {
      count: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    roleRepository = {
      findOne: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    tenantRepository = {
      findOne: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    // Create mock services
    roleTemplateService = {
      createRoleFromSystemTemplate: jest.fn(),
      createSystemRolesForTenant: jest.fn(),
    } as any;

    auditLogService = {
      createAuditLog: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MigrationService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: userRoleRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: roleRepository,
        },
        {
          provide: getRepositoryToken(RBACTenant),
          useValue: tenantRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: RoleTemplateService,
          useValue: roleTemplateService,
        },
        {
          provide: AuditLogService,
          useValue: auditLogService,
        },
      ],
    }).compile();

    service = module.get<MigrationService>(MigrationService);
  });

  describe('rollbackMigration', () => {
    it('should rollback migration with basic options', async () => {
      // Arrange
      const mockUserRoles = [
        {
          id: 'ur1',
          user_id: 'user1',
          role_id: 'role1',
          tenant_id: 'tenant1',
          user: { id: 'user1', email: 'user1@example.com' },
          role: { id: 'role1', name: 'TestRole', is_system_role: false },
          tenant: { id: 'tenant1', name: 'TestTenant' },
        },
        {
          id: 'ur2',
          user_id: 'user2',
          role_id: 'role2',
          tenant_id: 'tenant1',
          user: { id: 'user2', email: 'user2@example.com' },
          role: { id: 'role2', name: 'TestRole2', is_system_role: false },
          tenant: { id: 'tenant1', name: 'TestTenant' },
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockUserRoles),
      };

      userRoleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await service.rollbackMigration({
        tenantId: 'tenant1',
        dryRun: false,
      });

      // Assert
      expect(result.totalRolesRemoved).toBe(2);
      expect(result.usersAffected).toBe(2);
      expect(result.successes).toHaveLength(2);
      expect(result.failures).toHaveLength(0);
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.delete).toHaveBeenCalledTimes(2);
      expect(queryRunner.manager.delete).toHaveBeenCalledWith(UserRole, ['ur1']);
      expect(queryRunner.manager.delete).toHaveBeenCalledWith(UserRole, ['ur2']);
    });

    it('should perform dry run rollback without making changes', async () => {
      // Arrange
      const mockUserRoles = [
        {
          id: 'ur1',
          user_id: 'user1',
          role_id: 'role1',
          tenant_id: 'tenant1',
          user: { id: 'user1', email: 'user1@example.com' },
          role: { id: 'role1', name: 'TestRole', is_system_role: false },
          tenant: { id: 'tenant1', name: 'TestTenant' },
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockUserRoles),
      };

      userRoleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await service.rollbackMigration({
        dryRun: true,
      });

      // Assert
      expect(result.totalRolesRemoved).toBe(1);
      expect(result.usersAffected).toBe(1);
      expect(result.dryRun).toBe(true);
      expect(queryRunner.startTransaction).not.toHaveBeenCalled();
      expect(queryRunner.manager.delete).not.toHaveBeenCalled();
    });

    it('should preserve system roles when preserveSystemRoles is true', async () => {
      // Arrange
      const mockUserRoles = [
        {
          id: 'ur1',
          user_id: 'user1',
          role_id: 'role1',
          tenant_id: 'tenant1',
          user: { id: 'user1', email: 'user1@example.com' },
          role: { id: 'role1', name: 'Admin', is_system_role: false },
          tenant: { id: 'tenant1', name: 'TestTenant' },
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockUserRoles),
      };

      userRoleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      await service.rollbackMigration({
        preserveSystemRoles: true,
      });

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'role.is_system_role = :isSystemRole',
        { isSystemRole: false }
      );
    });

    it('should filter by user IDs when provided', async () => {
      // Arrange
      const userIds = ['user1', 'user2'];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      userRoleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      await service.rollbackMigration({
        userIds,
        dryRun: true,
      });

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ur.user_id IN (:...userIds)',
        { userIds }
      );
    });

    it('should filter by date range when provided', async () => {
      // Arrange
      const afterDate = new Date('2024-01-01');
      const beforeDate = new Date('2024-12-31');
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      userRoleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      await service.rollbackMigration({
        afterDate,
        beforeDate,
        dryRun: true,
      });

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ur.created_at >= :afterDate',
        { afterDate }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ur.created_at <= :beforeDate',
        { beforeDate }
      );
    });
  });

  describe('previewRollback', () => {
    it('should provide rollback preview without making changes', async () => {
      // Arrange
      const mockUserRoles = [
        {
          id: 'ur1',
          user_id: 'user1',
          role_id: 'role1',
          tenant_id: 'tenant1',
          user: { id: 'user1', email: 'user1@example.com' },
          role: { id: 'role1', name: 'TestRole' },
          tenant: { id: 'tenant1', name: 'TestTenant' },
        },
        {
          id: 'ur2',
          user_id: 'user1',
          role_id: 'role2',
          tenant_id: 'tenant1',
          user: { id: 'user1', email: 'user1@example.com' },
          role: { id: 'role2', name: 'TestRole2' },
          tenant: { id: 'tenant1', name: 'TestTenant' },
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockUserRoles),
      };

      userRoleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await service.previewRollback({
        tenantId: 'tenant1',
      });

      // Assert
      expect(result.usersAffected).toBe(1);
      expect(result.rolesAffected).toBe(2);
      expect(result.tenantBreakdown).toHaveLength(1);
      expect(result.tenantBreakdown[0].tenantId).toBe('tenant1');
      expect(result.tenantBreakdown[0].usersAffected).toBe(1);
      expect(result.tenantBreakdown[0].rolesAffected).toBe(2);
      expect(result.userBreakdown).toHaveLength(1);
      expect(result.userBreakdown[0].userId).toBe('user1');
      expect(result.userBreakdown[0].rolesAffected).toBe(2);
    });
  });

  describe('validateMigration', () => {
    it('should validate migration and return comprehensive results', async () => {
      // Arrange
      const mockUsers = [
        {
          id: 'user1',
          email: 'user1@example.com',
          tenant: { id: 'tenant1' },
        },
        {
          id: 'user2',
          email: 'user2@example.com',
          tenant: { id: 'tenant1' },
        },
      ];

      const mockUserRoles = [
        {
          id: 'ur1',
          user_id: 'user1',
          role_id: 'role1',
          tenant_id: 'tenant1',
          role: { id: 'role1', name: 'TestRole' },
          tenant: { id: 'tenant1', legacy_tenant_id: 'tenant1' },
        },
      ];

      const mockUserQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockUsers),
      };

      const mockOrphanedQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };

      userRepository.createQueryBuilder.mockReturnValue(mockUserQueryBuilder as any);
      userRoleRepository.find.mockResolvedValueOnce(mockUserRoles).mockResolvedValueOnce([]);
      userRoleRepository.createQueryBuilder.mockReturnValue(mockOrphanedQueryBuilder as any);

      // Act
      const result = await service.validateMigration();

      // Assert
      expect(result.totalUsers).toBe(2);
      expect(result.usersWithRoles).toBe(1);
      expect(result.usersWithoutRoles).toBe(1);
      expect(result.orphanedRoles).toBe(0);
      expect(result.isValid).toBe(false); // Because one user has no roles
      expect(result.validationErrors).toHaveLength(1);
      expect(result.recommendations).toContain('1 users need role assignments. Consider running migration again or manually assigning roles.');
    });
  });

  describe('cleanupOrphanedData', () => {
    it('should clean up orphaned data', async () => {
      // Arrange
      const mockOrphanedUserRoles = [
        { id: 'ur1', user_id: 'nonexistent' },
      ];

      const mockUnusedRoles = [
        { id: 'role1', name: 'UnusedRole', is_system_role: false },
      ];

      const mockUnusedTenants = [
        { id: 'tenant1', name: 'UnusedTenant' },
      ];

      // Mock query builders for different queries
      const mockOrphanedUserRolesQB = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOrphanedUserRoles),
      };

      const mockUnusedRolesQB = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockUnusedRoles),
      };

      const mockUnusedTenantsQB = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockUnusedTenants),
      };

      userRoleRepository.createQueryBuilder.mockReturnValue(mockOrphanedUserRolesQB as any);
      roleRepository.createQueryBuilder.mockReturnValue(mockUnusedRolesQB as any);
      tenantRepository.createQueryBuilder.mockReturnValue(mockUnusedTenantsQB as any);

      // Act
      const result = await service.cleanupOrphanedData(false);

      // Assert
      expect(result.orphanedUserRoles).toBe(1);
      expect(result.orphanedRoles).toBe(1);
      expect(result.orphanedTenants).toBe(1);
      expect(result.cleanupActions).toHaveLength(3);
      expect(queryRunner.manager.remove).toHaveBeenCalledTimes(3);
    });

    it('should perform dry run cleanup without making changes', async () => {
      // Arrange
      const mockOrphanedUserRoles = [
        { id: 'ur1', user_id: 'nonexistent' },
      ];

      const mockOrphanedUserRolesQB = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOrphanedUserRoles),
      };

      const mockEmptyQB = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      userRoleRepository.createQueryBuilder.mockReturnValue(mockOrphanedUserRolesQB as any);
      roleRepository.createQueryBuilder.mockReturnValue(mockEmptyQB as any);
      tenantRepository.createQueryBuilder.mockReturnValue(mockEmptyQB as any);

      // Act
      const result = await service.cleanupOrphanedData(true);

      // Assert
      expect(result.orphanedUserRoles).toBe(1);
      expect(result.cleanupActions[0]).toContain('[DRY RUN]');
      expect(queryRunner.startTransaction).not.toHaveBeenCalled();
      expect(queryRunner.manager.delete).not.toHaveBeenCalled();
    });
  });
});