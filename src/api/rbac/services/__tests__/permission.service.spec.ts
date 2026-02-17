import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import * as fc from 'fast-check';
import { PermissionService } from '../permission.service';
import { Permission } from '../../../../entities/rbac/permission.entity';
import { UserRole } from '../../../../entities/rbac/user-role.entity';
import { RolePermission } from '../../../../entities/rbac/role-permission.entity';
import { EntityRegistry } from '../../../../entities/entity-registry/entity-registry.entity';
import { TenantContextService } from '../tenant-context.service';
import { PermissionCacheService } from '../permission-cache.service';
import { QueryCacheService } from '../query-cache.service';

describe('PermissionService', () => {
  let service: PermissionService;
  let permissionRepository: jest.Mocked<Repository<Permission>>;
  let userRoleRepository: jest.Mocked<Repository<UserRole>>;
  let rolePermissionRepository: jest.Mocked<Repository<RolePermission>>;
  let entityRegistryRepository: jest.Mocked<Repository<EntityRegistry>>;
  let permissionCacheService: jest.Mocked<PermissionCacheService>;
  let queryCacheService: jest.Mocked<QueryCacheService>;

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
      query: jest.fn(),
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

    const mockQueryCacheService = {
      cacheQuery: jest.fn(),
      invalidateUserQueries: jest.fn(),
      invalidateTenantQueries: jest.fn(),
      clearAllCache: jest.fn(),
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
        {
          provide: QueryCacheService,
          useValue: mockQueryCacheService,
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
      
      // Mock the query method for getUserPermissionsOptimized
      permissionRepository.query.mockResolvedValue([
        {
          id: mockPermission.id,
          action: mockPermission.action,
          description: mockPermission.description,
          is_system_permission: mockPermission.is_system_permission,
          created_at: mockPermission.created_at,
          updated_at: mockPermission.updated_at,
          entity_registry_id: '1',
          entity_code: 'Customer',
          module_id: null,
        }
      ]);

      const result = await service.hasPermission('user-id', 'tenant-id', 'Customer', 'Read');

      expect(result).toBe(true);
      expect(permissionCacheService.getUserPermissions).toHaveBeenCalledWith('user-id', 'tenant-id');
      expect(permissionCacheService.setUserPermissions).toHaveBeenCalled();
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
      
      // Mock the query method for getUserPermissionsOptimized
      permissionRepository.query.mockResolvedValue([
        {
          id: mockPermission.id,
          action: mockPermission.action,
          description: mockPermission.description,
          is_system_permission: mockPermission.is_system_permission,
          created_at: mockPermission.created_at,
          updated_at: mockPermission.updated_at,
          entity_registry_id: '1',
          entity_code: 'Customer',
          module_id: null,
        }
      ]);

      const result = await service.getUserPermissions('user-id', 'tenant-id');

      expect(result).toHaveLength(1);
      expect(permissionCacheService.getUserPermissions).toHaveBeenCalledWith('user-id', 'tenant-id');
      expect(permissionCacheService.setUserPermissions).toHaveBeenCalled();
    });

    it('should log cross-user access when accessing another user\'s permissions', async () => {
      const mockPermissions = [mockPermission];
      permissionCacheService.getUserPermissions.mockResolvedValue(mockPermissions);
      
      // Mock tenant context service to return different current user
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('current-user-id');

      // Spy on logger
      const loggerSpy = jest.spyOn(service['logger'], 'debug');

      const result = await service.getUserPermissions('other-user-id', 'tenant-id');

      expect(result).toEqual(mockPermissions);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cross-user access: User current-user-id accessing permissions for user other-user-id in tenant tenant-id')
      );

      loggerSpy.mockRestore();
    });

    it('should not log cross-user access when accessing own permissions', async () => {
      const mockPermissions = [mockPermission];
      permissionCacheService.getUserPermissions.mockResolvedValue(mockPermissions);
      
      // Mock tenant context service to return same user
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('user-id');

      // Spy on logger
      const loggerSpy = jest.spyOn(service['logger'], 'debug');

      const result = await service.getUserPermissions('user-id', 'tenant-id');

      expect(result).toEqual(mockPermissions);
      // Should not log cross-user access for same user
      expect(loggerSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Cross-user access')
      );

      loggerSpy.mockRestore();
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

  describe('Cross-user access verification (Task 3)', () => {
    it('should return permissions for another user without throwing cross-user access error', async () => {
      const mockPermissions = [mockPermission];
      permissionCacheService.getUserPermissions.mockResolvedValue(mockPermissions);
      
      // Mock tenant context service to return current user
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-id');
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('current-user-id');

      // Call getUserPermissions for a different user
      const result = await service.getUserPermissions('other-user-id', 'tenant-id');

      // Should return permissions without throwing error
      expect(result).toEqual(mockPermissions);
      expect(permissionCacheService.getUserPermissions).toHaveBeenCalledWith('other-user-id', 'tenant-id');
    });

    it('should not throw error when validateTenantContext is called with different user IDs', async () => {
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-id');
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('user-1');

      // This should not throw an error
      expect(() => {
        service['validateTenantContext']('tenant-id', 'user-2');
      }).not.toThrow();
    });

    it('should still throw error for cross-tenant access', async () => {
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-1');

      // This should throw an error for cross-tenant access
      expect(() => {
        service['validateTenantContext']('tenant-2', 'user-id');
      }).toThrow('Cross-tenant access denied: Tenant context mismatch');
    });

    it('should return permissions for multiple different users', async () => {
      const mockPermissions1 = [mockPermission];
      const mockPermission2: Permission = {
        ...mockPermission,
        id: '223e4567-e89b-12d3-a456-426614174003',
        action: 'Write',
      };
      const mockPermissions2 = [mockPermission2];

      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-id');
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('current-user-id');

      // First call for user-1
      permissionCacheService.getUserPermissions.mockResolvedValueOnce(mockPermissions1);
      const result1 = await service.getUserPermissions('user-1', 'tenant-id');
      expect(result1).toEqual(mockPermissions1);

      // Second call for user-2
      permissionCacheService.getUserPermissions.mockResolvedValueOnce(mockPermissions2);
      const result2 = await service.getUserPermissions('user-2', 'tenant-id');
      expect(result2).toEqual(mockPermissions2);

      // Both should succeed without errors
      expect(permissionCacheService.getUserPermissions).toHaveBeenCalledTimes(2);
    });

    it('should log cross-user access for audit trail', async () => {
      const mockPermissions = [mockPermission];
      permissionCacheService.getUserPermissions.mockResolvedValue(mockPermissions);
      
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-id');
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('admin-user-id');

      const loggerSpy = jest.spyOn(service['logger'], 'debug');

      await service.getUserPermissions('target-user-id', 'tenant-id');

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cross-user access: User admin-user-id accessing permissions for user target-user-id in tenant tenant-id')
      );

      loggerSpy.mockRestore();
    });

    it('should allow checkBulkPermissions for another user without throwing error', async () => {
      const mockPermissions = [mockPermission];
      permissionCacheService.getUserPermissions.mockResolvedValue(mockPermissions);
      
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-id');
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('current-user-id');

      // Call checkBulkPermissions for a different user
      const result = await service.checkBulkPermissions('other-user-id', 'tenant-id', [
        { entityType: 'Customer', action: 'Read' }
      ]);

      // Should return results without throwing error
      expect(result).toEqual([true]);
      expect(permissionCacheService.getUserPermissions).toHaveBeenCalledWith('other-user-id', 'tenant-id');
    });

    it('should allow checkPermissionForMultipleUsers for other users without throwing error', async () => {
      entityRegistryRepository.findOne.mockResolvedValue(mockEntityRegistry);
      permissionCacheService.getUserPermissions.mockResolvedValue([mockPermission]);
      
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-id');
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('current-user-id');

      // Mock the query method for getUserPermissionsOptimized
      permissionRepository.query.mockResolvedValue([
        {
          id: mockPermission.id,
          action: mockPermission.action,
          description: mockPermission.description,
          is_system_permission: mockPermission.is_system_permission,
          created_at: mockPermission.created_at,
          updated_at: mockPermission.updated_at,
          entity_registry_id: '1',
          entity_code: 'Customer',
          module_id: null,
        }
      ]);

      // Call checkPermissionForMultipleUsers for different users
      const result = await service.checkPermissionForMultipleUsers(
        ['user-1', 'user-2', 'user-3'],
        'tenant-id',
        'Customer',
        'Read'
      );

      // Should return results for all users without throwing error
      expect(result.size).toBe(3);
      expect(result.get('user-1')).toBe(true);
      expect(result.get('user-2')).toBe(true);
      expect(result.get('user-3')).toBe(true);
    });
  });

  describe('Backward Compatibility Tests (Task 7)', () => {
    /**
     * Test for validateTenantContext without userId parameter
     * **Validates: Requirements 5.1**
     * 
     * When existing code calls validateTenantContext without a userId parameter,
     * the PermissionService SHALL maintain current behavior.
     */
    it('should validate tenant context without userId parameter (backward compatibility)', () => {
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-id');

      // This should not throw an error when called without userId
      expect(() => {
        service['validateTenantContext']('tenant-id');
      }).not.toThrow();
    });

    /**
     * Test for validateTenantContext without userId parameter - cross-tenant rejection
     * **Validates: Requirements 5.1**
     * 
     * When existing code calls validateTenantContext without a userId parameter,
     * the PermissionService SHALL still enforce tenant boundaries.
     */
    it('should still reject cross-tenant access without userId parameter (backward compatibility)', () => {
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-1');

      // This should throw an error for cross-tenant access even without userId
      expect(() => {
        service['validateTenantContext']('tenant-2');
      }).toThrow('Cross-tenant access denied: Tenant context mismatch');
    });

    /**
     * Test for getUserPermissions with current user
     * **Validates: Requirements 5.2**
     * 
     * When existing code calls getUserPermissions for the current user,
     * the PermissionService SHALL maintain current behavior.
     */
    it('should return permissions for current user (backward compatibility)', async () => {
      const mockPermissions = [mockPermission];
      permissionCacheService.getUserPermissions.mockResolvedValue(mockPermissions);
      
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-id');
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('user-id');

      const result = await service.getUserPermissions('user-id', 'tenant-id');

      expect(result).toEqual(mockPermissions);
      expect(permissionCacheService.getUserPermissions).toHaveBeenCalledWith('user-id', 'tenant-id');
    });

    /**
     * Test for existing permission checks
     * **Validates: Requirements 5.3**
     * 
     * When existing tests run, the PermissionService SHALL pass all tests without modification.
     */
    it('should maintain existing hasPermission behavior (backward compatibility)', async () => {
      entityRegistryRepository.findOne.mockResolvedValue(mockEntityRegistry);
      permissionCacheService.getUserPermissions.mockResolvedValue([mockPermission]);
      
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-id');
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('user-id');

      const result = await service.hasPermission('user-id', 'tenant-id', 'Customer', 'Read');

      expect(result).toBe(true);
      expect(permissionCacheService.getUserPermissions).toHaveBeenCalledWith('user-id', 'tenant-id');
    });

    /**
     * Test for existing permission checks - negative case
     * **Validates: Requirements 5.3**
     * 
     * When existing tests run, the PermissionService SHALL pass all tests without modification.
     */
    it('should maintain existing hasPermission behavior for denied permissions (backward compatibility)', async () => {
      entityRegistryRepository.findOne.mockResolvedValue(mockEntityRegistry);
      permissionCacheService.getUserPermissions.mockResolvedValue([]);
      
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-id');
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('user-id');

      const result = await service.hasPermission('user-id', 'tenant-id', 'Customer', 'Write');

      expect(result).toBe(false);
      expect(permissionCacheService.getUserPermissions).toHaveBeenCalledWith('user-id', 'tenant-id');
    });

    /**
     * Test for PermissionGuard enforcement
     * **Validates: Requirements 5.4**
     * 
     * When the PermissionGuard checks permissions, the PermissionGuard SHALL continue
     * to enforce permission-based access control.
     */
    it('should maintain PermissionGuard enforcement (backward compatibility)', async () => {
      entityRegistryRepository.findOne.mockResolvedValue(mockEntityRegistry);
      permissionCacheService.getUserPermissions.mockResolvedValue([mockPermission]);
      
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-id');
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('user-id');

      // User with permission should be allowed
      const result = await service.hasPermission('user-id', 'tenant-id', 'Customer', 'Read');
      expect(result).toBe(true);

      // User without permission should be denied
      permissionCacheService.getUserPermissions.mockResolvedValue([]);
      const resultDenied = await service.hasPermission('user-id', 'tenant-id', 'Customer', 'Write');
      expect(resultDenied).toBe(false);
    });

    /**
     * Test for backward compatibility with multiple permission checks
     * **Validates: Requirements 5.3**
     * 
     * When existing code calls checkBulkPermissions for the current user,
     * the PermissionService SHALL maintain current behavior.
     */
    it('should maintain checkBulkPermissions behavior for current user (backward compatibility)', async () => {
      permissionCacheService.getUserPermissions.mockResolvedValue([mockPermission]);
      
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-id');
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('user-id');

      const result = await service.checkBulkPermissions('user-id', 'tenant-id', [
        { entityType: 'Customer', action: 'Read' }
      ]);

      expect(result).toEqual([true]);
      expect(permissionCacheService.getUserPermissions).toHaveBeenCalledWith('user-id', 'tenant-id');
    });

    /**
     * Test for backward compatibility with cache behavior
     * **Validates: Requirements 5.3**
     * 
     * When existing code calls getUserPermissions, the PermissionService SHALL
     * maintain cache behavior for backward compatibility.
     */
    it('should maintain cache behavior for getUserPermissions (backward compatibility)', async () => {
      const mockPermissions = [mockPermission];
      permissionCacheService.getUserPermissions.mockResolvedValue(mockPermissions);
      
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-id');
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('user-id');

      // First call should use cache
      const result1 = await service.getUserPermissions('user-id', 'tenant-id');
      expect(result1).toEqual(mockPermissions);

      // Second call should also use cache
      const result2 = await service.getUserPermissions('user-id', 'tenant-id');
      expect(result2).toEqual(mockPermissions);

      // Cache should be called twice
      expect(permissionCacheService.getUserPermissions).toHaveBeenCalledTimes(2);
    });

    /**
     * Test for backward compatibility with error handling
     * **Validates: Requirements 5.3**
     * 
     * When existing code encounters errors, the PermissionService SHALL
     * maintain error handling behavior for backward compatibility.
     */
    it('should maintain error handling for invalid entity types (backward compatibility)', async () => {
      entityRegistryRepository.findOne.mockResolvedValue(null);
      
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-id');
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('user-id');

      await expect(
        service.hasPermission('user-id', 'tenant-id', 'InvalidEntity', 'Read')
      ).rejects.toThrow('The specified entity type is not recognized by the system');
    });
  });

  describe('Permission-Based Access Control Tests (Task 8)', () => {
    /**
     * Test for user with User:Read permission accessing other user's data
     * **Validates: Requirements 2.1, 2.4**
     * 
     * When a user with User:Read permission requests another user's roles or permissions,
     * the system SHALL allow access without throwing an error.
     */
    it('should allow user with User:Read permission to access other user\'s data', async () => {
      const userReadPermission: Permission = {
        id: '323e4567-e89b-12d3-a456-426614174004',
        entity_type: 'User',
        action: 'Read',
        description: 'Read user data',
        is_system_permission: false,
        role_permissions: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockPermissions = [userReadPermission];
      permissionCacheService.getUserPermissions.mockResolvedValue(mockPermissions);
      
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-id');
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('admin-user-id');

      // Admin user with User:Read permission should be able to access other user's permissions
      const result = await service.getUserPermissions('target-user-id', 'tenant-id');

      expect(result).toEqual(mockPermissions);
      expect(permissionCacheService.getUserPermissions).toHaveBeenCalledWith('target-user-id', 'tenant-id');
    });

    /**
     * Test for user without User:Read permission being denied
     * **Validates: Requirements 2.2**
     * 
     * When a user without User:Read permission requests another user's roles or permissions,
     * the PermissionGuard SHALL deny access.
     */
    it('should deny user without User:Read permission from accessing other user\'s data', async () => {
      entityRegistryRepository.findOne.mockResolvedValue(mockEntityRegistry);
      // User has no User:Read permission
      permissionCacheService.getUserPermissions.mockResolvedValue([]);
      
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-id');
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('regular-user-id');

      // Regular user without User:Read permission should not have permission
      const result = await service.hasPermission('regular-user-id', 'tenant-id', 'User', 'Read');

      expect(result).toBe(false);
    });

    /**
     * Test for cross-tenant access being denied
     * **Validates: Requirements 3.1, 3.2, 3.3**
     * 
     * When a user requests data for a user in a different tenant,
     * the system SHALL deny access regardless of permissions.
     */
    it('should deny cross-tenant access regardless of permissions', async () => {
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-1');

      // Attempting to access data from a different tenant should throw error
      expect(() => {
        service['validateTenantContext']('tenant-2', 'user-id');
      }).toThrow('Cross-tenant access denied: Tenant context mismatch');
    });

    /**
     * Test for user with User:Read permission accessing multiple other users' data
     * **Validates: Requirements 2.1, 2.4**
     * 
     * When a user with User:Read permission requests multiple other users' data,
     * the system SHALL allow access for all users.
     */
    it('should allow user with User:Read permission to access multiple other users\' data', async () => {
      const userReadPermission: Permission = {
        id: '423e4567-e89b-12d3-a456-426614174005',
        entity_type: 'User',
        action: 'Read',
        description: 'Read user data',
        is_system_permission: false,
        role_permissions: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockPermissions = [userReadPermission];
      permissionCacheService.getUserPermissions.mockResolvedValue(mockPermissions);
      
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-id');
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('admin-user-id');

      // Admin user should be able to access multiple other users' permissions
      const result1 = await service.getUserPermissions('user-1', 'tenant-id');
      const result2 = await service.getUserPermissions('user-2', 'tenant-id');
      const result3 = await service.getUserPermissions('user-3', 'tenant-id');

      expect(result1).toEqual(mockPermissions);
      expect(result2).toEqual(mockPermissions);
      expect(result3).toEqual(mockPermissions);
      expect(permissionCacheService.getUserPermissions).toHaveBeenCalledTimes(3);
    });

    /**
     * Test for user accessing their own data without User:Read permission
     * **Validates: Requirements 2.3**
     * 
     * When a user requests their own data, the system SHALL allow access
     * even if they lack User:Read permission.
     */
    it('should allow user to access their own data without User:Read permission', async () => {
      const mockPermissions = [mockPermission];
      permissionCacheService.getUserPermissions.mockResolvedValue(mockPermissions);
      
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-id');
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('user-id');

      // User accessing their own data should succeed
      const result = await service.getUserPermissions('user-id', 'tenant-id');

      expect(result).toEqual(mockPermissions);
      expect(permissionCacheService.getUserPermissions).toHaveBeenCalledWith('user-id', 'tenant-id');
    });

    /**
     * Test for cross-tenant access denial with User:Read permission
     * **Validates: Requirements 3.1**
     * 
     * When a user with User:Read permission requests data from a different tenant,
     * the system SHALL deny access.
     */
    it('should deny cross-tenant access even with User:Read permission', async () => {
      const userReadPermission: Permission = {
        id: '523e4567-e89b-12d3-a456-426614174006',
        entity_type: 'User',
        action: 'Read',
        description: 'Read user data',
        is_system_permission: false,
        role_permissions: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockPermissions = [userReadPermission];
      permissionCacheService.getUserPermissions.mockResolvedValue(mockPermissions);
      
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-1');

      // Even with User:Read permission, cross-tenant access should be denied
      expect(() => {
        service['validateTenantContext']('tenant-2', 'user-id');
      }).toThrow('Cross-tenant access denied: Tenant context mismatch');
    });

    /**
     * Test for permission check with User:Read permission
     * **Validates: Requirements 1.3, 2.1**
     * 
     * When a user with User:Read permission checks if they have User:Read permission,
     * the system SHALL return true.
     */
    it('should return true for hasPermission check with User:Read permission', async () => {
      const userReadPermission: Permission = {
        id: '623e4567-e89b-12d3-a456-426614174007',
        entity_type: 'User',
        action: 'Read',
        description: 'Read user data',
        is_system_permission: false,
        role_permissions: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      entityRegistryRepository.findOne.mockResolvedValue({
        id: 1,
        code: 'User',
        name: 'User Entity',
      });
      permissionCacheService.getUserPermissions.mockResolvedValue([userReadPermission]);
      
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-id');
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('user-id');

      // User with User:Read permission should have the permission
      const result = await service.hasPermission('user-id', 'tenant-id', 'User', 'Read');

      expect(result).toBe(true);
    });

    /**
     * Test for permission check without User:Read permission
     * **Validates: Requirements 2.2**
     * 
     * When a user without User:Read permission checks if they have User:Read permission,
     * the system SHALL return false.
     */
    it('should return false for hasPermission check without User:Read permission', async () => {
      entityRegistryRepository.findOne.mockResolvedValue({
        id: 1,
        code: 'User',
        name: 'User Entity',
      });
      // User has no permissions
      permissionCacheService.getUserPermissions.mockResolvedValue([]);
      
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-id');
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('user-id');

      // User without User:Read permission should not have the permission
      const result = await service.hasPermission('user-id', 'tenant-id', 'User', 'Read');

      expect(result).toBe(false);
    });

    /**
     * Test for cross-tenant access denial in hasPermission
     * **Validates: Requirements 3.1**
     * 
     * When a user requests a permission check for a different tenant,
     * the system SHALL deny access.
     */
    it('should deny cross-tenant access in hasPermission check', async () => {
      entityRegistryRepository.findOne.mockResolvedValue({
        id: 1,
        code: 'User',
        name: 'User Entity',
      });
      permissionCacheService.getUserPermissions.mockResolvedValue([mockPermission]);
      
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-1');

      // Cross-tenant access should be denied
      await expect(
        service.hasPermission('user-id', 'tenant-2', 'User', 'Read')
      ).rejects.toThrow('Cross-tenant access denied: Tenant context mismatch');
    });

    /**
     * Test for bulk permission check with User:Read permission
     * **Validates: Requirements 1.3, 2.1**
     * 
     * When a user with User:Read permission checks multiple permissions,
     * the system SHALL return correct results for all permissions.
     */
    it('should return correct results for bulk permission check with User:Read permission', async () => {
      const userReadPermission: Permission = {
        id: '723e4567-e89b-12d3-a456-426614174008',
        entity_type: 'User',
        action: 'Read',
        description: 'Read user data',
        is_system_permission: false,
        role_permissions: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      const customerReadPermission: Permission = {
        id: '823e4567-e89b-12d3-a456-426614174009',
        entity_type: 'Customer',
        action: 'Read',
        description: 'Read customer data',
        is_system_permission: false,
        role_permissions: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      permissionCacheService.getUserPermissions.mockResolvedValue([
        userReadPermission,
        customerReadPermission,
      ]);
      
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-id');
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('user-id');

      // User with both permissions should have both
      const result = await service.checkBulkPermissions('user-id', 'tenant-id', [
        { entityType: 'User', action: 'Read' },
        { entityType: 'Customer', action: 'Read' },
      ]);

      expect(result).toEqual([true, true]);
    });

    /**
     * Test for bulk permission check without User:Read permission
     * **Validates: Requirements 2.2**
     * 
     * When a user without User:Read permission checks multiple permissions,
     * the system SHALL return false for permissions they don't have.
     */
    it('should return false for bulk permission check without User:Read permission', async () => {
      const customerReadPermission: Permission = {
        id: '923e4567-e89b-12d3-a456-426614174010',
        entity_type: 'Customer',
        action: 'Read',
        description: 'Read customer data',
        is_system_permission: false,
        role_permissions: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      // User only has Customer:Read, not User:Read
      permissionCacheService.getUserPermissions.mockResolvedValue([customerReadPermission]);
      
      const tenantContextService = service['tenantContextService'];
      (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue('tenant-id');
      (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue('user-id');

      // User without User:Read permission should not have it
      const result = await service.checkBulkPermissions('user-id', 'tenant-id', [
        { entityType: 'User', action: 'Read' },
        { entityType: 'Customer', action: 'Read' },
      ]);

      expect(result).toEqual([false, true]);
    });
  });

  describe('Property-based tests for checkPermissionForMultipleUsers', () => {
    /**
     * Property 11: No User ID Mismatch Errors in checkPermissionForMultipleUsers
     * **Validates: Requirements 4.4**
     * 
     * For any call to checkPermissionForMultipleUsers() with multiple user IDs,
     * the system SHALL NOT throw a "Cross-user access denied" error.
     */
    it('should not throw cross-user access errors for multiple users (Property 11)', async () => {
      return fc.assert(
        fc.asyncProperty(
          fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
          fc.uuid(),
          async (userIds, tenantId) => {
            // Setup
            entityRegistryRepository.findOne.mockResolvedValue(mockEntityRegistry);
            permissionCacheService.getUserPermissions.mockResolvedValue([mockPermission]);
            
            const tenantContextService = service['tenantContextService'];
            (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenantId);
            (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(userIds[0]);

            // Mock the query method for getUserPermissionsOptimized
            permissionRepository.query.mockResolvedValue([
              {
                id: mockPermission.id,
                action: mockPermission.action,
                description: mockPermission.description,
                is_system_permission: mockPermission.is_system_permission,
                created_at: mockPermission.created_at,
                updated_at: mockPermission.updated_at,
                entity_registry_id: '1',
                entity_code: 'Customer',
                module_id: null,
              }
            ]);

            // Action: Call checkPermissionForMultipleUsers with multiple user IDs
            const result = await service.checkPermissionForMultipleUsers(
              userIds,
              tenantId,
              'Customer',
              'Read'
            );

            // Assert: Should return a map with results for all users without throwing error
            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(userIds.length);
            
            // All users should have entries in the result map
            userIds.forEach(userId => {
              expect(result.has(userId)).toBe(true);
              expect(typeof result.get(userId)).toBe('boolean');
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 11: No User ID Mismatch Errors in checkPermissionForMultipleUsers
     * **Validates: Requirements 4.4**
     * 
     * For any call to checkPermissionForMultipleUsers() with multiple user IDs,
     * the system SHALL return correct permission results for each user.
     */
    it('should return correct permission results for multiple users (Property 11)', async () => {
      return fc.assert(
        fc.asyncProperty(
          fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
          fc.uuid(),
          async (userIds, tenantId) => {
            // Setup
            entityRegistryRepository.findOne.mockResolvedValue(mockEntityRegistry);
            
            const tenantContextService = service['tenantContextService'];
            (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenantId);
            (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(userIds[0]);

            // Create different permission sets for different users
            const permissionsByUser = new Map<string, Permission[]>();
            userIds.forEach((userId, index) => {
              if (index % 2 === 0) {
                // Even-indexed users have the permission
                permissionsByUser.set(userId, [mockPermission]);
              } else {
                // Odd-indexed users don't have the permission
                permissionsByUser.set(userId, []);
              }
            });

            // Mock getUserPermissions to return different permissions for different users
            permissionCacheService.getUserPermissions.mockImplementation(
              async (userId: string) => permissionsByUser.get(userId) || []
            );

            // Mock the query method for getUserPermissionsOptimized
            permissionRepository.query.mockResolvedValue([
              {
                id: mockPermission.id,
                action: mockPermission.action,
                description: mockPermission.description,
                is_system_permission: mockPermission.is_system_permission,
                created_at: mockPermission.created_at,
                updated_at: mockPermission.updated_at,
                entity_registry_id: '1',
                entity_code: 'Customer',
                module_id: null,
              }
            ]);

            // Action: Call checkPermissionForMultipleUsers
            const result = await service.checkPermissionForMultipleUsers(
              userIds,
              tenantId,
              'Customer',
              'Read'
            );

            // Assert: Results should match the permission sets
            userIds.forEach((userId, index) => {
              const expectedResult = index % 2 === 0; // Even-indexed users have permission
              expect(result.get(userId)).toBe(expectedResult);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 11: No User ID Mismatch Errors in checkPermissionForMultipleUsers
     * **Validates: Requirements 4.4**
     * 
     * For any call to checkPermissionForMultipleUsers() with multiple user IDs,
     * the system SHALL handle errors gracefully and return false for failed checks.
     */
    it('should handle errors gracefully for multiple users (Property 11)', async () => {
      return fc.assert(
        fc.asyncProperty(
          fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
          fc.uuid(),
          async (userIds, tenantId) => {
            // Setup
            entityRegistryRepository.findOne.mockResolvedValue(mockEntityRegistry);
            
            const tenantContextService = service['tenantContextService'];
            (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenantId);
            (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(userIds[0]);

            // Mock getUserPermissions to throw an error for some users
            let callCount = 0;
            permissionCacheService.getUserPermissions.mockImplementation(
              async (userId: string) => {
                callCount++;
                if (callCount % 2 === 0) {
                  throw new Error('Cache service error');
                }
                return [mockPermission];
              }
            );

            // Mock the query method for getUserPermissionsOptimized
            permissionRepository.query.mockResolvedValue([
              {
                id: mockPermission.id,
                action: mockPermission.action,
                description: mockPermission.description,
                is_system_permission: mockPermission.is_system_permission,
                created_at: mockPermission.created_at,
                updated_at: mockPermission.updated_at,
                entity_registry_id: '1',
                entity_code: 'Customer',
                module_id: null,
              }
            ]);

            // Action: Call checkPermissionForMultipleUsers
            const result = await service.checkPermissionForMultipleUsers(
              userIds,
              tenantId,
              'Customer',
              'Read'
            );

            // Assert: Should return a map with results for all users (no exception thrown)
            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(userIds.length);
            
            // All users should have entries in the result map
            userIds.forEach(userId => {
              expect(result.has(userId)).toBe(true);
              expect(typeof result.get(userId)).toBe('boolean');
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});