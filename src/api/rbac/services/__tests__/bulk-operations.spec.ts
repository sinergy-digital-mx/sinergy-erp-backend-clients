import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionService } from '../permission.service';
import { Permission } from '../../../../entities/rbac/permission.entity';
import { UserRole } from '../../../../entities/rbac/user-role.entity';
import { RolePermission } from '../../../../entities/rbac/role-permission.entity';
import { EntityRegistry } from '../../../../entities/entity-registry/entity-registry.entity';
import { TenantContextService } from '../tenant-context.service';
import { PermissionCacheService } from '../permission-cache.service';
import { QueryCacheService } from '../query-cache.service';

describe('PermissionService - Bulk Operations', () => {
  let service: PermissionService;
  let permissionRepository: Repository<Permission>;
  let userRoleRepository: Repository<UserRole>;
  let rolePermissionRepository: Repository<RolePermission>;
  let entityRegistryRepository: Repository<EntityRegistry>;
  let tenantContextService: TenantContextService;
  let permissionCacheService: PermissionCacheService;
  let queryCacheService: QueryCacheService;

  const mockPermissionRepository = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    query: jest.fn(),
  };

  const mockUserRoleRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
    query: jest.fn(),
  };

  const mockRolePermissionRepository = {
    find: jest.fn(),
  };

  const mockEntityRegistryRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockTenantContextService = {
    getCurrentTenantId: jest.fn(),
    getCurrentUserId: jest.fn(),
  };

  const mockPermissionCacheService = {
    getUserPermissions: jest.fn(),
    setUserPermissions: jest.fn(),
    invalidateUserPermissions: jest.fn(),
    invalidateRolePermissions: jest.fn(),
    invalidateTenantPermissions: jest.fn(),
    warmCache: jest.fn(),
    getCacheStats: jest.fn(),
    getCacheHitRatio: jest.fn(),
    isUserPermissionsCached: jest.fn(),
  };

  const mockQueryCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    invalidate: jest.fn(),
    invalidatePattern: jest.fn(),
    invalidateTenantQueries: jest.fn(),
    invalidateUserQueries: jest.fn(),
    cacheQuery: jest.fn(),
    generateTenantQueryKey: jest.fn(),
    generateUserQueryKey: jest.fn(),
  };

  beforeEach(async () => {
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
    permissionRepository = module.get<Repository<Permission>>(getRepositoryToken(Permission));
    userRoleRepository = module.get<Repository<UserRole>>(getRepositoryToken(UserRole));
    rolePermissionRepository = module.get<Repository<RolePermission>>(getRepositoryToken(RolePermission));
    entityRegistryRepository = module.get<Repository<EntityRegistry>>(getRepositoryToken(EntityRegistry));
    tenantContextService = module.get<TenantContextService>(TenantContextService);
    permissionCacheService = module.get<PermissionCacheService>(PermissionCacheService);
    queryCacheService = module.get<QueryCacheService>(QueryCacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkBulkPermissions', () => {
    it('should check multiple permissions efficiently', async () => {
      const userId = 'user-1';
      const tenantId = 'tenant-1';
      const permissions = [
        { entityType: 'Customer', action: 'Read' },
        { entityType: 'Customer', action: 'Create' },
        { entityType: 'Lead', action: 'Read' },
      ];

      const mockUserPermissions = [
        { entity_type: 'Customer', action: 'Read' },
        { entity_type: 'Customer', action: 'Create' },
      ];

      mockTenantContextService.getCurrentTenantId.mockReturnValue(tenantId);
      mockTenantContextService.getCurrentUserId.mockReturnValue(userId);
      mockPermissionCacheService.getUserPermissions.mockResolvedValue(mockUserPermissions);

      const results = await service.checkBulkPermissions(userId, tenantId, permissions);

      expect(results).toEqual([true, true, false]);
      expect(mockPermissionCacheService.getUserPermissions).toHaveBeenCalledWith(userId, tenantId);
    });

    it('should handle empty permissions array', async () => {
      const userId = 'user-1';
      const tenantId = 'tenant-1';
      const permissions = [];

      mockTenantContextService.getCurrentTenantId.mockReturnValue(tenantId);
      mockTenantContextService.getCurrentUserId.mockReturnValue(userId);
      mockPermissionCacheService.getUserPermissions.mockResolvedValue([]);

      const results = await service.checkBulkPermissions(userId, tenantId, permissions);

      expect(results).toEqual([]);
    });
  });

  describe('checkPermissionForMultipleUsers', () => {
    it('should check permission for multiple users', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      const tenantId = 'tenant-1';
      const entityType = 'Customer';
      const action = 'Read';

      mockEntityRegistryRepository.findOne.mockResolvedValue({ code: entityType });

      // Mock hasPermission calls
      jest.spyOn(service, 'hasPermission')
        .mockResolvedValueOnce(true)  // user-1
        .mockResolvedValueOnce(false) // user-2
        .mockResolvedValueOnce(true); // user-3

      const results = await service.checkPermissionForMultipleUsers(userIds, tenantId, entityType, action);

      expect(results.get('user-1')).toBe(true);
      expect(results.get('user-2')).toBe(false);
      expect(results.get('user-3')).toBe(true);
      expect(service.hasPermission).toHaveBeenCalledTimes(3);
    });

    it('should handle invalid entity type', async () => {
      const userIds = ['user-1'];
      const tenantId = 'tenant-1';
      const entityType = 'InvalidEntity';
      const action = 'Read';

      mockEntityRegistryRepository.findOne.mockResolvedValue(null);

      await expect(
        service.checkPermissionForMultipleUsers(userIds, tenantId, entityType, action)
      ).rejects.toThrow('The specified entity type is not recognized by the system');
    });
  });

  describe('getBulkUserPermissions', () => {
    it('should fetch permissions for multiple users efficiently', async () => {
      const userIds = ['user-1', 'user-2'];
      const tenantId = 'tenant-1';

      const mockQueryResults = [
        {
          user_id: 'user-1',
          id: 'perm-1',
          entity_code: 'Customer',
          entity_registry_id: 1,
          action: 'Read',
          description: 'Read customers',
          is_system_permission: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          user_id: 'user-2',
          id: 'perm-2',
          entity_code: 'Lead',
          entity_registry_id: 2,
          action: 'Create',
          description: 'Create leads',
          is_system_permission: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockPermissionRepository.query.mockResolvedValue(mockQueryResults);

      const results = await service.getBulkUserPermissions(userIds, tenantId);

      expect(results.size).toBe(2);
      expect(results.get('user-1')).toHaveLength(1);
      expect(results.get('user-2')).toHaveLength(1);
      expect(results.get('user-1')[0].entity_type).toBe('Customer');
      expect(results.get('user-2')[0].entity_type).toBe('Lead');
    });

    it('should return empty map for empty user IDs', async () => {
      const userIds = [];
      const tenantId = 'tenant-1';

      const results = await service.getBulkUserPermissions(userIds, tenantId);

      expect(results.size).toBe(0);
      expect(mockPermissionRepository.query).not.toHaveBeenCalled();
    });
  });

  describe('filterItemsByPermission', () => {
    it('should return all items when user has permission', async () => {
      const userId = 'user-1';
      const tenantId = 'tenant-1';
      const items = [{ id: '1' }, { id: '2' }, { id: '3' }];
      const entityType = 'Customer';
      const action = 'Read';

      jest.spyOn(service, 'hasPermission').mockResolvedValue(true);

      const results = await service.filterItemsByPermission(
        userId,
        tenantId,
        items,
        entityType,
        action
      );

      expect(results).toEqual(items);
      expect(service.hasPermission).toHaveBeenCalledWith(userId, tenantId, entityType, action);
    });

    it('should return empty array when user lacks permission', async () => {
      const userId = 'user-1';
      const tenantId = 'tenant-1';
      const items = [{ id: '1' }, { id: '2' }, { id: '3' }];
      const entityType = 'Customer';
      const action = 'Read';

      jest.spyOn(service, 'hasPermission').mockResolvedValue(false);

      const results = await service.filterItemsByPermission(
        userId,
        tenantId,
        items,
        entityType,
        action
      );

      expect(results).toEqual([]);
      expect(service.hasPermission).toHaveBeenCalledWith(userId, tenantId, entityType, action);
    });
  });

  describe('getUsersWithPermission', () => {
    it('should find users with specific permission', async () => {
      const tenantId = 'tenant-1';
      const entityType = 'Customer';
      const action = 'Read';

      const mockPermission = { id: 'perm-1', entity_type: entityType, action };
      const mockUsers = [{ userId: 'user-1' }, { userId: 'user-2' }];

      jest.spyOn(service, 'findPermission').mockResolvedValue(mockPermission as any);
      mockUserRoleRepository.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockUsers),
      });

      mockEntityRegistryRepository.findOne.mockResolvedValue({ code: entityType });

      const results = await service.getUsersWithPermission(tenantId, entityType, action);

      expect(results).toEqual(['user-1', 'user-2']);
      expect(service.findPermission).toHaveBeenCalledWith(entityType, action);
    });

    it('should return empty array when permission not found', async () => {
      const tenantId = 'tenant-1';
      const entityType = 'Customer';
      const action = 'Read';

      jest.spyOn(service, 'findPermission').mockResolvedValue(null);
      mockEntityRegistryRepository.findOne.mockResolvedValue({ code: entityType });

      const results = await service.getUsersWithPermission(tenantId, entityType, action);

      expect(results).toEqual([]);
    });
  });

  describe('checkPermissionForMultipleEntities', () => {
    it('should grant all entities when user has base permission', async () => {
      const userId = 'user-1';
      const tenantId = 'tenant-1';
      const entityType = 'Customer';
      const action = 'Read';
      const entityIds = ['entity-1', 'entity-2', 'entity-3'];

      jest.spyOn(service, 'hasPermission').mockResolvedValue(true);

      const results = await service.checkPermissionForMultipleEntities(
        userId,
        tenantId,
        entityType,
        action,
        entityIds
      );

      expect(results.size).toBe(3);
      expect(results.get('entity-1')).toBe(true);
      expect(results.get('entity-2')).toBe(true);
      expect(results.get('entity-3')).toBe(true);
    });

    it('should deny all entities when user lacks base permission', async () => {
      const userId = 'user-1';
      const tenantId = 'tenant-1';
      const entityType = 'Customer';
      const action = 'Read';
      const entityIds = ['entity-1', 'entity-2', 'entity-3'];

      jest.spyOn(service, 'hasPermission').mockResolvedValue(false);

      const results = await service.checkPermissionForMultipleEntities(
        userId,
        tenantId,
        entityType,
        action,
        entityIds
      );

      expect(results.size).toBe(3);
      expect(results.get('entity-1')).toBe(false);
      expect(results.get('entity-2')).toBe(false);
      expect(results.get('entity-3')).toBe(false);
    });
  });
});