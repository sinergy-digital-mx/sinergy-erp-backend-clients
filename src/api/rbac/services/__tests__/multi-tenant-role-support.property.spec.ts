// Feature: role-based-access-control, Property 5: Multi-Tenant Role Support
// **Validates: Requirements 1.3, 3.4**

import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { RoleService } from '../role.service';
import { PermissionService } from '../permission.service';
import { Role } from '../../../../entities/rbac/role.entity';
import { UserRole } from '../../../../entities/rbac/user-role.entity';
import { RolePermission } from '../../../../entities/rbac/role-permission.entity';
import { Permission } from '../../../../entities/rbac/permission.entity';
import { RBACTenant } from '../../../../entities/rbac/tenant.entity';
import { EntityRegistry } from '../../../../entities/entity-registry/entity-registry.entity';
import { TenantContextService } from '../tenant-context.service';
import { PermissionCacheService } from '../permission-cache.service';
import { QueryCacheService } from '../query-cache.service';

describe('Multi-Tenant Role Support - Property Tests', () => {
  let roleService: RoleService;
  let permissionService: PermissionService;
  let tenantContextService: TenantContextService;
  let roleRepository: jest.Mocked<Repository<Role>>;
  let userRoleRepository: jest.Mocked<Repository<UserRole>>;
  let rolePermissionRepository: jest.Mocked<Repository<RolePermission>>;
  let permissionRepository: jest.Mocked<Repository<Permission>>;
  let tenantRepository: jest.Mocked<Repository<RBACTenant>>;
  let entityRegistryRepository: jest.Mocked<Repository<EntityRegistry>>;

  // Property-based test generators
  const tenantGenerator = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    subdomain: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
    is_active: fc.boolean(),
  });

  const userGenerator = fc.record({
    id: fc.uuid(),
    email: fc.emailAddress(),
  });

  const roleGenerator = (tenantId: string) => fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    description: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
    tenant_id: fc.constant(tenantId),
    is_system_role: fc.boolean(),
  });

  const permissionGenerator = fc.record({
    id: fc.uuid(),
    entity_type: fc.constantFrom('User', 'Customer', 'Lead', 'Order', 'Product'),
    action: fc.constantFrom('Create', 'Read', 'Update', 'Delete', 'Export'),
    description: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
    is_system_permission: fc.boolean(),
  });

  const userRoleGenerator = (userId: string, roleId: string, tenantId: string) => fc.record({
    id: fc.uuid(),
    user_id: fc.constant(userId),
    role_id: fc.constant(roleId),
    tenant_id: fc.constant(tenantId),
  });

  const rolePermissionGenerator = (roleId: string, permissionId: string) => fc.record({
    id: fc.uuid(),
    role_id: fc.constant(roleId),
    permission_id: fc.constant(permissionId),
  });

  // Generator for multi-tenant user scenarios
  const multiTenantUserScenarioGenerator = fc.record({
    user: userGenerator,
    tenants: fc.array(tenantGenerator, { minLength: 2, maxLength: 4 }),
    rolesPerTenant: fc.array(fc.integer({ min: 1, max: 3 }), { minLength: 2, maxLength: 4 }),
    permissionsPerRole: fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, max: 10 }),
  });

  beforeEach(async () => {
    const mockRoleRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
    };

    const mockUserRoleRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
    };

    const mockRolePermissionRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
    };

    const mockPermissionRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
      query: jest.fn().mockResolvedValue([]),
    };

    const mockTenantRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
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
        RoleService,
        PermissionService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
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
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionRepository,
        },
        {
          provide: getRepositoryToken(RBACTenant),
          useValue: mockTenantRepository,
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

    roleService = module.get<RoleService>(RoleService);
    permissionService = module.get<PermissionService>(PermissionService);
    tenantContextService = module.get<TenantContextService>(TenantContextService);
    roleRepository = module.get(getRepositoryToken(Role));
    userRoleRepository = module.get(getRepositoryToken(UserRole));
    rolePermissionRepository = module.get(getRepositoryToken(RolePermission));
    permissionRepository = module.get(getRepositoryToken(Permission));
    tenantRepository = module.get(getRepositoryToken(RBACTenant));
    entityRegistryRepository = module.get(getRepositoryToken(EntityRegistry));
  });

  afterEach(() => {
    // Clear all mocks after each test to prevent interference between property test runs
    jest.clearAllMocks();
  });

  describe('Property 5: Multi-Tenant Role Support', () => {
    
    it('should evaluate permissions based on role in specific tenant context for any multi-tenant user', async () => {
      await fc.assert(
        fc.asyncProperty(multiTenantUserScenarioGenerator, async (scenario) => {
          const { user, tenants } = scenario;
          
          // Ensure we have at least 2 tenants for multi-tenant testing
          if (tenants.length < 2) return;

          // Mock entity registry to validate all entity types
          entityRegistryRepository.findOne.mockImplementation((options: any) => {
            const entityType = options.where?.code;
            if (['User', 'Customer', 'Lead', 'Order', 'Product'].includes(entityType)) {
              return Promise.resolve({
                id: 1,
                code: entityType,
                name: `${entityType} Entity`,
              });
            }
            return Promise.resolve(null);
          });

          // Create roles and permissions for each tenant
          const tenantRoles: { [tenantId: string]: any[] } = {};
          const tenantPermissions: { [tenantId: string]: any[] } = {};
          const userRoleAssignments: any[] = [];

          for (let i = 0; i < tenants.length; i++) {
            const tenant = tenants[i];
            const numRoles = Math.min(scenario.rolesPerTenant[i] || 1, 3);
            
            // Create roles for this tenant
            tenantRoles[tenant.id] = [];
            for (let j = 0; j < numRoles; j++) {
              const role = fc.sample(roleGenerator(tenant.id), 1)[0];
              tenantRoles[tenant.id].push(role);

              // Create permissions for this role
              const numPermissions = Math.min(scenario.permissionsPerRole[j] || 1, 3);
              for (let k = 0; k < numPermissions; k++) {
                const permission = fc.sample(permissionGenerator, 1)[0];
                if (!tenantPermissions[tenant.id]) {
                  tenantPermissions[tenant.id] = [];
                }
                tenantPermissions[tenant.id].push(permission);
              }

              // Assign user to role in this tenant
              const userRole = fc.sample(userRoleGenerator(user.id, role.id, tenant.id), 1)[0];
              userRoleAssignments.push(userRole);
            }
          }

          // Test permission evaluation in different tenant contexts
          for (let i = 0; i < tenants.length; i++) {
            const currentTenant = tenants[i];
            const currentTenantRoles = tenantRoles[currentTenant.id] || [];
            const currentTenantPermissions = tenantPermissions[currentTenant.id] || [];

            // Set tenant context
            (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(currentTenant.id);
            (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(user.id);

            // Mock user roles query for current tenant
            const userRolesInCurrentTenant = userRoleAssignments.filter(ur => ur.tenant_id === currentTenant.id);
            const rolesInCurrentTenant = currentTenantRoles.filter(role => 
              userRolesInCurrentTenant.some(ur => ur.role_id === role.id)
            );

            roleRepository.createQueryBuilder.mockReturnValue({
              innerJoin: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue(rolesInCurrentTenant),
            } as any);

            // Get user roles in current tenant
            const userRoles = await roleService.getUserRoles(user.id, currentTenant.id);

            // Property: User should only get roles from the current tenant
            expect(userRoles).toHaveLength(rolesInCurrentTenant.length);
            for (const role of userRoles) {
              expect(role.tenant_id).toBe(currentTenant.id);
            }

            // Test permission checks in current tenant context
            for (const permission of currentTenantPermissions) {
              // Mock permission check query - user has permission in current tenant
              permissionRepository.query.mockResolvedValue([{
                id: permission.id,
                entity_type: permission.entity_type,
                action: permission.action,
                description: permission.description,
                is_system_permission: permission.is_system_permission,
                created_at: permission.created_at,
                updated_at: permission.updated_at,
              }]);

              // Check if user has permission in current tenant
              const hasPermission = await permissionService.hasPermission(
                user.id,
                currentTenant.id,
                permission.entity_type,
                permission.action
              );

              // Property: Permission check should be based on current tenant context
              expect(hasPermission).toBe(true);
            }

            // Property: User should not have access to permissions from other tenants
            const otherTenants = tenants.filter(t => t.id !== currentTenant.id);
            for (const otherTenant of otherTenants) {
              const otherTenantPermissions = tenantPermissions[otherTenant.id] || [];
              
              for (const otherPermission of otherTenantPermissions) {
                // Mock no permission found in current tenant
                permissionRepository.query.mockResolvedValue([]);

                const hasOtherPermission = await permissionService.hasPermission(
                  user.id,
                  currentTenant.id,
                  otherPermission.entity_type,
                  otherPermission.action
                );

                // Property: User should not have permissions from other tenants in current context
                expect(hasOtherPermission).toBe(false);
              }
            }
          }
        }),
        { numRuns: 20, timeout: 30000 }
      );
    });

    it('should prevent cross-tenant role assignments for any tenant combination', async () => {
      await fc.assert(
        fc.asyncProperty(
          tenantGenerator,
          tenantGenerator,
          userGenerator,
          async (tenant1, tenant2, user) => {
            // Ensure we have different tenants
            if (tenant1.id === tenant2.id) return;

            // Create role in tenant1
            const roleInTenant1 = fc.sample(roleGenerator(tenant1.id), 1)[0];
            
            // Mock the validateCrossTenantRoleAssignment call
            // First call: return role with tenant1 ID (for validateCrossTenantRoleAssignment)
            roleRepository.findOne.mockResolvedValueOnce(roleInTenant1);
            
            // The service should throw UnauthorizedException because role.tenant_id !== tenantId
            await expect(
              roleService.assignRoleToUser(user.id, roleInTenant1.id, tenant2.id)
            ).rejects.toThrow(UnauthorizedException);

            // Property: Cross-tenant role assignments should always be rejected
            // The service should check the role's tenant during validation
            expect(roleRepository.findOne).toHaveBeenCalledWith({
              where: { id: roleInTenant1.id },
            });
          }
        ),
        { numRuns: 20, timeout: 15000 }
      );
    });

    it('should isolate role queries by tenant for any tenant and user combination', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(tenantGenerator, { minLength: 2, maxLength: 5 }),
          userGenerator,
          async (tenants, user) => {
            // Create roles in each tenant
            const allRoles: any[] = [];
            const rolesByTenant: { [tenantId: string]: any[] } = {};

            for (const tenant of tenants) {
              const numRoles = fc.sample(fc.integer({ min: 1, max: 3 }), 1)[0];
              rolesByTenant[tenant.id] = [];
              
              for (let i = 0; i < numRoles; i++) {
                const role = fc.sample(roleGenerator(tenant.id), 1)[0];
                rolesByTenant[tenant.id].push(role);
                allRoles.push(role);
              }
            }

            // Test role queries for each tenant
            for (const tenant of tenants) {
              const expectedRoles = rolesByTenant[tenant.id];

              // Mock query builder to return only roles from current tenant
              roleRepository.createQueryBuilder.mockReturnValue({
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(expectedRoles),
              } as any);

              // Get user roles for current tenant
              const userRoles = await roleService.getUserRoles(user.id, tenant.id);

              // Property: Should only return roles from the specified tenant
              expect(userRoles).toHaveLength(expectedRoles.length);
              for (const role of userRoles) {
                expect(role.tenant_id).toBe(tenant.id);
              }

              // Property: Should not include roles from other tenants
              const otherTenantRoles = allRoles.filter(r => r.tenant_id !== tenant.id);
              for (const otherRole of otherTenantRoles) {
                expect(userRoles).not.toContainEqual(otherRole);
              }
            }
          }
        ),
        { numRuns: 20, timeout: 20000 }
      );
    });

    it('should validate tenant context for all role operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          tenantGenerator,
          tenantGenerator,
          userGenerator,
          async (tenant1, tenant2, user) => {
            // Ensure different tenants
            if (tenant1.id === tenant2.id) return;

            // Set context to tenant1
            (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenant1.id);
            (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(user.id);

            // Mock tenant repository
            tenantRepository.findOne.mockResolvedValue(tenant2);

            // Attempt operations in tenant2 while context is tenant1
            await expect(
              roleService.createRole(tenant2.id, 'TestRole', 'Test Description')
            ).rejects.toThrow(UnauthorizedException);

            // Property: Operations should be rejected when tenant context doesn't match
            expect(tenantContextService.getCurrentTenantId).toHaveBeenCalled();
          }
        ),
        { numRuns: 20, timeout: 15000 }
      );
    });

    it('should maintain role isolation when switching tenant contexts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(tenantGenerator, { minLength: 2, maxLength: 3 }),
          userGenerator,
          async (tenants, user) => {
            const rolesByTenant: { [tenantId: string]: any[] } = {};

            // Create roles in each tenant
            for (const tenant of tenants) {
              rolesByTenant[tenant.id] = [];
              const numRoles = fc.sample(fc.integer({ min: 1, max: 2 }), 1)[0];
              
              for (let i = 0; i < numRoles; i++) {
                const role = fc.sample(roleGenerator(tenant.id), 1)[0];
                rolesByTenant[tenant.id].push(role);
              }
            }

            // Test context switching
            for (let i = 0; i < tenants.length; i++) {
              const currentTenant = tenants[i];
              
              // Switch to current tenant context
              (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(currentTenant.id);
              (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(user.id);

              // Mock role query for current tenant
              const currentTenantRoles = rolesByTenant[currentTenant.id];
              roleRepository.createQueryBuilder.mockReturnValue({
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(currentTenantRoles),
              } as any);

              // Get roles in current context
              const rolesInContext = await roleService.getUserRoles(user.id, currentTenant.id);

              // Property: Context switch should return only roles from current tenant
              expect(rolesInContext).toHaveLength(currentTenantRoles.length);
              for (const role of rolesInContext) {
                expect(role.tenant_id).toBe(currentTenant.id);
              }

              // Property: Should not return roles from previous contexts
              const otherTenants = tenants.filter(t => t.id !== currentTenant.id);
              for (const otherTenant of otherTenants) {
                const otherTenantRoles = rolesByTenant[otherTenant.id];
                for (const otherRole of otherTenantRoles) {
                  expect(rolesInContext).not.toContainEqual(otherRole);
                }
              }
            }
          }
        ),
        { numRuns: 15, timeout: 25000 }
      );
    });

    it('should handle role creation with proper tenant association for any valid input', async () => {
      await fc.assert(
        fc.asyncProperty(
          tenantGenerator,
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
          async (tenant, roleName, roleDescription) => {
            // Mock tenant exists
            tenantRepository.findOne.mockResolvedValue(tenant);
            
            // Mock no existing role with same name
            roleRepository.findOne.mockResolvedValue(null);
            
            // Mock role creation
            const expectedRole = {
              id: fc.sample(fc.uuid(), 1)[0],
              name: roleName,
              description: roleDescription,
              tenant_id: tenant.id,
              is_system_role: false,
            };
            
            roleRepository.create.mockReturnValue(expectedRole);
            roleRepository.save.mockResolvedValue(expectedRole);

            // Create role
            const createdRole = await roleService.createRole(tenant.id, roleName, roleDescription);

            // Property: Created role should be associated with correct tenant
            expect(createdRole.tenant_id).toBe(tenant.id);
            expect(createdRole.name).toBe(roleName);
            expect(createdRole.description).toBe(roleDescription);
            expect(createdRole.is_system_role).toBe(false);

            // Property: Role should be created with proper tenant validation
            expect(tenantRepository.findOne).toHaveBeenCalledWith({
              where: { id: tenant.id },
            });

            // Property: Duplicate name check should be tenant-scoped
            expect(roleRepository.findOne).toHaveBeenCalledWith({
              where: { name: roleName, tenant_id: tenant.id },
            });
          }
        ),
        { numRuns: 20, timeout: 15000 }
      );
    });

    it('should enforce tenant-scoped role uniqueness for any role name', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(tenantGenerator, { minLength: 2, maxLength: 4 }),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          async (tenants, roleName) => {
            // Reset mocks for this property test iteration
            jest.clearAllMocks();

            // Create role with same name in each tenant
            for (let i = 0; i < tenants.length; i++) {
              const tenant = tenants[i];
              
              // Mock tenant exists
              tenantRepository.findOne.mockResolvedValue(tenant);
              
              // Mock no existing role with same name in this tenant
              roleRepository.findOne.mockResolvedValue(null);
              
              // Mock role creation
              const expectedRole = {
                id: fc.sample(fc.uuid(), 1)[0],
                name: roleName,
                tenant_id: tenant.id,
                is_system_role: false,
              };
              
              roleRepository.create.mockReturnValue(expectedRole);
              roleRepository.save.mockResolvedValue(expectedRole);

              // Create role in this tenant
              const createdRole = await roleService.createRole(tenant.id, roleName);

              // Property: Same role name should be allowed in different tenants
              expect(createdRole.name).toBe(roleName);
              expect(createdRole.tenant_id).toBe(tenant.id);

              // Property: Uniqueness check should be tenant-scoped
              expect(roleRepository.findOne).toHaveBeenCalledWith({
                where: { name: roleName, tenant_id: tenant.id },
              });
            }

            // Property: Each tenant should have its own role with the same name
            expect(roleRepository.create).toHaveBeenCalledTimes(tenants.length);
            expect(roleRepository.save).toHaveBeenCalledTimes(tenants.length);
          }
        ),
        { numRuns: 20, timeout: 20000 }
      );
    });
  });
});