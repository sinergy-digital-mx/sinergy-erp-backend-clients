import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionVersionGuard } from './permission-version.guard';
import { PermissionVersionService } from '../../rbac/services/permission-version.service';

describe('PermissionVersionGuard', () => {
  let guard: PermissionVersionGuard;
  let permissionVersionService: jest.Mocked<PermissionVersionService>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const mockPermissionVersionService = {
      getUserVersion: jest.fn(),
    };

    const mockReflector = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionVersionGuard,
        {
          provide: PermissionVersionService,
          useValue: mockPermissionVersionService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<PermissionVersionGuard>(PermissionVersionGuard);
    permissionVersionService = module.get(PermissionVersionService);
    reflector = module.get(Reflector);
  });

  const createMockExecutionContext = (user: any, url: string): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          url,
        }),
      }),
    } as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should allow request when no user is present', async () => {
      const context = createMockExecutionContext(null, '/api/customers');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(permissionVersionService.getUserVersion).not.toHaveBeenCalled();
    });

    it('should allow request when user has no id', async () => {
      const context = createMockExecutionContext({ email: 'test@example.com' }, '/api/customers');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(permissionVersionService.getUserVersion).not.toHaveBeenCalled();
    });

    it('should skip validation for /auth/refresh endpoint', async () => {
      const user = {
        id: 'user-123',
        permissions_version: 1,
      };
      const context = createMockExecutionContext(user, '/api/auth/refresh');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(permissionVersionService.getUserVersion).not.toHaveBeenCalled();
    });

    it('should allow request when JWT has no permissions_version (backward compatibility)', async () => {
      const user = {
        id: 'user-123',
      };
      const context = createMockExecutionContext(user, '/api/customers');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(permissionVersionService.getUserVersion).not.toHaveBeenCalled();
    });

    it('should allow request when JWT version matches database version', async () => {
      const user = {
        id: 'user-123',
        permissions_version: 2,
      };
      const context = createMockExecutionContext(user, '/api/customers');

      permissionVersionService.getUserVersion.mockResolvedValue(2);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(permissionVersionService.getUserVersion).toHaveBeenCalledWith('user-123');
    });

    it('should throw UnauthorizedException when JWT version is less than database version', async () => {
      const user = {
        id: 'user-123',
        permissions_version: 1,
      };
      const context = createMockExecutionContext(user, '/api/customers');

      permissionVersionService.getUserVersion.mockResolvedValue(2);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 401,
            error: 'PERMISSIONS_CHANGED',
            message: 'Your permissions have been updated. Please refresh your session.',
          }),
        }),
      );
      expect(permissionVersionService.getUserVersion).toHaveBeenCalledWith('user-123');
    });

    it('should allow request when JWT version is greater than database version', async () => {
      // This shouldn't happen in practice, but the guard should handle it gracefully
      const user = {
        id: 'user-123',
        permissions_version: 3,
      };
      const context = createMockExecutionContext(user, '/api/customers');

      permissionVersionService.getUserVersion.mockResolvedValue(2);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(permissionVersionService.getUserVersion).toHaveBeenCalledWith('user-123');
    });

    it('should handle null permissions_version in JWT', async () => {
      const user = {
        id: 'user-123',
        permissions_version: null,
      };
      const context = createMockExecutionContext(user, '/api/customers');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(permissionVersionService.getUserVersion).not.toHaveBeenCalled();
    });
  });
});
