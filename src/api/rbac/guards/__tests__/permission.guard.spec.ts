import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PermissionGuard } from '../permission.guard';
import { PermissionService } from '../../services/permission.service';
import { TenantContextService } from '../../services/tenant-context.service';
import { PERMISSIONS_KEY } from '../../decorators/require-permissions.decorator';
import { RBACAuthenticationException, RBACAuthorizationException } from '../../errors/rbac-exceptions';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let permissionService: jest.Mocked<PermissionService>;
  let tenantContextService: jest.Mocked<TenantContextService>;
  let reflector: jest.Mocked<Reflector>;
  let jwtService: jest.Mocked<JwtService>;

  const mockExecutionContext = {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;

  let mockRequest: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: PermissionService,
          useValue: {
            hasPermission: jest.fn(),
            validateUserTenantAccess: jest.fn(),
          },
        },
        {
          provide: TenantContextService,
          useValue: {
            setTenantContext: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {},
        },
      ],
    }).compile();

    guard = module.get<PermissionGuard>(PermissionGuard);
    permissionService = module.get(PermissionService);
    tenantContextService = module.get(TenantContextService);
    reflector = module.get(Reflector);
    jwtService = module.get(JwtService);

    // Reset mock request
    mockRequest = {
      user: {
        user_id: 'user-123',
        tenant_id: 'tenant-456',
      },
      headers: {},
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('canActivate', () => {
    it('should allow access when no permissions are required', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        PERMISSIONS_KEY,
        [mockExecutionContext.getHandler(), mockExecutionContext.getClass()],
      );
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      reflector.getAllAndOverride.mockReturnValue([
        { entityType: 'Customer', action: 'Read' },
      ]);
      mockRequest.user = null;

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        RBACAuthenticationException,
      );
    });

    it('should throw UnauthorizedException when tenant ID is missing', async () => {
      reflector.getAllAndOverride.mockReturnValue([
        { entityType: 'Customer', action: 'Read' },
      ]);
      mockRequest.user = { user_id: 'user-123' }; // No tenant_id

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        RBACAuthenticationException,
      );
    });

    it('should allow access when user has required permission', async () => {
      const requiredPermissions = [{ entityType: 'Customer', action: 'Read' }];
      reflector.getAllAndOverride.mockReturnValue(requiredPermissions);
      permissionService.hasPermission.mockResolvedValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(tenantContextService.setTenantContext).toHaveBeenCalledWith(
        'tenant-456',
        'user-123',
      );
      expect(permissionService.hasPermission).toHaveBeenCalledWith(
        'user-123',
        'tenant-456',
        'Customer',
        'Read',
      );
    });

    it('should throw ForbiddenException when user lacks required permission', async () => {
      const requiredPermissions = [{ entityType: 'Customer', action: 'Delete' }];
      reflector.getAllAndOverride.mockReturnValue(requiredPermissions);
      permissionService.hasPermission.mockResolvedValue(false);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        RBACAuthorizationException,
      );
    });

    it('should extract tenant ID from X-Tenant-ID header', async () => {
      const requiredPermissions = [{ entityType: 'Customer', action: 'Read' }];
      reflector.getAllAndOverride.mockReturnValue(requiredPermissions);
      permissionService.hasPermission.mockResolvedValue(true);
      mockRequest.headers['x-tenant-id'] = 'header-tenant-789';

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(tenantContextService.setTenantContext).toHaveBeenCalledWith(
        'header-tenant-789',
        'user-123',
      );
      expect(permissionService.hasPermission).toHaveBeenCalledWith(
        'user-123',
        'header-tenant-789',
        'Customer',
        'Read',
      );
    });

    it('should check multiple permissions and require all to pass', async () => {
      const requiredPermissions = [
        { entityType: 'Customer', action: 'Read' },
        { entityType: 'Customer', action: 'Update' },
      ];
      reflector.getAllAndOverride.mockReturnValue(requiredPermissions);
      permissionService.hasPermission
        .mockResolvedValueOnce(true)  // First permission passes
        .mockResolvedValueOnce(false); // Second permission fails

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        RBACAuthorizationException,
      );

      expect(permissionService.hasPermission).toHaveBeenCalledTimes(2);
    });
  });
});