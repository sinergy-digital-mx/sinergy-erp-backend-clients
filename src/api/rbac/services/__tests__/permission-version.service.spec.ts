import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PermissionVersionService } from '../permission-version.service';
import { User } from '../../../../entities/users/user.entity';
import { UserRole } from '../../../../entities/rbac/user-role.entity';

describe('PermissionVersionService', () => {
  let service: PermissionVersionService;
  let userRepository: jest.Mocked<Repository<User>>;
  let userRoleRepository: jest.Mocked<Repository<UserRole>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionVersionService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            increment: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PermissionVersionService>(PermissionVersionService);
    userRepository = module.get(getRepositoryToken(User));
    userRoleRepository = module.get(getRepositoryToken(UserRole));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('incrementUserVersion', () => {
    it('should increment permissions_version for a single user', async () => {
      const userId = 'user-123';

      await service.incrementUserVersion(userId);

      expect(userRepository.increment).toHaveBeenCalledWith(
        { id: userId },
        'permissions_version',
        1,
      );
    });
  });

  describe('incrementVersionForUsersWithRole', () => {
    it('should increment permissions_version for all users with a role', async () => {
      const roleId = 'role-123';
      const tenantId = 'tenant-123';
      const mockUserRoles = [
        { user_id: 'user-1', role_id: roleId, tenant_id: tenantId },
        { user_id: 'user-2', role_id: roleId, tenant_id: tenantId },
        { user_id: 'user-3', role_id: roleId, tenant_id: tenantId },
      ];

      userRoleRepository.find.mockResolvedValue(mockUserRoles as any);

      await service.incrementVersionForUsersWithRole(roleId, tenantId);

      expect(userRoleRepository.find).toHaveBeenCalledWith({
        where: {
          role_id: roleId,
          tenant_id: tenantId,
        },
        select: ['user_id'],
      });

      expect(userRepository.increment).toHaveBeenCalledWith(
        { id: In(['user-1', 'user-2', 'user-3']) },
        'permissions_version',
        1,
      );
    });

    it('should handle duplicate user IDs in role assignments', async () => {
      const roleId = 'role-123';
      const tenantId = 'tenant-123';
      const mockUserRoles = [
        { user_id: 'user-1', role_id: roleId, tenant_id: tenantId },
        { user_id: 'user-1', role_id: roleId, tenant_id: tenantId }, // duplicate
        { user_id: 'user-2', role_id: roleId, tenant_id: tenantId },
      ];

      userRoleRepository.find.mockResolvedValue(mockUserRoles as any);

      await service.incrementVersionForUsersWithRole(roleId, tenantId);

      // Should deduplicate user IDs
      expect(userRepository.increment).toHaveBeenCalledWith(
        { id: In(['user-1', 'user-2']) },
        'permissions_version',
        1,
      );
    });

    it('should not call increment when no users have the role', async () => {
      const roleId = 'role-123';
      const tenantId = 'tenant-123';

      userRoleRepository.find.mockResolvedValue([]);

      await service.incrementVersionForUsersWithRole(roleId, tenantId);

      expect(userRoleRepository.find).toHaveBeenCalled();
      expect(userRepository.increment).not.toHaveBeenCalled();
    });
  });

  describe('incrementVersionForUsersInTenant', () => {
    it('should increment permissions_version for all users in a tenant', async () => {
      const tenantId = 'tenant-123';

      await service.incrementVersionForUsersInTenant(tenantId);

      expect(userRepository.increment).toHaveBeenCalledWith(
        { tenant_id: tenantId },
        'permissions_version',
        1,
      );
    });
  });

  describe('getUserVersion', () => {
    it('should return the current permissions_version for a user', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        permissions_version: 5,
      };

      userRepository.findOne.mockResolvedValue(mockUser as any);

      const version = await service.getUserVersion(userId);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        select: ['permissions_version'],
      });
      expect(version).toBe(5);
    });

    it('should return 1 when user is not found', async () => {
      const userId = 'non-existent-user';

      userRepository.findOne.mockResolvedValue(null);

      const version = await service.getUserVersion(userId);

      expect(version).toBe(1);
    });

    it('should return 1 when permissions_version is undefined', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        permissions_version: undefined,
      };

      userRepository.findOne.mockResolvedValue(mockUser as any);

      const version = await service.getUserVersion(userId);

      expect(version).toBe(1);
    });
  });
});
