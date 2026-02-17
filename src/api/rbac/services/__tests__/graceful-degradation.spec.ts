import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionService } from '../permission.service';
import { PermissionCacheService } from '../permission-cache.service';
import { QueryCacheService } from '../query-cache.service';
import { TenantContextService } from '../tenant-context.service';
import { Permission } from '../../../../entities/rbac/permission.entity';
import { UserRole } from '../../../../entities/rbac/user-role.entity';
import { RolePermission } from '../../../../entities/rbac/role-permission.entity';
import { EntityRegistry } from '../../../../entities/entity-registry/entity-registry.entity';

describe('PermissionService - Graceful Degradation', () => {
  let service: PermissionService;
  let cacheService: PermissionCacheService;
  let permissionRepository: jest.Mocked<Repository<Permission>>;
  let entityRegistryRepository: jest.Mocked<Repository<EntityRegistry>>;

  beforeEach(async () => {
    const mockPermissionRepository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      }),
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      query: jest.fn().mockResolvedValue([]),
    };

    const mockUserRoleRepository = {
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const mockRolePermissionRepository = {
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const mockEntityRegistryRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      }),
    };

    const mockTenantContextService = {
      getCurrentTenantId: jest.fn().mockReturnValue('tenant-1'),
      getCurrentUserId: jest.fn().mockReturnValue('user-1'),
      setTenantContext: jest.fn(),
      hasContext: jest.fn(),
      clearContext: jest.fn(),
      validateContext: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: PermissionCacheService,
          useValue: {
            getUserPermissions: jest.fn(),
            setUserPermissions: jest.fn(),
            invalidateUserPermissions: jest.fn(),
            invalidateRolePermissions: jest.fn(),
            invalidateTenantPermissions: jest.fn(),
            clearAllCache: jest.fn(),
            getCacheStats: jest.fn(),
            getCacheHitRatio: jest.fn(),
            warmCache: jest.fn(),
          },
        },
        {
          provide: QueryCacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            clear: jest.fn(),
            getStats: jest.fn(),
            warmCache: jest.fn(),
          },
        },
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
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    cacheService = module.get<PermissionCacheService>(PermissionCacheService);
    permissionRepository = module.get(getRepositoryToken(Permission));
    entityRegistryRepository = module.get(getRepositoryToken(EntityRegistry));
  });

  afterEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Entity Registry Fallback', () => {
    it('should use fallback validation when Entity Registry is unavailable', async () => {
      // Mock Entity Registry failure
      entityRegistryRepository.findOne.mockRejectedValue(new Error('Database connection failed'));

      // Mock successful permission query
      const mockPermissions = [
        {
          id: '1',
          action: 'Read',
          description: 'Read customers',
          is_system_permission: false,
          created_at: new Date(),
          updated_at: new Date(),
          role_permissions: [],
          entity_registry: {
            id: 1,
            code: 'Customer',
            name: 'Customer',
          },
        },
      ];
      
      const queryBuilder = permissionRepository.createQueryBuilder();
      queryBuilder.getMany.mockResolvedValue(mockPermissions);

      // Should use fallback validation for known entity type
      const result = await service.hasPermission('user-1', 'tenant-1', 'Customer', 'Read');
      expect(result).toBe(true);
    });

    it('should reject unknown entity types when Entity Registry is unavailable', async () => {
      // Mock Entity Registry failure
      entityRegistryRepository.findOne.mockRejectedValue(new Error('Database connection failed'));

      // Should reject unknown entity type using fallback validation
      await expect(
        service.hasPermission('user-1', 'tenant-1', 'UnknownEntity', 'Read')
      ).rejects.toThrow('The specified entity type is not recognized by the system');
    });
  });

  describe('Cache Fallback', () => {
    it('should fall back to database when cache is unavailable', async () => {
      // Mock Entity Registry success
      entityRegistryRepository.findOne.mockResolvedValue({
        id: 1,
        code: 'Customer',
        name: 'Customer',
      });

      // Mock cache failure by making it throw an error
      jest.spyOn(cacheService, 'getUserPermissions').mockRejectedValue(new Error('Cache service unavailable'));

      // Mock successful database query
      const mockPermissions = [
        {
          id: '1',
          action: 'Read',
          description: 'Read customers',
          is_system_permission: false,
          created_at: new Date(),
          updated_at: new Date(),
          role_permissions: [],
          entity_registry: {
            id: 1,
            code: 'Customer',
            name: 'Customer',
          },
        },
      ];
      
      const queryBuilder = permissionRepository.createQueryBuilder();
      queryBuilder.getMany.mockResolvedValue(mockPermissions);

      // Should fall back to database and still work
      const result = await service.hasPermission('user-1', 'tenant-1', 'Customer', 'Read');
      expect(result).toBe(true);
    });

    it('should return false on critical database errors', async () => {
      // Mock Entity Registry success
      entityRegistryRepository.findOne.mockResolvedValue({
        id: 1,
        code: 'Customer',
        name: 'Customer',
      });

      // Mock cache failure
      jest.spyOn(cacheService, 'getUserPermissions').mockRejectedValue(new Error('Cache unavailable'));

      // Mock critical database error with ECONNREFUSED code
      const criticalError = new Error('ECONNREFUSED');
      (criticalError as any).code = 'ECONNREFUSED';
      
      const queryBuilder = permissionRepository.createQueryBuilder();
      queryBuilder.getMany.mockRejectedValue(criticalError);

      // Should return false (no permissions) due to graceful degradation
      const result = await service.hasPermission('user-1', 'tenant-1', 'Customer', 'Read');
      expect(result).toBe(false);
    });
  });

  describe('System Health Check', () => {
    it('should report healthy status when all services are working', async () => {
      // Mock all services as healthy
      permissionRepository.createQueryBuilder().getRawOne.mockResolvedValue({ '1': 1 });
      entityRegistryRepository.createQueryBuilder().getRawOne.mockResolvedValue({ '1': 1 });

      const health = await service.getSystemHealthStatus();

      expect(health.status).toBe('healthy');
      expect(health.services.database).toBe('healthy');
      expect(health.services.cache).toBe('healthy');
      expect(health.services.entityRegistry).toBe('healthy');
      expect(health.issues).toHaveLength(0);
    });

    it('should report degraded status when Entity Registry is unavailable', async () => {
      // Mock database as healthy
      permissionRepository.createQueryBuilder().getRawOne.mockResolvedValue({ '1': 1 });
      
      // Mock Entity Registry as unavailable
      entityRegistryRepository.createQueryBuilder().getRawOne.mockRejectedValue(new Error('Connection failed'));

      const health = await service.getSystemHealthStatus();

      expect(health.status).toBe('degraded');
      expect(health.services.database).toBe('healthy');
      expect(health.services.entityRegistry).toBe('degraded');
      expect(health.issues).toContain('Entity Registry unavailable - using fallback validation');
    });

    it('should report critical status when database is unavailable', async () => {
      // Mock database as unavailable
      permissionRepository.createQueryBuilder().getRawOne.mockRejectedValue(new Error('Database down'));
      
      // Mock Entity Registry as healthy
      entityRegistryRepository.createQueryBuilder().getRawOne.mockResolvedValue({ '1': 1 });

      const health = await service.getSystemHealthStatus();

      expect(health.status).toBe('critical');
      expect(health.services.database).toBe('critical');
      expect(health.issues).toContain('Database connectivity failed');
    });
  });

  describe('Graceful Degradation Mode', () => {
    it('should enable and disable graceful degradation mode', () => {
      // Test enabling graceful degradation
      service.setGracefulDegradationMode(true);
      expect((service as any).gracefulDegradationEnabled).toBe(true);

      // Test disabling graceful degradation
      service.setGracefulDegradationMode(false);
      expect((service as any).gracefulDegradationEnabled).toBe(false);
    });
  });

  describe('Edge Cases - Deleted Role/Entity References', () => {
    it('should handle deleted role references gracefully', async () => {
      // Mock Entity Registry success
      entityRegistryRepository.findOne.mockResolvedValue({
        id: 1,
        code: 'Customer',
        name: 'Customer',
      });

      // Mock cache miss
      jest.spyOn(cacheService, 'getUserPermissions').mockResolvedValue(null);

      // Mock scenario where user has a role assignment but the role is deleted
      const queryBuilder = permissionRepository.createQueryBuilder();
      queryBuilder.getMany.mockRejectedValue(new Error('Role not found'));

      // Should return false (no permissions) when role references are broken
      const result = await service.hasPermission('user-1', 'tenant-1', 'Customer', 'Read');
      expect(result).toBe(false);
    });

    it('should handle deleted entity references in permissions', async () => {
      // Mock Entity Registry returning null for deleted entity
      entityRegistryRepository.findOne.mockResolvedValue(null);

      // Should throw validation error for deleted entity type
      await expect(
        service.hasPermission('user-1', 'tenant-1', 'DeletedEntity', 'Read')
      ).rejects.toThrow('The specified entity type is not recognized by the system');
    });

    it('should handle orphaned user-role assignments', async () => {
      // Mock Entity Registry success
      entityRegistryRepository.findOne.mockResolvedValue({
        id: 1,
        code: 'Customer',
        name: 'Customer',
      });

      // Mock scenario where user-role exists but role is deleted
      // This should result in no permissions being returned
      const queryBuilder = permissionRepository.createQueryBuilder();
      queryBuilder.getMany.mockResolvedValue([]);

      const result = await service.hasPermission('user-1', 'tenant-1', 'Customer', 'Read');
      expect(result).toBe(false);
    });

    it('should handle orphaned role-permission assignments', async () => {
      // Mock Entity Registry success
      entityRegistryRepository.findOne.mockResolvedValue({
        id: 1,
        code: 'Customer',
        name: 'Customer',
      });

      // Mock scenario where role-permission exists but permission is deleted
      // This should result in empty permissions array
      const queryBuilder = permissionRepository.createQueryBuilder();
      queryBuilder.getMany.mockResolvedValue([]);

      const permissions = await service.getUserPermissions('user-1', 'tenant-1');
      expect(permissions).toEqual([]);
    });

    it('should handle deleted tenant references', async () => {
      // Mock Entity Registry success
      entityRegistryRepository.findOne.mockResolvedValue({
        id: 1,
        code: 'Customer',
        name: 'Customer',
      });

      // Mock cache miss
      jest.spyOn(cacheService, 'getUserPermissions').mockResolvedValue(null);

      // Mock scenario where tenant is deleted but user-role assignments remain
      const queryBuilder = permissionRepository.createQueryBuilder();
      queryBuilder.getMany.mockRejectedValue(new Error('Tenant not found'));

      // Should return false when tenant references are broken
      const result = await service.hasPermission('user-1', 'deleted-tenant', 'Customer', 'Read');
      expect(result).toBe(false);
    });
  });

  describe('Edge Cases - System Service Unavailability', () => {
    it('should handle complete database unavailability', async () => {
      // Mock Entity Registry failure
      entityRegistryRepository.findOne.mockRejectedValue(new Error('ECONNREFUSED'));

      // Mock cache miss
      jest.spyOn(cacheService, 'getUserPermissions').mockResolvedValue(null);

      // Mock all database operations failing
      permissionRepository.createQueryBuilder.mockImplementation(() => {
        const mockQueryBuilder = {
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          distinct: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockRejectedValue(new Error('ECONNREFUSED: Connection refused')),
        };
        return mockQueryBuilder;
      });

      // Should return false (deny access) when database is completely unavailable
      const result = await service.hasPermission('user-1', 'tenant-1', 'Customer', 'Read');
      expect(result).toBe(false);
    });

    it('should handle timeout errors gracefully', async () => {
      // Mock Entity Registry success
      entityRegistryRepository.findOne.mockResolvedValue({
        id: 1,
        code: 'Customer',
        name: 'Customer',
      });

      // Mock timeout error
      const timeoutError = new Error('Query timeout');
      timeoutError.name = 'TimeoutError';
      
      const queryBuilder = permissionRepository.createQueryBuilder();
      queryBuilder.getMany.mockRejectedValue(timeoutError);

      // Should return false when timeout occurs
      const result = await service.hasPermission('user-1', 'tenant-1', 'Customer', 'Read');
      expect(result).toBe(false);
    });

    it('should handle memory/resource errors', async () => {
      // Mock Entity Registry success
      entityRegistryRepository.findOne.mockResolvedValue({
        id: 1,
        code: 'Customer',
        name: 'Customer',
      });

      // Mock memory error
      const memoryError = new Error('JavaScript heap out of memory');
      memoryError.name = 'RangeError';
      
      const queryBuilder = permissionRepository.createQueryBuilder();
      queryBuilder.getMany.mockRejectedValue(memoryError);

      // Should return false when memory errors occur
      const result = await service.hasPermission('user-1', 'tenant-1', 'Customer', 'Read');
      expect(result).toBe(false);
    });

    it('should handle TypeORM connection errors', async () => {
      // Mock Entity Registry success
      entityRegistryRepository.findOne.mockResolvedValue({
        id: 1,
        code: 'Customer',
        name: 'Customer',
      });

      // Mock TypeORM connection error
      const connectionError = new Error('Connection not found');
      connectionError.name = 'ConnectionNotFoundError';
      
      const queryBuilder = permissionRepository.createQueryBuilder();
      queryBuilder.getMany.mockRejectedValue(connectionError);

      // Should return false when connection errors occur
      const result = await service.hasPermission('user-1', 'tenant-1', 'Customer', 'Read');
      expect(result).toBe(false);
    });

    it('should handle partial service degradation', async () => {
      // Mock Entity Registry failure but cache working
      entityRegistryRepository.findOne.mockRejectedValue(new Error('Registry service down'));
      
      // Mock cache returning permissions
      jest.spyOn(cacheService, 'getUserPermissions').mockResolvedValue([
        {
          id: '1',
          action: 'Read',
          description: 'Read customers',
          is_system_permission: false,
          created_at: new Date(),
          updated_at: new Date(),
          role_permissions: [],
          entity_registry: {
            id: 1,
            code: 'Customer',
            name: 'Customer',
          },
        },
      ]);

      // Should use fallback validation and still work with cached permissions
      const result = await service.hasPermission('user-1', 'tenant-1', 'Customer', 'Read');
      expect(result).toBe(true);
    });

    it('should handle cascading service failures', async () => {
      // Mock all services failing
      entityRegistryRepository.findOne.mockRejectedValue(new Error('Registry down'));
      jest.spyOn(cacheService, 'getUserPermissions').mockRejectedValue(new Error('Cache down'));
      
      const queryBuilder = permissionRepository.createQueryBuilder();
      queryBuilder.getMany.mockRejectedValue(new Error('Database down'));

      // Should return false when all services are down
      const result = await service.hasPermission('user-1', 'tenant-1', 'Customer', 'Read');
      expect(result).toBe(false);
    });

    it('should handle intermittent service failures', async () => {
      // Mock Entity Registry success
      entityRegistryRepository.findOne.mockResolvedValue({
        id: 1,
        code: 'Customer',
        name: 'Customer',
      });

      // Mock cache failure followed by database success
      jest.spyOn(cacheService, 'getUserPermissions').mockRejectedValue(new Error('Cache temporarily unavailable'));
      
      const queryBuilder = permissionRepository.createQueryBuilder();
      queryBuilder.getMany.mockResolvedValue([
        {
          id: '1',
          action: 'Read',
          description: 'Read customers',
          is_system_permission: false,
          created_at: new Date(),
          updated_at: new Date(),
          role_permissions: [],
          entity_registry: {
            id: 1,
            code: 'Customer',
            name: 'Customer',
          },
        },
      ]);

      // Should fall back to database and still work
      const result = await service.hasPermission('user-1', 'tenant-1', 'Customer', 'Read');
      expect(result).toBe(true);
    });

    it('should handle service recovery scenarios', async () => {
      // Mock initial failure followed by success
      let callCount = 0;
      entityRegistryRepository.findOne.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Service temporarily down');
        }
        return Promise.resolve({
          id: 1,
          code: 'Customer',
          name: 'Customer',
        });
      });

      // Mock cache miss
      jest.spyOn(cacheService, 'getUserPermissions').mockResolvedValue(null);

      // Mock successful database query for second call
      const queryBuilder = permissionRepository.createQueryBuilder();
      queryBuilder.getMany.mockResolvedValue([
        {
          id: '1',
          action: 'Read',
          description: 'Read customers',
          is_system_permission: false,
          created_at: new Date(),
          updated_at: new Date(),
          role_permissions: [],
          entity_registry: {
            id: 1,
            code: 'Customer',
            name: 'Customer',
          },
        },
      ]);

      // First call should use fallback validation and work
      const result1 = await service.hasPermission('user-1', 'tenant-1', 'Customer', 'Read');
      expect(result1).toBe(true); // Should work with fallback

      // Second call should use recovered service
      const result2 = await service.hasPermission('user-1', 'tenant-1', 'Customer', 'Read');
      expect(result2).toBe(true); // Should work with recovered service
    });
  });

  describe('Edge Cases - Data Consistency Issues', () => {
    it('should handle inconsistent permission data', async () => {
      // Mock Entity Registry success
      entityRegistryRepository.findOne.mockResolvedValue({
        id: 1,
        code: 'Customer',
        name: 'Customer',
      });

      // Mock permissions with inconsistent data (missing required fields)
      const queryBuilder = permissionRepository.createQueryBuilder();
      queryBuilder.getMany.mockResolvedValue([
        {
          id: '1',
          entity_type: null, // Inconsistent data
          action: 'Read',
          description: 'Read customers',
          is_system_permission: false,
          created_at: new Date(),
          updated_at: new Date(),
          role_permissions: [],
        },
      ]);

      // Should handle inconsistent data gracefully
      const result = await service.hasPermission('user-1', 'tenant-1', 'Customer', 'Read');
      expect(result).toBe(false); // Should not match due to null entity_type
    });

    it('should handle malformed permission objects', async () => {
      // Mock Entity Registry success
      entityRegistryRepository.findOne.mockResolvedValue({
        id: 1,
        code: 'Customer',
        name: 'Customer',
      });

      // Mock cache miss
      jest.spyOn(cacheService, 'getUserPermissions').mockResolvedValue(null);

      // Mock malformed permission objects
      const queryBuilder = permissionRepository.createQueryBuilder();
      queryBuilder.getMany.mockResolvedValue([
        null, // Null permission
        undefined, // Undefined permission
        {}, // Empty permission object
        {
          id: '1',
          action: 'Read',
          // Missing other required fields
          entity_registry: {
            id: 1,
            code: 'Customer',
            name: 'Customer',
          },
        },
      ]);

      // Should handle malformed data gracefully and find the valid permission
      const result = await service.hasPermission('user-1', 'tenant-1', 'Customer', 'Read');
      expect(result).toBe(true); // Should find the valid permission
    });

    it('should handle duplicate permission entries', async () => {
      // Mock Entity Registry success
      entityRegistryRepository.findOne.mockResolvedValue({
        id: 1,
        code: 'Customer',
        name: 'Customer',
      });

      // Mock duplicate permissions
      const duplicatePermission = {
        id: '1',
        entity_type: 'Customer',
        action: 'Read',
        description: 'Read customers',
        is_system_permission: false,
        created_at: new Date(),
        updated_at: new Date(),
        role_permissions: [],
      };

      const queryBuilder = permissionRepository.createQueryBuilder();
      queryBuilder.getMany.mockResolvedValue([
        duplicatePermission,
        { ...duplicatePermission, id: '2' }, // Duplicate with different ID
        duplicatePermission, // Exact duplicate
      ]);

      // Should handle duplicates gracefully and still return true
      const result = await service.hasPermission('user-1', 'tenant-1', 'Customer', 'Read');
      expect(result).toBe(true);
    });
  });
});