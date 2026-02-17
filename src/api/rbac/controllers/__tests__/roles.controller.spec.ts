import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from '../roles.controller';
import { RoleService } from '../../services/role.service';
import { TenantContextService } from '../../services/tenant-context.service';
import { PermissionService } from '../../services/permission.service';
import { PermissionGuard } from '../../guards/permission.guard';
import { Reflector } from '@nestjs/core';

describe('RolesController', () => {
  let controller: RolesController;
  let roleService: RoleService;
  let tenantContextService: TenantContextService;

  const mockTenantId = 'test-tenant-id';
  const mockModuleId = 'test-module-id';
  const mockPermissionId = 'test-permission-id';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RoleService,
          useValue: {
            getEnabledModulesForTenant: jest.fn(),
            getAllPermissions: jest.fn(),
            getTenantRoles: jest.fn(),
            getRoleById: jest.fn(),
            getRolePermissions: jest.fn(),
            getUsersWithRole: jest.fn(),
            createRole: jest.fn(),
            updateRole: jest.fn(),
            deleteRole: jest.fn(),
            assignPermissionToRole: jest.fn(),
            removePermissionFromRole: jest.fn(),
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
          provide: PermissionService,
          useValue: {
            hasPermission: jest.fn(),
            getUserPermissions: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
    roleService = module.get<RoleService>(RoleService);
    tenantContextService = module.get<TenantContextService>(TenantContextService);
  });

  describe('getAvailablePermissions', () => {
    it('should return permissions grouped by module for enabled modules', async () => {
      const mockModule = {
        id: mockModuleId,
        name: 'Users Module',
        code: 'users',
        description: 'User management module',
      };

      const mockTenantModule = {
        id: 'tenant-module-id',
        tenant_id: mockTenantId,
        module_id: mockModuleId,
        module: mockModule,
        is_enabled: true,
      };

      const mockPermissions = [
        {
          id: 'perm-1',
          module_id: mockModuleId,
          entity_type: 'User',
          action: 'Create',
          description: 'Create users',
          entity_registry: { code: 'User' },
        },
        {
          id: 'perm-2',
          module_id: mockModuleId,
          entity_type: 'User',
          action: 'Read',
          description: 'Read users',
          entity_registry: { code: 'User' },
        },
        {
          id: 'perm-3',
          module_id: mockModuleId,
          entity_type: 'User',
          action: 'Update',
          description: 'Update users',
          entity_registry: { code: 'User' },
        },
      ];

      jest.spyOn(tenantContextService, 'getCurrentTenantId').mockReturnValue(mockTenantId);
      jest.spyOn(roleService, 'getEnabledModulesForTenant').mockResolvedValue([mockTenantModule]);
      jest.spyOn(roleService, 'getAllPermissions').mockResolvedValue(mockPermissions);

      const result = await controller.getAvailablePermissions();

      expect(result).toEqual({
        modules: [
          {
            id: mockModuleId,
            name: 'Users Module',
            code: 'users',
            permissions: [
              {
                id: 'perm-1',
                entity: 'User',
                action: 'Create',
                description: 'Create users',
              },
              {
                id: 'perm-2',
                entity: 'User',
                action: 'Read',
                description: 'Read users',
              },
              {
                id: 'perm-3',
                entity: 'User',
                action: 'Update',
                description: 'Update users',
              },
            ],
          },
        ],
      });

      expect(roleService.getEnabledModulesForTenant).toHaveBeenCalledWith(mockTenantId);
      expect(roleService.getAllPermissions).toHaveBeenCalled();
    });

    it('should filter permissions to only enabled modules', async () => {
      const mockModule1 = {
        id: 'module-1',
        name: 'Leads Module',
        code: 'leads',
      };

      const mockModule2 = {
        id: 'module-2',
        name: 'Users Module',
        code: 'users',
      };

      const mockTenantModules = [
        {
          id: 'tm-1',
          tenant_id: mockTenantId,
          module_id: 'module-1',
          module: mockModule1,
          is_enabled: true,
        },
        {
          id: 'tm-2',
          tenant_id: mockTenantId,
          module_id: 'module-2',
          module: mockModule2,
          is_enabled: true,
        },
      ];

      const mockPermissions = [
        {
          id: 'perm-1',
          module_id: 'module-1',
          entity_type: 'Lead',
          action: 'Create',
          description: 'Create leads',
          entity_registry: { code: 'Lead' },
        },
        {
          id: 'perm-2',
          module_id: 'module-2',
          entity_type: 'User',
          action: 'Create',
          description: 'Create users',
          entity_registry: { code: 'User' },
        },
        {
          id: 'perm-3',
          module_id: 'module-3', // Not enabled
          entity_type: 'Customer',
          action: 'Create',
          description: 'Create customers',
          entity_registry: { code: 'Customer' },
        },
      ];

      jest.spyOn(tenantContextService, 'getCurrentTenantId').mockReturnValue(mockTenantId);
      jest.spyOn(roleService, 'getEnabledModulesForTenant').mockResolvedValue(mockTenantModules);
      jest.spyOn(roleService, 'getAllPermissions').mockResolvedValue(mockPermissions);

      const result = await controller.getAvailablePermissions();

      // Should only include permissions from enabled modules
      expect(result.modules).toHaveLength(2);
      expect(result.modules[0].permissions).toHaveLength(1);
      expect(result.modules[1].permissions).toHaveLength(1);
      
      // Modules are sorted by name, so Leads comes before Users
      expect(result.modules[0].name).toBe('Leads Module');
      expect(result.modules[0].permissions[0].entity).toBe('Lead');
      expect(result.modules[1].name).toBe('Users Module');
      expect(result.modules[1].permissions[0].entity).toBe('User');
    });

    it('should sort permissions by entity and action within each module', async () => {
      const mockModule = {
        id: mockModuleId,
        name: 'Users Module',
        code: 'users',
      };

      const mockTenantModule = {
        id: 'tenant-module-id',
        tenant_id: mockTenantId,
        module_id: mockModuleId,
        module: mockModule,
        is_enabled: true,
      };

      const mockPermissions = [
        {
          id: 'perm-3',
          module_id: mockModuleId,
          entity_type: 'User',
          action: 'Update',
          description: 'Update users',
          entity_registry: { code: 'User' },
        },
        {
          id: 'perm-1',
          module_id: mockModuleId,
          entity_type: 'User',
          action: 'Create',
          description: 'Create users',
          entity_registry: { code: 'User' },
        },
        {
          id: 'perm-2',
          module_id: mockModuleId,
          entity_type: 'User',
          action: 'Read',
          description: 'Read users',
          entity_registry: { code: 'User' },
        },
      ];

      jest.spyOn(tenantContextService, 'getCurrentTenantId').mockReturnValue(mockTenantId);
      jest.spyOn(roleService, 'getEnabledModulesForTenant').mockResolvedValue([mockTenantModule]);
      jest.spyOn(roleService, 'getAllPermissions').mockResolvedValue(mockPermissions);

      const result = await controller.getAvailablePermissions();

      // Permissions should be sorted by action
      expect(result.modules[0].permissions[0].action).toBe('Create');
      expect(result.modules[0].permissions[1].action).toBe('Read');
      expect(result.modules[0].permissions[2].action).toBe('Update');
    });

    it('should throw error when tenant context is missing', async () => {
      jest.spyOn(tenantContextService, 'getCurrentTenantId').mockReturnValue(null);

      await expect(controller.getAvailablePermissions()).rejects.toThrow('Tenant context is required');
    });
  });
});
