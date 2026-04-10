import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import { PermissionService } from '../rbac/services/permission.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let tenantContextService: TenantContextService;

  const mockAuthService = {
    login: jest.fn(),
    refresh: jest.fn(),
  };

  const mockTenantContextService = {
    getCurrentUserId: jest.fn(),
    getCurrentTenantId: jest.fn(),
  };

  const mockPermissionService = {
    getUserPermissions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: TenantContextService, useValue: mockTenantContextService },
        { provide: PermissionService, useValue: mockPermissionService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    tenantContextService = module.get<TenantContextService>(TenantContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('refresh', () => {
    it('should refresh token with current permissions', async () => {
      // Arrange
      const userId = 'user-123';
      const tenantId = 'tenant-456';
      const mockResponse = {
        access_token: 'new-jwt-token',
        user: {
          id: userId,
          email: 'user@example.com',
          tenant_id: tenantId,
          status: 'Active',
          roles: ['Sales Rep'],
          permissions_flat: ['customer:read', 'customer:create'],
          permissions_version: 2,
        },
      };

      mockTenantContextService.getCurrentUserId.mockReturnValue(userId);
      mockTenantContextService.getCurrentTenantId.mockReturnValue(tenantId);
      mockAuthService.refresh.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.refresh();

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockTenantContextService.getCurrentUserId).toHaveBeenCalled();
      expect(mockTenantContextService.getCurrentTenantId).toHaveBeenCalled();
      expect(mockAuthService.refresh).toHaveBeenCalledWith(userId, tenantId);
    });

    it('should throw error when user context is missing', async () => {
      // Arrange
      mockTenantContextService.getCurrentUserId.mockReturnValue(null);
      mockTenantContextService.getCurrentTenantId.mockReturnValue('tenant-456');

      // Act & Assert
      await expect(controller.refresh()).rejects.toThrow('User context is required');
    });

    it('should throw error when tenant context is missing', async () => {
      // Arrange
      mockTenantContextService.getCurrentUserId.mockReturnValue('user-123');
      mockTenantContextService.getCurrentTenantId.mockReturnValue(null);

      // Act & Assert
      await expect(controller.refresh()).rejects.toThrow('User context is required');
    });
  });

  describe('login', () => {
    it('should login user and return token with permissions_version', async () => {
      // Arrange
      const loginDto = { email: 'user@example.com', password: 'password123' };
      const mockResponse = {
        access_token: 'jwt-token',
        user: {
          id: 'user-123',
          email: 'user@example.com',
          tenant_id: 'tenant-456',
          status: 'Active',
          roles: ['Sales Rep'],
          permissions: {},
          permissions_flat: ['customer:read'],
          permissions_version: 1,
          last_login_at: new Date(),
        },
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(result.user.permissions_version).toBeDefined();
    });
  });
});
