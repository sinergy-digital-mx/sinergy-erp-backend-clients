import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../entities/users/user.entity';
import { PermissionService } from '../rbac/services/permission.service';
import { RoleService } from '../rbac/services/role.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: any;
  let jwtService: JwtService;
  let permissionService: PermissionService;
  let roleService: RoleService;

  const mockUserRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockPermissionService = {
    getUserPermissions: jest.fn(),
    validateUserTenantAccess: jest.fn(),
  };

  const mockRoleService = {
    getUserRoles: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: PermissionService, useValue: mockPermissionService },
        { provide: RoleService, useValue: mockRoleService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    permissionService = module.get<PermissionService>(PermissionService);
    roleService = module.get<RoleService>(RoleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should include permissions_version in JWT payload', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        password: 'hashed-password',
        permissions_version: 1,
        last_login_at: null,
        tenant: { id: 'tenant-456', name: 'Test Tenant' },
        status: { code: 'Active' },
      };

      const mockRoles = [{ id: 'role-1', name: 'Sales Rep', is_system_role: false }];
      const mockPermissions = [
        { id: 1, entity_type: 'Customer', action: 'Read', description: 'View customers', module: { name: 'Customer Management' } },
      ];

      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockUserRepo.save.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockRoleService.getUserRoles.mockResolvedValue(mockRoles);
      mockPermissionService.getUserPermissions.mockResolvedValue(mockPermissions);
      mockJwtService.sign.mockReturnValue('jwt-token');

      // Act
      const result = await service.login('user@example.com', 'password123');

      // Assert
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-123',
          email: 'user@example.com',
          tenant_id: 'tenant-456',
          permissions_version: 1,
        })
      );
      expect(result.user.permissions_version).toBe(1);
    });

    it('should include POS session fields in login user response', async () => {
      const mockUser = {
        id: 'user-pos',
        email: 'cobranza@example.com',
        password: 'hashed-password',
        permissions_version: 1,
        last_login_at: null,
        is_pos_user: true,
        pos_user_type: 'COBRANZA',
        billing_branch_id: 'branch-1',
        billing_branch: { id: 'branch-1', fiscal_configuration_id: 'fiscal-1' },
        tenant: { id: 'tenant-456', name: 'Test Tenant' },
        status: { code: 'active' },
      };

      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockUserRepo.save.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockRoleService.getUserRoles.mockResolvedValue([]);
      mockPermissionService.getUserPermissions.mockResolvedValue([]);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login('cobranza@example.com', 'password123');

      expect(result.user).toMatchObject({
        is_pos_user: true,
        pos_user_type: 'COBRANZA',
        pos_can_sell: false,
        pos_can_collect: true,
        billing_branch_id: 'branch-1',
        fiscal_configuration_id: 'fiscal-1',
      });
    });

    it('lets a manager POS user sell and collect', async () => {
      const mockUser = {
        id: 'user-mgr',
        email: 'gerente@example.com',
        password: 'hashed-password',
        permissions_version: 1,
        last_login_at: null,
        is_pos_user: true,
        is_manager: true,
        pos_user_type: 'AMBOS',
        billing_branch_id: 'branch-1',
        tenant: { id: 'tenant-456', name: 'Test Tenant' },
        status: { code: 'active' },
      };

      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockUserRepo.save.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockRoleService.getUserRoles.mockResolvedValue([]);
      mockPermissionService.getUserPermissions.mockResolvedValue([]);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login('gerente@example.com', 'password123');

      expect(result.user).toMatchObject({
        is_pos_user: true,
        is_manager: true,
        pos_user_type: 'AMBOS',
        pos_can_sell: true,
        pos_can_collect: true,
      });
    });

    it('should return null pos fields for non-POS users on login', async () => {
      const mockUser = {
        id: 'user-erp',
        email: 'admin@example.com',
        password: 'hashed-password',
        permissions_version: 1,
        last_login_at: null,
        is_pos_user: false,
        pos_user_type: null,
        billing_branch_id: null,
        tenant: { id: 'tenant-456', name: 'Test Tenant' },
        status: { code: 'active' },
      };

      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockUserRepo.save.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockRoleService.getUserRoles.mockResolvedValue([]);
      mockPermissionService.getUserPermissions.mockResolvedValue([]);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login('admin@example.com', 'password123');

      expect(result.user).toMatchObject({
        is_pos_user: false,
        pos_user_type: null,
        pos_can_sell: false,
        pos_can_collect: false,
        billing_branch_id: null,
        fiscal_configuration_id: null,
      });
    });

    it('rejects login when the user is not active', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-inactive',
        email: 'off@example.com',
        password: 'hashed-password',
        tenant: { id: 'tenant-456' },
        status: { code: 'inactive' },
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login('off@example.com', 'password123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(mockUserRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should generate new token with current permissions_version', async () => {
      // Arrange
      const userId = 'user-123';
      const tenantId = 'tenant-456';
      const mockUser = {
        id: userId,
        email: 'user@example.com',
        permissions_version: 2, // Version has been incremented
        tenant: { id: tenantId, name: 'Test Tenant' },
        status: { code: 'Active' },
      };

      const mockRoles = [{ id: 'role-1', name: 'Sales Rep', is_system_role: false }];
      const mockPermissions = [
        { id: 1, entity_type: 'Customer', action: 'Read', description: 'View customers' },
        { id: 2, entity_type: 'Customer', action: 'Create', description: 'Create customers' },
      ];

      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockRoleService.getUserRoles.mockResolvedValue(mockRoles);
      mockPermissionService.getUserPermissions.mockResolvedValue(mockPermissions);
      mockJwtService.sign.mockReturnValue('new-jwt-token');

      // Act
      const result = await service.refresh(userId, tenantId);

      // Assert
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: userId,
          email: 'user@example.com',
          tenant_id: tenantId,
          permissions_version: 2,
          permissions: ['customer:Read', 'customer:Create'],
        })
      );
      expect(result.access_token).toBe('new-jwt-token');
      expect(result.user.permissions_version).toBe(2);
      expect(result.user.permissions_flat).toEqual(['customer:Read', 'customer:Create']);
    });

    it('should throw UnauthorizedException for invalid user', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refresh('invalid-user', 'tenant-456')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for tenant mismatch', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        tenant: { id: 'tenant-456' },
      };

      mockUserRepo.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.refresh('user-123', 'different-tenant')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should load fresh RBAC data and include updated permissions_version', async () => {
      // Arrange
      const userId = 'user-123';
      const tenantId = 'tenant-456';
      const mockUser = {
        id: userId,
        email: 'user@example.com',
        permissions_version: 3, // Version incremented multiple times
        tenant: { id: tenantId },
        status: { code: 'Active' },
      };

      const mockRoles = [
        { id: 'role-1', name: 'Sales Rep', is_system_role: false },
        { id: 'role-2', name: 'Manager', is_system_role: false },
      ];
      const mockPermissions = [
        { id: 1, entity_type: 'Customer', action: 'Read' },
        { id: 2, entity_type: 'Customer', action: 'Create' },
        { id: 3, entity_type: 'Customer', action: 'Update' },
      ];

      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockRoleService.getUserRoles.mockResolvedValue(mockRoles);
      mockPermissionService.getUserPermissions.mockResolvedValue(mockPermissions);
      mockJwtService.sign.mockReturnValue('refreshed-token');

      // Act
      const result = await service.refreshToken(userId, tenantId);

      // Assert
      expect(mockRoleService.getUserRoles).toHaveBeenCalledWith(userId, tenantId);
      expect(mockPermissionService.getUserPermissions).toHaveBeenCalledWith(userId, tenantId);
      expect(result.user.permissions_version).toBe(3);
      expect(result.user.roles).toEqual(['Sales Rep', 'Manager']);
      expect(result.user.permissions_flat).toHaveLength(3);
    });
  });
});
