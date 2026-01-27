import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PermissionService } from '../permission.service';
import { Permission } from '../../../../entities/rbac/permission.entity';
import { UserRole } from '../../../../entities/rbac/user-role.entity';
import { RolePermission } from '../../../../entities/rbac/role-permission.entity';
import { EntityRegistry } from '../../../../entities/entity-registry/entity-registry.entity';
import { TenantContextService } from '../tenant-context.service';
import { PermissionCacheService } from '../permission-cache.service';

describe('PermissionService', () => {
  let service: PermissionService;
  let permissionRepository: jest.Mocked<Repository<Permission>>;
  let userRoleRepository: jest.Mocked<Repository<UserRole>>;
  let rolePermissionRepository: jest.Mocked<Repository<RolePermission>>;
  let entityRegistryRepository: jest.Mocked<Repository<EntityRegistry>>;
  let permissionCacheService: jest.Mocked<PermissionCacheService>;

  const mockPermission: Permission = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    entity_type: 'Customer',
    action: 'Read',
    description: 'Read customer data',
    is_system_permission: false,
    role_permissions: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockEntityRegistry: EntityRegistry = {
    id: 1,
    code: 'Customer',
    name: 'Customer Entity',
  };

  beforeEach(async () => {
    const mockPermissionRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockUserRoleRepository = {
      createQueryBuilder: jest.fn(),
    };

    const mockRolePermissionRepository = {
      createQueryBuilder: jest.fn(),
    };

    const mockEntityRegistryRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const mockTenantContextService = {
      getCurrentTenantId: jest.fn(),
      getCurrentUserId: jest.fn(),
      setTenantContext: jest.fn(),
      hasContext: jest.fn(),
      clearContext: jest.fn(),
      validateContext: jest.fn(),
    };

    const mockPermissionCacheService = {
      getUserPermissions: jest.fn(),
      setUserPermissions: jest.fn(),
      invalidateUserPermissions: jest.fn(),
      invalidateRolePermissions: jest.fn(),
      invalidateTenantPermissions: jest.fn(),
      clearAllCache: jest.fn(),
      getCacheStats: jest.fn(),
      getCacheHitRatio: jest.fn(),
      warmCache: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionRepository,
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: mockUserRoleRepository,
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
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
        {
          provide: PermissionCacheService,
          useValue: mockPermissionCacheService,
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    permissionRepository = module.get(getRepositoryToken(Permission));
    userRoleRepository = module.get(getRepositoryToken(UserRole));
    rolePermissionRepository = module.get(getRepositoryToken(RolePermission));
    entityRegistryRepository = module.get(getRepositoryToken(EntityRegistry));
    permissionCacheService = module.get(PermissionCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateEntityType', () => {
    it('should return true for valid entity type', async () => {
      entityRegistryRepository.findOne.mockResolvedValue(mockEntityRegistry);

      const result = await service.validateEntityType('Customer');

      expect(result).toBe(true);
      expect(entityRegistryRepository.findOne).toHaveBeenCalledWith({
        where: { code: 'Customer' },
      });
    });

    it('should return false for invalid entity type', async () => {
      entityRegistryRepository.findOne.mockResolvedValue(null);

      const result = await service.validateEntityType('InvalidEntity');

      expect(result).toBe(false);
      expect(entityRegistryRepository.findOne).toHaveBeenCalledWith({
        where: { code: 'InvalidEntity' },
      });
    });
  });

  describe('createPermission', () => {
    it('should create a new permission successfully', async () => {
      entityRegistryRepository.findOne.mockResolvedValue(mockEntityRegistry);
      permissionRepository.findOne.mockResolvedValue(null);
      permissionRepository.create.mockReturnValue(mockPermission);
      permissionRepository.save.mockResolvedValue(mockPermission);

      const result = await service.createPermission('Customer', 'Read', 'Read customer data');

      expect(result).toEqual(mockPermission);
      expect(permissionRepository.create).toHaveBeenCalledWith({
        entity_type: 'Customer',
        action: 'Read',
        description: 'Read customer data',
        is_system_permission: false,
      });
      expect(permissionRepository.save).toHaveBeenCalledWith(mockPermission);
    });

    it('should throw BadRequestException for invalid entity type', async () => {
      entityRegistryRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createPermission('InvalidEntity', 'Read'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if permission already exists', async () => {
      entityRegistryRepository.findOne.mockResolvedValue(mockEntityRegistry);
      permissionRepository.findOne.mockResolvedValue(mockPermission);

      await expect(
        service.createPermission('Customer', 'Read'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has permission (cache hit)', async () => {
      entityRegistryRepository.findOne.mockResolvedValue(mockEntityRegistry);
      permissionCacheService.getUserPermissions.mockResolvedValue([mockPermission]);

      const result = await service.hasPermission('user-id', 'tenant-id', 'Customer', 'Read');

      expect(result).toBe(true);
      expect(permissionCacheService.getUserPermissions).toHaveBeenCalledWith('user-id', 'tenant-id');
    });

    it('should return true when user has permission (cache miss)', async () => {
      entityRegistryRepository.findOne.mockResolvedValue(mockEntityRegistry);
      permissionCacheService.getUserPermissions.mockResolvedValue(null);
      
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPermission]),
      };
      
      permissionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.hasPermission('user-id', 'tenant-id', 'Customer', 'Read');

      expect(result).toBe(true);
      expect(permissionCacheService.getUserPermissions).toHaveBeenCalledWith('user-id', 'tenant-id');
      expect(permissionCacheService.setUserPermissions).toHaveBeenCalledWith('user-id', 'tenant-id', [mockPermission]);
    });

    it('should return false when user does not have permission', async () => {
      entityRegistryRepository.findOne.mockResolvedValue(mockEntityRegistry);
      permissionCacheService.getUserPermissions.mockResolvedValue([]);

      const result = await service.hasPermission('user-id', 'tenant-id', 'Customer', 'Write');

      expect(result).toBe(false);
    });

    it('should throw RBACValidationException for invalid entity type', async () => {
      entityRegistryRepository.findOne.mockResolvedValue(null);

      await expect(
        service.hasPermission('user-id', 'tenant-id', 'InvalidEntity', 'Read'),
      ).rejects.toThrow('The specified entity type is not recognized by the system');
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions from cache', async () => {
      const mockPermissions = [mockPermission];
      permissionCacheService.getUserPermissions.mockResolvedValue(mockPermissions);

      const result = await service.getUserPermissions('user-id', 'tenant-id');

      expect(result).toEqual(mockPermissions);
      expect(permissionCacheService.getUserPermissions).toHaveBeenCalledWith('user-id', 'tenant-id');
    });

    it('should fetch and cache user permissions on cache miss', async () => {
      const mockPermissions = [mockPermission];
      permissionCacheService.getUserPermissions.mockResolvedValue(null);
      
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockPermissions),
      };
      
      permissionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getUserPermissions('user-id', 'tenant-id');

      expect(result).toEqual(mockPermissions);
      expect(permissionCacheService.getUserPermissions).toHaveBeenCalledWith('user-id', 'tenant-id');
      expect(permissionCacheService.setUserPermissions).toHaveBeenCalledWith('user-id', 'tenant-id', mockPermissions);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('ur.user_id = :userId', { userId: 'user-id' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('ur.tenant_id = :tenantId', { tenantId: 'tenant-id' });
    });
  });

  describe('getSupportedActions', () => {
    it('should return supported actions', () => {
      const result = service.getSupportedActions();

      expect(result).toEqual([
        'Create',
        'Read',
        'Update',
        'Delete',
        'Export',
        'Import',
        'Download_Report',
        'Bulk_Update',
        'Bulk_Delete',
      ]);
    });
  });

  describe('validateAction', () => {
    it('should return true for valid action', () => {
      const result = service.validateAction('Read');
      expect(result).toBe(true);
    });

    it('should return false for invalid action', () => {
      const result = service.validateAction('InvalidAction');
      expect(result).toBe(false);
    });
  });

  describe('getAvailableEntityTypes', () => {
    it('should return available entity types', async () => {
      const mockEntities = [
        { code: 'Customer' },
        { code: 'Lead' },
        { code: 'User' },
      ];
      
      entityRegistryRepository.find.mockResolvedValue(mockEntities);

      const result = await service.getAvailableEntityTypes();

      expect(result).toEqual(['Customer', 'Lead', 'User']);
      expect(entityRegistryRepository.find).toHaveBeenCalledWith({
        select: ['code'],
      });
    });
  });

  describe('findPermission', () => {
    it('should find permission by entity type and action', async () => {
      permissionRepository.findOne.mockResolvedValue(mockPermission);

      const result = await service.findPermission('Customer', 'Read');

      expect(result).toEqual(mockPermission);
      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: { entity_type: 'Customer', action: 'Read' },
      });
    });

    it('should return null if permission not found', async () => {
      permissionRepository.findOne.mockResolvedValue(null);

      const result = await service.findPermission('Customer', 'Read');

      expect(result).toBeNull();
    });
  });

  describe('getAllPermissions', () => {
    it('should return all permissions ordered by entity type and action', async () => {
      const mockPermissions = [mockPermission];
      permissionRepository.find.mockResolvedValue(mockPermissions);

      const result = await service.getAllPermissions();

      expect(result).toEqual(mockPermissions);
      expect(permissionRepository.find).toHaveBeenCalledWith({
        order: { entity_type: 'ASC', action: 'ASC' },
      });
    });
  });
});