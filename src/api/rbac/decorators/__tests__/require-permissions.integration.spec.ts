import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, Controller, Get, UseGuards } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PermissionGuard } from '../../guards/permission.guard';
import { PermissionService } from '../../services/permission.service';
import { TenantContextService } from '../../services/tenant-context.service';
import {
  RequirePermissions,
  RequirePermission,
  RequireCustomerRead,
  PERMISSIONS_KEY,
} from '../require-permissions.decorator';

// Mock controller for testing
@Controller('test')
@UseGuards(PermissionGuard)
class TestController {
  @Get('single-permission')
  @RequirePermission('Customer', 'Read')
  singlePermission() {
    return { message: 'success' };
  }

  @Get('multiple-permissions')
  @RequirePermissions(
    { entityType: 'Customer', action: 'Read' },
    { entityType: 'Customer', action: 'Update' }
  )
  multiplePermissions() {
    return { message: 'success' };
  }

  @Get('convenience-decorator')
  @RequireCustomerRead()
  convenienceDecorator() {
    return { message: 'success' };
  }

  @Get('no-permissions')
  noPermissions() {
    return { message: 'success' };
  }
}

describe('RequirePermissions Decorator Integration', () => {
  let module: TestingModule;
  let guard: PermissionGuard;
  let reflector: Reflector;
  let permissionService: jest.Mocked<PermissionService>;
  let tenantContextService: jest.Mocked<TenantContextService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockPermissionService = {
      hasPermission: jest.fn(),
      validateUserTenantAccess: jest.fn(),
    };

    const mockTenantContextService = {
      setTenantContext: jest.fn(),
    };

    const mockJwtService = {
      verify: jest.fn(),
    };

    module = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        PermissionGuard,
        Reflector,
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    guard = module.get<PermissionGuard>(PermissionGuard);
    reflector = module.get<Reflector>(Reflector);
    permissionService = module.get(PermissionService);
    tenantContextService = module.get(TenantContextService);
    jwtService = module.get(JwtService);
  });

  afterEach(async () => {
    await module.close();
  });

  const createMockExecutionContext = (methodName: string): ExecutionContext => {
    const request = {
      user: { user_id: 'user-123', tenant_id: 'tenant-456' },
      headers: {},
    };

    const handler = TestController.prototype[methodName];
    
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => handler,
      getClass: () => TestController,
    } as ExecutionContext;
  };

  describe('Metadata Extraction', () => {
    it('should extract single permission from RequirePermission decorator', () => {
      const context = createMockExecutionContext('singlePermission');
      
      const permissions = reflector.getAllAndOverride(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()]
      );

      expect(permissions).toEqual([
        { entityType: 'Customer', action: 'Read' }
      ]);
    });

    it('should extract multiple permissions from RequirePermissions decorator', () => {
      const context = createMockExecutionContext('multiplePermissions');
      
      const permissions = reflector.getAllAndOverride(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()]
      );

      expect(permissions).toEqual([
        { entityType: 'Customer', action: 'Read' },
        { entityType: 'Customer', action: 'Update' }
      ]);
    });

    it('should extract permission from convenience decorator', () => {
      const context = createMockExecutionContext('convenienceDecorator');
      
      const permissions = reflector.getAllAndOverride(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()]
      );

      expect(permissions).toEqual([
        { entityType: 'Customer', action: 'Read' }
      ]);
    });

    it('should return undefined for methods without permission decorators', () => {
      const context = createMockExecutionContext('noPermissions');
      
      const permissions = reflector.getAllAndOverride(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()]
      );

      expect(permissions).toBeUndefined();
    });
  });

  describe('Guard Integration', () => {
    it('should allow access when user has required single permission', async () => {
      const context = createMockExecutionContext('singlePermission');
      permissionService.hasPermission.mockResolvedValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(permissionService.hasPermission).toHaveBeenCalledWith(
        'user-123',
        'tenant-456',
        'Customer',
        'Read'
      );
      expect(tenantContextService.setTenantContext).toHaveBeenCalledWith(
        'tenant-456',
        'user-123'
      );
    });

    it('should allow access when user has all required multiple permissions', async () => {
      const context = createMockExecutionContext('multiplePermissions');
      permissionService.hasPermission.mockResolvedValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(permissionService.hasPermission).toHaveBeenCalledTimes(2);
      expect(permissionService.hasPermission).toHaveBeenNthCalledWith(
        1,
        'user-123',
        'tenant-456',
        'Customer',
        'Read'
      );
      expect(permissionService.hasPermission).toHaveBeenNthCalledWith(
        2,
        'user-123',
        'tenant-456',
        'Customer',
        'Update'
      );
    });

    it('should deny access when user lacks required permission', async () => {
      const context = createMockExecutionContext('singlePermission');
      permissionService.hasPermission.mockResolvedValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Missing permission: Read on Customer'
      );
    });

    it('should deny access when user lacks one of multiple required permissions', async () => {
      const context = createMockExecutionContext('multiplePermissions');
      permissionService.hasPermission
        .mockResolvedValueOnce(true)  // First permission granted
        .mockResolvedValueOnce(false); // Second permission denied

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Missing permission: Update on Customer'
      );
    });

    it('should allow access when no permissions are required', async () => {
      const context = createMockExecutionContext('noPermissions');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(permissionService.hasPermission).not.toHaveBeenCalled();
    });

    it('should work with convenience decorators', async () => {
      const context = createMockExecutionContext('convenienceDecorator');
      permissionService.hasPermission.mockResolvedValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(permissionService.hasPermission).toHaveBeenCalledWith(
        'user-123',
        'tenant-456',
        'Customer',
        'Read'
      );
    });
  });

  describe('Tenant Context Handling', () => {
    it('should use X-Tenant-ID header when provided', async () => {
      const context = createMockExecutionContext('singlePermission');
      const request = context.switchToHttp().getRequest();
      request.headers['x-tenant-id'] = 'header-tenant-789';
      
      permissionService.hasPermission.mockResolvedValue(true);

      await guard.canActivate(context);

      expect(permissionService.hasPermission).toHaveBeenCalledWith(
        'user-123',
        'header-tenant-789',
        'Customer',
        'Read'
      );
      expect(tenantContextService.setTenantContext).toHaveBeenCalledWith(
        'header-tenant-789',
        'user-123'
      );
    });

    it('should fall back to JWT tenant_id when no header provided', async () => {
      const context = createMockExecutionContext('singlePermission');
      permissionService.hasPermission.mockResolvedValue(true);

      await guard.canActivate(context);

      expect(permissionService.hasPermission).toHaveBeenCalledWith(
        'user-123',
        'tenant-456',
        'Customer',
        'Read'
      );
    });

    it('should throw UnauthorizedException when no tenant context available', async () => {
      const context = createMockExecutionContext('singlePermission');
      const request = context.switchToHttp().getRequest();
      request.user = { user_id: 'user-123' }; // No tenant_id

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Tenant context is required'
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw UnauthorizedException when no user in request', async () => {
      const context = createMockExecutionContext('singlePermission');
      const request = context.switchToHttp().getRequest();
      request.user = null;

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Authentication required'
      );
    });

    it('should handle permission service errors gracefully', async () => {
      const context = createMockExecutionContext('singlePermission');
      permissionService.hasPermission.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Permission check failed for Customer:Read'
      );
    });

    it('should handle invalid entity type errors', async () => {
      const context = createMockExecutionContext('singlePermission');
      permissionService.hasPermission.mockRejectedValue(
        new Error('Invalid entity type: Customer')
      );

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid entity type: Customer'
      );
    });
  });
});