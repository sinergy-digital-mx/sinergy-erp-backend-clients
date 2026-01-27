import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { RoleTemplateService } from '../role-template.service';
import { PermissionService } from '../permission.service';
import { Role } from '../../../../entities/rbac/role.entity';
import { Permission } from '../../../../entities/rbac/permission.entity';
import { RolePermission } from '../../../../entities/rbac/role-permission.entity';
import { EntityRegistry } from '../../../../entities/entity-registry/entity-registry.entity';
import { 
  SYSTEM_ROLE_TEMPLATES, 
  getRoleTemplateByName,
  validateRoleTemplate,
  createCustomRoleTemplate 
} from '../../templates/role-templates';

describe('RoleTemplateService', () => {
  let service: RoleTemplateService;
  let roleRepository: jest.Mocked<Repository<Role>>;
  let permissionRepository: jest.Mocked<Repository<Permission>>;
  let rolePermissionRepository: jest.Mocked<Repository<RolePermission>>;
  let entityRegistryRepository: jest.Mocked<Repository<EntityRegistry>>;
  let permissionService: jest.Mocked<PermissionService>;

  const mockRole = {
    id: 'role-1',
    name: 'Admin',
    description: 'Full access to all entities and actions',
    tenant_id: 'tenant-1',
    is_system_role: true,
    created_at: new Date(),
    updated_at: new Date(),
  } as Role;

  const mockPermission = {
    id: 'permission-1',
    entity_type: 'Customer',
    action: 'Read',
    description: 'Read permission for Customer',
    is_system_permission: false,
    created_at: new Date(),
    updated_at: new Date(),
  } as Permission;

  const mockEntityRegistry = [
    { id: '1', code: 'Customer', name: 'Customer' },
    { id: '2', code: 'Lead', name: 'Lead' },
    { id: '3', code: 'User', name: 'User' },
  ] as EntityRegistry[];

  beforeEach(async () => {
    const mockRoleRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockPermissionRepository = {
      createQueryBuilder: jest.fn(),
    };

    const mockRolePermissionRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockEntityRegistryRepository = {
      find: jest.fn(),
    };

    const mockPermissionService = {
      validateEntityType: jest.fn(),
      findPermission: jest.fn(),
      createPermission: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleTemplateService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionRepository,
        },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: mockRolePermissionRepository,
        },
        {
          provide: getRepositoryToken(EntityRegistry),
          useValue: mockEntityRegistryRepository,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<RoleTemplateService>(RoleTemplateService);
    roleRepository = module.get(getRepositoryToken(Role));
    permissionRepository = module.get(getRepositoryToken(Permission));
    rolePermissionRepository = module.get(getRepositoryToken(RolePermission));
    entityRegistryRepository = module.get(getRepositoryToken(EntityRegistry));
    permissionService = module.get(PermissionService);

    // Setup default mocks
    entityRegistryRepository.find.mockResolvedValue(mockEntityRegistry);
    permissionService.validateEntityType.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRoleFromTemplate', () => {
    it('should create a role from a valid template', async () => {
      const template = getRoleTemplateByName('Admin')!;
      const tenantId = 'tenant-1';

      roleRepository.findOne.mockResolvedValue(null); // Role doesn't exist
      roleRepository.create.mockReturnValue(mockRole);
      roleRepository.save.mockResolvedValue(mockRole);
      permissionService.findPermission.mockResolvedValue(mockPermission);
      rolePermissionRepository.findOne.mockResolvedValue(null);
      rolePermissionRepository.create.mockReturnValue({} as RolePermission);
      rolePermissionRepository.save.mockResolvedValue({} as RolePermission);

      const result = await service.createRoleFromTemplate(template, tenantId);

      expect(result.role).toEqual(mockRole);
      expect(roleRepository.create).toHaveBeenCalledWith({
        name: template.name,
        description: template.description,
        tenant_id: tenantId,
        is_system_role: true,
      });
      expect(roleRepository.save).toHaveBeenCalledWith(mockRole);
    });

    it('should skip creation if role already exists and skipExisting is true', async () => {
      const template = getRoleTemplateByName('Admin')!;
      const tenantId = 'tenant-1';

      roleRepository.findOne.mockResolvedValue(mockRole); // Role exists

      const result = await service.createRoleFromTemplate(template, tenantId, true);

      expect(result.role).toEqual(mockRole);
      expect(result.warnings).toContain('Role Admin already exists');
      expect(roleRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if role exists and skipExisting is false', async () => {
      const template = getRoleTemplateByName('Admin')!;
      const tenantId = 'tenant-1';

      roleRepository.findOne.mockResolvedValue(mockRole); // Role exists

      await expect(
        service.createRoleFromTemplate(template, tenantId, false)
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for invalid template', async () => {
      const invalidTemplate = {
        name: '',
        description: 'Invalid template',
        permissions: [],
      };

      await expect(
        service.createRoleFromTemplate(invalidTemplate as any, 'tenant-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle wildcard permissions correctly', async () => {
      const template = getRoleTemplateByName('Admin')!; // Has wildcard permissions
      const tenantId = 'tenant-1';

      roleRepository.findOne.mockResolvedValue(null);
      roleRepository.create.mockReturnValue(mockRole);
      roleRepository.save.mockResolvedValue(mockRole);
      permissionService.findPermission.mockResolvedValue(null);
      permissionService.createPermission.mockResolvedValue(mockPermission);
      rolePermissionRepository.findOne.mockResolvedValue(null);
      rolePermissionRepository.create.mockReturnValue({} as RolePermission);
      rolePermissionRepository.save.mockResolvedValue({} as RolePermission);

      const result = await service.createRoleFromTemplate(template, tenantId);

      expect(result.role).toEqual(mockRole);
      expect(result.permissionsCreated).toBeGreaterThan(0);
      expect(result.permissionsAssigned).toBeGreaterThan(0);
    });
  });

  describe('createSystemRolesForTenant', () => {
    it('should create all system roles for a tenant', async () => {
      const tenantId = 'tenant-1';

      roleRepository.findOne.mockResolvedValue(null); // No roles exist
      roleRepository.create.mockReturnValue(mockRole);
      roleRepository.save.mockResolvedValue(mockRole);
      permissionService.findPermission.mockResolvedValue(mockPermission);
      rolePermissionRepository.findOne.mockResolvedValue(null);
      rolePermissionRepository.create.mockReturnValue({} as RolePermission);
      rolePermissionRepository.save.mockResolvedValue({} as RolePermission);

      const result = await service.createSystemRolesForTenant(tenantId);

      expect(result.totalRoles).toBe(SYSTEM_ROLE_TEMPLATES.length);
      expect(result.roles).toHaveLength(SYSTEM_ROLE_TEMPLATES.length);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle errors gracefully when creating individual roles', async () => {
      const tenantId = 'tenant-1';

      roleRepository.findOne.mockResolvedValue(null);
      roleRepository.create.mockReturnValue(mockRole);
      roleRepository.save
        .mockResolvedValueOnce(mockRole) // First role succeeds
        .mockRejectedValueOnce(new Error('Database error')) // Second role fails
        .mockResolvedValueOnce(mockRole); // Third role succeeds

      const result = await service.createSystemRolesForTenant(tenantId);

      expect(result.totalRoles).toBe(2); // Only successful roles
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Database error');
    });
  });

  describe('createRoleFromSystemTemplate', () => {
    it('should create role from existing system template', async () => {
      const tenantId = 'tenant-1';

      roleRepository.findOne.mockResolvedValue(null);
      roleRepository.create.mockReturnValue(mockRole);
      roleRepository.save.mockResolvedValue(mockRole);
      permissionService.findPermission.mockResolvedValue(mockPermission);
      rolePermissionRepository.findOne.mockResolvedValue(null);
      rolePermissionRepository.create.mockReturnValue({} as RolePermission);
      rolePermissionRepository.save.mockResolvedValue({} as RolePermission);

      const result = await service.createRoleFromSystemTemplate('Admin', tenantId);

      expect(result.role).toEqual(mockRole);
    });

    it('should throw BadRequestException for non-existent template', async () => {
      await expect(
        service.createRoleFromSystemTemplate('NonExistent', 'tenant-1')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createRoleFromCustomTemplate', () => {
    it('should create role from custom template', async () => {
      const tenantId = 'tenant-1';
      const permissions = [
        { entityType: 'Customer', actions: ['Read', 'Update'] },
      ];

      roleRepository.findOne.mockResolvedValue(null);
      roleRepository.create.mockReturnValue(mockRole);
      roleRepository.save.mockResolvedValue(mockRole);
      permissionService.findPermission.mockResolvedValue(mockPermission);
      rolePermissionRepository.findOne.mockResolvedValue(null);
      rolePermissionRepository.create.mockReturnValue({} as RolePermission);
      rolePermissionRepository.save.mockResolvedValue({} as RolePermission);

      const result = await service.createRoleFromCustomTemplate(
        'CustomRole',
        'Custom role description',
        permissions,
        tenantId
      );

      expect(result.role).toEqual(mockRole);
    });

    it('should throw error for invalid custom template', async () => {
      await expect(
        service.createRoleFromCustomTemplate(
          '', // Invalid name
          'Description',
          [],
          'tenant-1'
        )
      ).rejects.toThrow();
    });
  });

  describe('getSystemRoleTemplates', () => {
    it('should return all system role templates', () => {
      const templates = service.getSystemRoleTemplates();

      expect(templates).toHaveLength(SYSTEM_ROLE_TEMPLATES.length);
      expect(templates).toEqual(SYSTEM_ROLE_TEMPLATES);
    });
  });

  describe('getSystemRoleTemplate', () => {
    it('should return specific system role template', () => {
      const template = service.getSystemRoleTemplate('Admin');

      expect(template).toBeDefined();
      expect(template?.name).toBe('Admin');
    });

    it('should return undefined for non-existent template', () => {
      const template = service.getSystemRoleTemplate('NonExistent');

      expect(template).toBeUndefined();
    });
  });

  describe('updateRoleToMatchTemplate', () => {
    it('should update role to match template', async () => {
      const template = getRoleTemplateByName('Operator')!;
      const roleId = 'role-1';

      roleRepository.findOne.mockResolvedValue(mockRole);
      roleRepository.save.mockResolvedValue(mockRole);

      // Mock existing permissions query
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPermission]),
      };
      permissionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      permissionService.findPermission.mockResolvedValue(mockPermission);
      rolePermissionRepository.findOne.mockResolvedValue(null);
      rolePermissionRepository.create.mockReturnValue({} as RolePermission);
      rolePermissionRepository.save.mockResolvedValue({} as RolePermission);

      const result = await service.updateRoleToMatchTemplate(roleId, template);

      expect(result.role).toEqual(mockRole);
      expect(roleRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for non-existent role', async () => {
      const template = getRoleTemplateByName('Admin')!;

      roleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateRoleToMatchTemplate('non-existent', template)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateRoleAgainstTemplate', () => {
    it('should validate role matches template', async () => {
      const template = getRoleTemplateByName('Viewer')!;
      const roleId = 'role-1';

      // Mock role permissions that match template
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { entity_type: 'Customer', action: 'Read' },
          { entity_type: 'Lead', action: 'Read' },
        ]),
      };
      permissionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.validateRoleAgainstTemplate(roleId, template);

      expect(result.matches).toBe(true);
      expect(result.missingPermissions).toHaveLength(0);
      expect(result.extraPermissions).toHaveLength(0);
    });

    it('should identify missing permissions', async () => {
      const template = getRoleTemplateByName('Viewer')!;
      const roleId = 'role-1';

      // Mock role permissions that are missing some from template
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { entity_type: 'Customer', action: 'Read' },
          // Missing Lead:Read
        ]),
      };
      permissionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.validateRoleAgainstTemplate(roleId, template);

      expect(result.matches).toBe(false);
      expect(result.missingPermissions).toContain('Lead:Read');
      expect(result.extraPermissions).toHaveLength(0);
    });
  });
});

// Test role template utility functions
describe('Role Template Utilities', () => {
  describe('validateRoleTemplate', () => {
    it('should validate correct template', () => {
      const validTemplate = {
        name: 'TestRole',
        description: 'Test role description',
        permissions: [
          { entityType: 'Customer', actions: ['Read'] },
        ],
      };

      expect(validateRoleTemplate(validTemplate)).toBe(true);
    });

    it('should reject template with missing name', () => {
      const invalidTemplate = {
        name: '',
        description: 'Test role description',
        permissions: [
          { entityType: 'Customer', actions: ['Read'] },
        ],
      };

      expect(validateRoleTemplate(invalidTemplate)).toBe(false);
    });

    it('should reject template with empty permissions', () => {
      const invalidTemplate = {
        name: 'TestRole',
        description: 'Test role description',
        permissions: [],
      };

      expect(validateRoleTemplate(invalidTemplate)).toBe(false);
    });

    it('should reject template with invalid permission structure', () => {
      const invalidTemplate = {
        name: 'TestRole',
        description: 'Test role description',
        permissions: [
          { entityType: 'Customer', actions: [] }, // Empty actions
        ],
      };

      expect(validateRoleTemplate(invalidTemplate)).toBe(false);
    });
  });

  describe('createCustomRoleTemplate', () => {
    it('should create valid custom template', () => {
      const template = createCustomRoleTemplate(
        'CustomRole',
        'Custom description',
        [{ entityType: 'Customer', actions: ['Read'] }]
      );

      expect(template.name).toBe('CustomRole');
      expect(template.description).toBe('Custom description');
      expect(template.isSystemRole).toBe(false);
      expect(template.permissions).toHaveLength(1);
    });

    it('should throw error for invalid template data', () => {
      expect(() => {
        createCustomRoleTemplate(
          '', // Invalid name
          'Description',
          [{ entityType: 'Customer', actions: ['Read'] }]
        );
      }).toThrow('Invalid role template structure');
    });
  });
});