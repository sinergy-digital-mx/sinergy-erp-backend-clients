import { Test, TestingModule } from '@nestjs/testing';
import { UsersRolesController } from '../users-roles.controller';
import { RoleService } from '../../services/role.service';
import { PermissionService } from '../../services/permission.service';
import { TenantContextService } from '../../services/tenant-context.service';
import { UsersService } from '../../../users/users.service';

describe('UsersRolesController', () => {
  let controller: UsersRolesController;
  let usersService: UsersService;
  let tenantContextService: TenantContextService;

  const mockTenantId = 'test-tenant-id';
  const mockUserId = 'test-user-id';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersRolesController],
      providers: [
        {
          provide: RoleService,
          useValue: {
            getUserRoles: jest.fn(),
            getRolePermissions: jest.fn(),
            assignRoleToUser: jest.fn(),
            removeRoleFromUser: jest.fn(),
          },
        },
        {
          provide: PermissionService,
          useValue: {
            getUserPermissions: jest.fn(),
            hasPermission: jest.fn(),
          },
        },
        {
          provide: TenantContextService,
          useValue: {
            getCurrentTenantId: jest.fn(),
            getCurrentUserId: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersRolesController>(UsersRolesController);
    usersService = module.get<UsersService>(UsersService);
    tenantContextService = module.get<TenantContextService>(TenantContextService);
  });

  describe('getTenantUsers', () => {
    it('should return users with detailed information', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'john@example.com',
          first_name: 'John',
          last_name: 'Doe',
          phone: '+1234567890',
          language_code: 'es',
          last_login_at: new Date('2024-01-27T14:30:00Z'),
          created_at: new Date('2024-01-01T00:00:00Z'),
          status: { id: 'status-1', name: 'Active' },
          tenant_id: mockTenantId,
          tenant: { id: mockTenantId },
          password: 'hashed_password',
        },
        {
          id: 'user-2',
          email: 'jane@example.com',
          first_name: 'Jane',
          last_name: 'Smith',
          phone: '+0987654321',
          language_code: 'en',
          last_login_at: new Date('2024-01-26T10:00:00Z'),
          created_at: new Date('2024-01-02T00:00:00Z'),
          status: { id: 'status-1', name: 'Active' },
          tenant_id: mockTenantId,
          tenant: { id: mockTenantId },
          password: 'hashed_password',
        },
      ];

      jest.spyOn(tenantContextService, 'getCurrentTenantId').mockReturnValue(mockTenantId);
      jest.spyOn(usersService, 'findAll').mockResolvedValue(mockUsers as any);

      const result = await controller.getTenantUsers();

      expect(result.users).toHaveLength(2);
      expect(result.users[0]).toEqual({
        id: 'user-1',
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1234567890',
        status: { id: 'status-1', name: 'Active' },
        language_code: 'es',
        last_login_at: new Date('2024-01-27T14:30:00Z'),
        created_at: new Date('2024-01-01T00:00:00Z'),
      });
      expect(result.users[1]).toEqual({
        id: 'user-2',
        email: 'jane@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '+0987654321',
        status: { id: 'status-1', name: 'Active' },
        language_code: 'en',
        last_login_at: new Date('2024-01-26T10:00:00Z'),
        created_at: new Date('2024-01-02T00:00:00Z'),
      });

      expect(usersService.findAll).toHaveBeenCalledWith(mockTenantId);
    });

    it('should handle users with null optional fields', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user@example.com',
          first_name: null,
          last_name: null,
          phone: null,
          language_code: null,
          last_login_at: null,
          created_at: new Date('2024-01-01T00:00:00Z'),
          status: { id: 'status-1', name: 'Active' },
          tenant_id: mockTenantId,
          tenant: { id: mockTenantId },
          password: 'hashed_password',
        },
      ];

      jest.spyOn(tenantContextService, 'getCurrentTenantId').mockReturnValue(mockTenantId);
      jest.spyOn(usersService, 'findAll').mockResolvedValue(mockUsers as any);

      const result = await controller.getTenantUsers();

      expect(result.users).toHaveLength(1);
      expect(result.users[0]).toEqual({
        id: 'user-1',
        email: 'user@example.com',
        first_name: null,
        last_name: null,
        phone: null,
        status: { id: 'status-1', name: 'Active' },
        language_code: null,
        last_login_at: null,
        created_at: new Date('2024-01-01T00:00:00Z'),
      });
    });

    it('should throw error when tenant context is missing', async () => {
      jest.spyOn(tenantContextService, 'getCurrentTenantId').mockReturnValue(null);

      await expect(controller.getTenantUsers()).rejects.toThrow('Tenant context is required');
    });
  });
});
