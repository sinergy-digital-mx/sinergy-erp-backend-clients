// Feature: role-based-access-control, Property 6: Entity Registry Integration and Validation
// **Validates: Requirements 2.5, 6.1, 6.2, 6.3**

import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { PermissionService } from '../permission.service';
import { Permission } from '../../../../entities/rbac/permission.entity';
import { UserRole } from '../../../../entities/rbac/user-role.entity';
import { RolePermission } from '../../../../entities/rbac/role-permission.entity';
import { EntityRegistry } from '../../../../entities/entity-registry/entity-registry.entity';
import { TenantContextService } from '../tenant-context.service';
import { PermissionCacheService } from '../permission-cache.service';
import { QueryCacheService } from '../query-cache.service';

describe('Permission Validation - Property Tests', () => {
  let service: PermissionService;
  let entityRegistryRepository: jest.Mocked<Repository<EntityRegistry>>;
  let permissionRepository: jest.Mocked<Repository<Permission>>;

  // Property-based test generators
  const validEntityTypeGenerator = fc.constantFrom(
    'User', 'Customer', 'Lead', 'Order', 'Product', 'Invoice', 'Report'
  );

  const invalidEntityTypeGenerator = fc.string({ minLength: 1, maxLength: 50 })
    .filter(s => !['User', 'Customer', 'Lead', 'Order', 'Product', 'Invoice', 'Report'].includes(s));

  const validActionGenerator = fc.constantFrom(
    'Create', 'Read', 'Update', 'Delete', 'Export', 'Import', 'Download_Report', 'Bulk_Update', 'Bulk_Delete'
  );

  const invalidActionGenerator = fc.string({ minLength: 1, maxLength: 50 })
    .filter(s => !['Create', 'Read', 'Update', 'Delete', 'Export', 'Import', 'Download_Report', 'Bulk_Update', 'Bulk_Delete'].includes(s));

  const entityRegistryGenerator = fc.record({
    id: fc.integer({ min: 1, max: 1000 }),
    code: validEntityTypeGenerator,
    name: fc.string({ minLength: 1, maxLength: 100 }),
  });

  const permissionDataGenerator = fc.record({
    entityType: validEntityTypeGenerator,
    action: validActionGenerator,
    description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  });

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
      findOne: jest.fn(),
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
          useValue: {
            getUserPermissions: jest.fn(),
            setUserPermissions: jest.fn(),
            invalidateUserPermissions: jest.fn(),
            invalidateRolePermissions: jest.fn(),
            invalidateTenantPermissions: jest.fn(),
            clearAllCache: jest.fn(),
            getCacheStats: jest.fn(),
            getCacheHitRatio: jest.fn(),
            isUserPermissionsCached: jest.fn(),
            warmCache: jest.fn(),
          },
        },
        {
          provide: QueryCacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            invalidate: jest.fn(),
            invalidatePattern: jest.fn(),
            invalidateTenantQueries: jest.fn(),
            invalidateUserQueries: jest.fn(),
            cacheQuery: jest.fn(),
            generateTenantQueryKey: jest.fn(),
            generateUserQueryKey: jest.fn(),
            clear: jest.fn(),
            getStats: jest.fn(),
            getHitRatio: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    entityRegistryRepository = module.get(getRepositoryToken(EntityRegistry));
    permissionRepository = module.get(getRepositoryToken(Permission));
  });

  describe('Property 6: Entity Registry Integration and Validation', () => {
    
    it('should validate entity types against Entity Registry for any valid entity', async () => {
      await fc.assert(
        fc.asyncProperty(entityRegistryGenerator, async (entityData) => {
          // Setup: Mock entity registry to return the entity
          entityRegistryRepository.findOne.mockResolvedValue(entityData);

          // Test: Validate entity type
          const result = await service.validateEntityType(entityData.code);

          // Property: Valid entities in registry should always validate as true
          expect(result).toBe(true);
          expect(entityRegistryRepository.findOne).toHaveBeenCalledWith({
            where: { code: entityData.code },
          });
        }),
        { numRuns: 100, timeout: 10000 }
      );
    });

    it('should reject invalid entity types not in Entity Registry for any invalid entity', async () => {
      await fc.assert(
        fc.asyncProperty(invalidEntityTypeGenerator, async (invalidEntityType) => {
          // Setup: Mock entity registry to return null for invalid entity
          entityRegistryRepository.findOne.mockResolvedValue(null);

          // Test: Validate invalid entity type
          const result = await service.validateEntityType(invalidEntityType);

          // Property: Invalid entities not in registry should always validate as false
          expect(result).toBe(false);
          expect(entityRegistryRepository.findOne).toHaveBeenCalledWith({
            where: { code: invalidEntityType },
          });
        }),
        { numRuns: 100, timeout: 10000 }
      );
    });

    it('should retrieve all available entity types from Entity Registry', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(entityRegistryGenerator, { minLength: 1, maxLength: 20 }),
          async (entityDataArray) => {
            // Ensure unique entity codes by filtering duplicates
            const uniqueEntities = entityDataArray.filter((entity, index, arr) => 
              arr.findIndex(e => e.code === entity.code) === index
            );

            // Setup: Mock entity registry to return array of unique entities
            entityRegistryRepository.find.mockResolvedValue(uniqueEntities);

            // Test: Get available entity types
            const result = await service.getAvailableEntityTypes();

            // Property: Should return all entity codes from registry
            const expectedCodes = uniqueEntities.map(entity => entity.code);
            expect(result).toEqual(expectedCodes);
            expect(entityRegistryRepository.find).toHaveBeenCalledWith({
              select: ['code'],
            });

            // Property: Result should contain only unique entity codes
            const uniqueCodes = [...new Set(result)];
            expect(result.length).toBe(uniqueCodes.length);
          }
        ),
        { numRuns: 50, timeout: 10000 }
      );
    });

    it('should validate supported actions for any action', async () => {
      await fc.assert(
        fc.asyncProperty(validActionGenerator, async (validAction) => {
          // Test: Validate supported action
          const result = service.validateAction(validAction);

          // Property: All predefined valid actions should validate as true
          expect(result).toBe(true);

          // Property: Supported actions should be consistent
          const supportedActions = service.getSupportedActions();
          expect(supportedActions).toContain(validAction);
        }),
        { numRuns: 100, timeout: 5000 }
      );
    });

    it('should reject unsupported actions for any invalid action', async () => {
      await fc.assert(
        fc.asyncProperty(invalidActionGenerator, async (invalidAction) => {
          // Test: Validate unsupported action
          const result = service.validateAction(invalidAction);

          // Property: Invalid actions should always validate as false
          expect(result).toBe(false);

          // Property: Invalid actions should not be in supported actions list
          const supportedActions = service.getSupportedActions();
          expect(supportedActions).not.toContain(invalidAction);
        }),
        { numRuns: 100, timeout: 5000 }
      );
    });

    it('should create permissions only for valid entity-action combinations', async () => {
      await fc.assert(
        fc.asyncProperty(permissionDataGenerator, async (permissionData) => {
          // Setup: Mock entity registry to validate entity type
          const mockEntity = {
            id: 1,
            code: permissionData.entityType,
            name: `${permissionData.entityType} Entity`,
          };
          entityRegistryRepository.findOne.mockResolvedValue(mockEntity);
          
          // Setup: Mock no existing permission
          permissionRepository.findOne.mockResolvedValue(null);
          
          // Setup: Mock permission creation
          const mockPermission = {
            id: fc.sample(fc.uuid(), 1)[0],
            entity_type: permissionData.entityType,
            action: permissionData.action,
            description: permissionData.description,
            is_system_permission: false,
            role_permissions: [],
            created_at: new Date(),
            updated_at: new Date(),
          };
          permissionRepository.create.mockReturnValue(mockPermission);
          permissionRepository.save.mockResolvedValue(mockPermission);

          // Test: Create permission
          const result = await service.createPermission(
            permissionData.entityType,
            permissionData.action,
            permissionData.description
          );

          // Property: Valid entity-action combinations should create permissions successfully
          expect(result).toBeDefined();
          expect(result.entity_type).toBe(permissionData.entityType);
          expect(result.action).toBe(permissionData.action);
          expect(result.description).toBe(permissionData.description);

          // Property: Entity type should be validated against registry
          expect(entityRegistryRepository.findOne).toHaveBeenCalledWith({
            where: { code: permissionData.entityType },
          });

          // Property: Permission should be created with correct properties
          expect(permissionRepository.create).toHaveBeenCalledWith({
            entity_type: permissionData.entityType,
            action: permissionData.action,
            description: permissionData.description,
            is_system_permission: false,
          });
        }),
        { numRuns: 100, timeout: 10000 }
      );
    });

    it('should reject permission creation for invalid entity types', async () => {
      await fc.assert(
        fc.asyncProperty(
          invalidEntityTypeGenerator,
          validActionGenerator,
          async (invalidEntityType, validAction) => {
            // Setup: Mock entity registry to return null for invalid entity
            entityRegistryRepository.findOne.mockResolvedValue(null);

            // Test: Attempt to create permission with invalid entity type
            await expect(
              service.createPermission(invalidEntityType, validAction)
            ).rejects.toThrow(BadRequestException);

            // Property: Invalid entity types should always be rejected
            expect(entityRegistryRepository.findOne).toHaveBeenCalledWith({
              where: { code: invalidEntityType },
            });

            // Property: Permission should not be created for invalid entity types
            expect(permissionRepository.create).not.toHaveBeenCalled();
            expect(permissionRepository.save).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100, timeout: 10000 }
      );
    });

    it('should prevent duplicate permissions for same entity-action combination', async () => {
      await fc.assert(
        fc.asyncProperty(permissionDataGenerator, async (permissionData) => {
          // Setup: Mock entity registry to validate entity type
          const mockEntity = {
            id: 1,
            code: permissionData.entityType,
            name: `${permissionData.entityType} Entity`,
          };
          entityRegistryRepository.findOne.mockResolvedValue(mockEntity);
          
          // Setup: Mock existing permission
          const existingPermission = {
            id: fc.sample(fc.uuid(), 1)[0],
            entity_type: permissionData.entityType,
            action: permissionData.action,
            description: 'Existing permission',
            is_system_permission: false,
            role_permissions: [],
            created_at: new Date(),
            updated_at: new Date(),
          };
          permissionRepository.findOne.mockResolvedValue(existingPermission);

          // Test: Attempt to create duplicate permission
          await expect(
            service.createPermission(
              permissionData.entityType,
              permissionData.action,
              permissionData.description
            )
          ).rejects.toThrow(BadRequestException);

          // Property: Duplicate entity-action combinations should always be rejected
          expect(permissionRepository.findOne).toHaveBeenCalledWith({
            where: { entity_type: permissionData.entityType, action: permissionData.action },
          });

          // Property: No new permission should be created for duplicates
          expect(permissionRepository.create).not.toHaveBeenCalled();
          expect(permissionRepository.save).not.toHaveBeenCalled();
        }),
        { numRuns: 100, timeout: 10000 }
      );
    });

    it('should maintain consistency between entity registry and permission validation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(entityRegistryGenerator, { minLength: 1, maxLength: 10 }),
          async (entityDataArray) => {
            // Setup: Mock entity registry with available entities
            entityRegistryRepository.find.mockResolvedValue(entityDataArray);

            // Test: Get available entity types
            const availableEntityTypes = await service.getAvailableEntityTypes();

            // Property: All available entity types should validate as true
            for (const entityType of availableEntityTypes) {
              entityRegistryRepository.findOne.mockResolvedValue(
                entityDataArray.find(e => e.code === entityType)
              );
              
              const isValid = await service.validateEntityType(entityType);
              expect(isValid).toBe(true);
            }

            // Property: Entity types not in registry should validate as false
            const unavailableEntityType = 'NonExistentEntity';
            if (!availableEntityTypes.includes(unavailableEntityType)) {
              entityRegistryRepository.findOne.mockResolvedValue(null);
              const isValid = await service.validateEntityType(unavailableEntityType);
              expect(isValid).toBe(false);
            }
          }
        ),
        { numRuns: 50, timeout: 15000 }
      );
    });

    it('should handle entity registry changes gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(entityRegistryGenerator, { minLength: 2, maxLength: 10 }),
          async (initialEntities) => {
            // Setup: Initial entity registry state
            entityRegistryRepository.find.mockResolvedValue(initialEntities);
            const initialEntityTypes = await service.getAvailableEntityTypes();

            // Simulate adding a new entity to registry
            const newEntity = {
              id: fc.sample(fc.integer({ min: 1001, max: 2000 }), 1)[0],
              code: fc.sample(fc.string({ minLength: 5, maxLength: 15 }), 1)[0],
              name: fc.sample(fc.string({ minLength: 10, maxLength: 50 }), 1)[0],
            };
            
            const updatedEntities = [...initialEntities, newEntity];
            entityRegistryRepository.find.mockResolvedValue(updatedEntities);

            // Test: Get updated entity types
            const updatedEntityTypes = await service.getAvailableEntityTypes();

            // Property: New entities should be automatically available
            expect(updatedEntityTypes).toContain(newEntity.code);
            expect(updatedEntityTypes.length).toBe(initialEntityTypes.length + 1);

            // Property: New entity should validate as true
            entityRegistryRepository.findOne.mockResolvedValue(newEntity);
            const isNewEntityValid = await service.validateEntityType(newEntity.code);
            expect(isNewEntityValid).toBe(true);

            // Property: All original entities should still be available
            for (const originalEntityType of initialEntityTypes) {
              expect(updatedEntityTypes).toContain(originalEntityType);
            }
          }
        ),
        { numRuns: 30, timeout: 15000 }
      );
    });
  });
});