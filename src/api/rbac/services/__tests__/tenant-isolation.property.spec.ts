// Feature: role-based-access-control, Property 1: Tenant Isolation
// **Validates: Requirements 1.2, 1.4**

import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { RoleService } from '../role.service';
import { PermissionService } from '../permission.service';
import { PermissionCacheService } from '../permission-cache.service';
import { QueryCacheService } from '../query-cache.service';
import { Role } from '../../../../entities/rbac/role.entity';
import { UserRole } from '../../../../entities/rbac/user-role.entity';
import { RolePermission } from '../../../../entities/rbac/role-permission.entity';
import { Permission } from '../../../../entities/rbac/permission.entity';
import { RBACTenant } from '../../../../entities/rbac/tenant.entity';
import { EntityRegistry } from '../../../../entities/entity-registry/entity-registry.entity';
import { TenantContextService } from '../tenant-context.service';

describe('Tenant Isolation - Property Tests', () => {
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

  // Generator for multi-tenant scenarios
  const multiTenantScenarioGenerator = fc.record({
    tenants: fc.array(tenantGenerator, { minLength: 2, maxLength: 5 }),
    users: fc.array(userGenerator, { minLength: 1, maxLength: 3 }),
    rolesPerTenant: fc.array(fc.integer({ min: 1, max: 4 }), { minLength: 2, maxLength: 5 }),
    permissionsPerRole: fc.array(fc.integer({ min: 1, max: 3 }), { minLength: 1, maxLength: 10 }),
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
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn(),
      warmCache: jest.fn(),
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
          useValue: mockPermissionCacheService,
        },
        {
          provide: QueryCacheService,
          useValue: mockQueryCacheService,
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

  describe('Property 1: Tenant Isolation', () => {
    
    it('should return only roles belonging to the specific tenant for any tenant and query', async () => {
      await fc.assert(
        fc.asyncProperty(multiTenantScenarioGenerator, async (scenario) => {
          const { tenants, users } = scenario;
          
          // Ensure we have at least 2 tenants for isolation testing
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

          // Create roles in each tenant
          const rolesByTenant: { [tenantId: string]: any[] } = {};
          const allRoles: any[] = [];

          for (let i = 0; i < tenants.length; i++) {
            const tenant = tenants[i];
            const numRoles = Math.min(scenario.rolesPerTenant[i] || 1, 4);
            
            rolesByTenant[tenant.id] = [];
            
            for (let j = 0; j < numRoles; j++) {
              const role = fc.sample(roleGenerator(tenant.id), 1)[0];
              rolesByTenant[tenant.id].push(role);
              allRoles.push(role);
            }
          }

          // Test role queries for each tenant
          for (const tenant of tenants) {
            const expectedRoles = rolesByTenant[tenant.id];
            
            // Set tenant context
            (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenant.id);
            (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(users[0]?.id);

            // Mock tenant roles query to return only roles from current tenant
            roleRepository.find.mockImplementation((options: any) => {
              if (options.where?.tenant_id === tenant.id) {
                return Promise.resolve(expectedRoles);
              }
              return Promise.resolve([]);
            });

            // Get tenant roles
            const tenantRoles = await roleService.getTenantRoles(tenant.id);

            // Property: Should return only roles from the specified tenant
            expect(tenantRoles).toHaveLength(expectedRoles.length);
            for (const role of tenantRoles) {
              expect(role.tenant_id).toBe(tenant.id);
            }

            // Property: Should not include roles from other tenants
            const otherTenantRoles = allRoles.filter(r => r.tenant_id !== tenant.id);
            for (const otherRole of otherTenantRoles) {
              expect(tenantRoles).not.toContainEqual(otherRole);
            }
          }
        }),
        { numRuns: 20, timeout: 30000 }
      );
    });

    it('should return only permissions belonging to the specific tenant for any user and tenant query', async () => {
      await fc.assert(
        fc.asyncProperty(multiTenantScenarioGenerator, async (scenario) => {
          const { tenants, users } = scenario;
          
          // Ensure we have at least 2 tenants and 1 user
          if (tenants.length < 2 || users.length < 1) return;

          const user = users[0];

          // Mock entity registry
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

          // Create permissions for each tenant through roles
          const permissionsByTenant: { [tenantId: string]: any[] } = {};
          const allPermissions: any[] = [];

          for (let i = 0; i < tenants.length; i++) {
            const tenant = tenants[i];
            const numPermissions = Math.min(scenario.permissionsPerRole[i] || 1, 3);
            
            permissionsByTenant[tenant.id] = [];
            
            for (let j = 0; j < numPermissions; j++) {
              const permission = fc.sample(permissionGenerator, 1)[0];
              permissionsByTenant[tenant.id].push(permission);
              allPermissions.push(permission);
            }
          }

          // Test permission queries for each tenant
          for (const tenant of tenants) {
            const expectedPermissions = permissionsByTenant[tenant.id];
            
            // Set tenant context
            (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenant.id);
            (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(user.id);

            // Mock user permissions query to return only permissions from current tenant
            permissionRepository.createQueryBuilder.mockReturnValue({
              innerJoin: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              distinct: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue(expectedPermissions),
            } as any);

            // Get user permissions in current tenant
            const userPermissions = await permissionService.getUserPermissions(user.id, tenant.id);

            // Property: Should return only permissions from the specified tenant context
            expect(userPermissions).toHaveLength(expectedPermissions.length);
            
            // Verify all returned permissions are from expected set
            for (const permission of userPermissions) {
              const isExpected = expectedPermissions.some(ep => 
                ep.entity_type === permission.entity_type && ep.action === permission.action
              );
              expect(isExpected).toBe(true);
            }

            // Property: Should not include permissions from other tenants
            const otherTenantPermissions = allPermissions.filter(p => 
              !expectedPermissions.some(ep => 
                ep.entity_type === p.entity_type && ep.action === p.action
              )
            );
            
            for (const otherPermission of otherTenantPermissions) {
              const hasOtherPermission = userPermissions.some(up => 
                up.entity_type === otherPermission.entity_type && up.action === otherPermission.action
              );
              expect(hasOtherPermission).toBe(false);
            }
          }
        }),
        { numRuns: 20, timeout: 30000 }
      );
    });

    it('should prevent cross-tenant data access for any tenant combination', async () => {
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
            
            // Set context to tenant2
            (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenant2.id);
            (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(user.id);

            // Mock role query to return role from tenant1
            roleRepository.findOne.mockImplementation((options: any) => {
              if (options.where?.id === roleInTenant1.id && options.where?.tenant_id === tenant2.id) {
                return Promise.resolve(null); // Role not found in tenant2
              }
              if (options.where?.id === roleInTenant1.id) {
                return Promise.resolve(roleInTenant1); // Role exists but in different tenant
              }
              return Promise.resolve(null);
            });

            // Property: Should not be able to access role from different tenant
            const role = await roleService.getRoleById(roleInTenant1.id, tenant2.id).catch(e => e);
            expect(role).toBeInstanceOf(NotFoundException);

            // Property: Cross-tenant role assignment should be prevented
            await expect(
              roleService.assignRoleToUser(user.id, roleInTenant1.id, tenant2.id)
            ).rejects.toThrow(UnauthorizedException);
          }
        ),
        { numRuns: 20, timeout: 15000 }
      );
    });

    it('should enforce tenant context validation for all operations', async () => {
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

            // Property: Operations in different tenant should be rejected
            await expect(
              roleService.createRole(tenant2.id, 'TestRole', 'Test Description')
            ).rejects.toThrow(UnauthorizedException);

            // Property: Permission checks in different tenant should be rejected
            await expect(
              permissionService.hasPermission(user.id, tenant2.id, 'Customer', 'Read')
            ).rejects.toThrow(UnauthorizedException);

            // Property: User permission queries in different tenant should be rejected
            await expect(
              permissionService.getUserPermissions(user.id, tenant2.id)
            ).rejects.toThrow(UnauthorizedException);
          }
        ),
        { numRuns: 20, timeout: 15000 }
      );
    });

    it('should maintain data isolation when switching tenant contexts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(tenantGenerator, { minLength: 2, maxLength: 4 }),
          userGenerator,
          async (tenants, user) => {
            // Create different data sets for each tenant
            const dataByTenant: { [tenantId: string]: { roles: any[], permissions: any[] } } = {};

            for (const tenant of tenants) {
              const roles = fc.sample(roleGenerator(tenant.id), fc.sample(fc.integer({ min: 1, max: 3 }), 1)[0]);
              const permissions = fc.sample(permissionGenerator, fc.sample(fc.integer({ min: 1, max: 3 }), 1)[0]);
              
              // Ensure permissions are unique per tenant by adding tenant-specific suffix
              const uniquePermissions = permissions.map((p, index) => ({
                ...p,
                id: `${p.id}-${tenant.id}`,
                entity_type: `${p.entity_type}_${tenant.id.slice(0, 8)}`, // Make entity type unique per tenant
              }));
              
              dataByTenant[tenant.id] = { roles, permissions: uniquePermissions };
            }

            // Test context switching
            for (let i = 0; i < tenants.length; i++) {
              const currentTenant = tenants[i];
              const currentData = dataByTenant[currentTenant.id];
              
              // Switch to current tenant context
              (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(currentTenant.id);
              (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(user.id);

              // Mock queries to return only current tenant data
              roleRepository.find.mockImplementation((options: any) => {
                if (options.where?.tenant_id === currentTenant.id) {
                  return Promise.resolve(currentData.roles);
                }
                return Promise.resolve([]);
              });

              permissionRepository.createQueryBuilder.mockReturnValue({
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                distinct: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(currentData.permissions),
              } as any);

              // Get data in current context
              const rolesInContext = await roleService.getTenantRoles(currentTenant.id);
              const permissionsInContext = await permissionService.getUserPermissions(user.id, currentTenant.id);

              // Property: Context switch should return only data from current tenant
              expect(rolesInContext).toHaveLength(currentData.roles.length);
              expect(permissionsInContext).toHaveLength(currentData.permissions.length);

              // Verify all data belongs to current tenant
              for (const role of rolesInContext) {
                expect(role.tenant_id).toBe(currentTenant.id);
              }

              // Property: Should not return data from other tenants
              const otherTenants = tenants.filter(t => t.id !== currentTenant.id);
              for (const otherTenant of otherTenants) {
                const otherData = dataByTenant[otherTenant.id];
                
                // Check roles don't leak across tenants
                for (const otherRole of otherData.roles) {
                  expect(rolesInContext).not.toContainEqual(otherRole);
                }
                
                // Check permissions don't leak across tenants
                for (const otherPermission of otherData.permissions) {
                  const hasOtherPermission = permissionsInContext.some(p => 
                    p.entity_type === otherPermission.entity_type && p.action === otherPermission.action
                  );
                  expect(hasOtherPermission).toBe(false);
                }
              }
            }
          }
        ),
        { numRuns: 15, timeout: 25000 }
      );
    });

    it('should isolate user role assignments by tenant for any user and role combination', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(tenantGenerator, { minLength: 2, maxLength: 3 }),
          userGenerator,
          async (tenants, user) => {
            // Create roles in each tenant
            const rolesByTenant: { [tenantId: string]: any[] } = {};
            const userRolesByTenant: { [tenantId: string]: any[] } = {};

            for (const tenant of tenants) {
              const roles = fc.sample(roleGenerator(tenant.id), fc.sample(fc.integer({ min: 1, max: 2 }), 1)[0]);
              rolesByTenant[tenant.id] = roles;
              userRolesByTenant[tenant.id] = [];

              // Create user role assignments for this tenant
              for (const role of roles) {
                const userRole = fc.sample(userRoleGenerator(user.id, role.id, tenant.id), 1)[0];
                userRolesByTenant[tenant.id].push(userRole);
              }
            }

            // Test user role queries for each tenant
            for (const tenant of tenants) {
              const expectedRoles = rolesByTenant[tenant.id];
              
              // Set tenant context
              (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenant.id);
              (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(user.id);

              // Mock user roles query to return only roles from current tenant
              roleRepository.createQueryBuilder.mockReturnValue({
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(expectedRoles),
              } as any);

              // Get user roles in current tenant
              const userRoles = await roleService.getUserRoles(user.id, tenant.id);

              // Property: Should return only roles from the specified tenant
              expect(userRoles).toHaveLength(expectedRoles.length);
              for (const role of userRoles) {
                expect(role.tenant_id).toBe(tenant.id);
              }

              // Property: Should not include roles from other tenants
              const otherTenants = tenants.filter(t => t.id !== tenant.id);
              for (const otherTenant of otherTenants) {
                const otherRoles = rolesByTenant[otherTenant.id];
                for (const otherRole of otherRoles) {
                  expect(userRoles).not.toContainEqual(otherRole);
                }
              }
            }
          }
        ),
        { numRuns: 20, timeout: 20000 }
      );
    });

    it('should prevent tenant data leakage in bulk operations for any data set', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(tenantGenerator, { minLength: 2, maxLength: 3 }),
          userGenerator,
          fc.array(permissionGenerator, { minLength: 2, maxLength: 5 }),
          async (tenants, user, permissions) => {
            // Distribute permissions across tenants
            const permissionsByTenant: { [tenantId: string]: any[] } = {};
            
            for (let i = 0; i < tenants.length; i++) {
              const tenant = tenants[i];
              const tenantPermissions = permissions.slice(
                Math.floor(i * permissions.length / tenants.length),
                Math.floor((i + 1) * permissions.length / tenants.length)
              );
              permissionsByTenant[tenant.id] = tenantPermissions;
            }

            // Test bulk permission checks for each tenant
            for (const tenant of tenants) {
              const expectedPermissions = permissionsByTenant[tenant.id];
              
              // Set tenant context
              (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenant.id);
              (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(user.id);

              // Mock user permissions query for bulk check
              permissionRepository.createQueryBuilder.mockReturnValue({
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                distinct: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(expectedPermissions),
              } as any);

              // Prepare bulk permission check requests
              const permissionRequests = permissions.map(p => ({
                entityType: p.entity_type,
                action: p.action,
              }));

              // Perform bulk permission check
              const results = await permissionService.checkBulkPermissions(
                user.id,
                tenant.id,
                permissionRequests
              );

              // Property: Bulk check should only return true for permissions in current tenant
              for (let i = 0; i < permissionRequests.length; i++) {
                const request = permissionRequests[i];
                const result = results[i];
                
                const isInCurrentTenant = expectedPermissions.some(p => 
                  p.entity_type === request.entityType && p.action === request.action
                );
                
                expect(result).toBe(isInCurrentTenant);
              }

              // Property: Should not return true for permissions from other tenants
              const otherTenantPermissions = permissions.filter(p => 
                !expectedPermissions.some(ep => 
                  ep.entity_type === p.entity_type && ep.action === p.action
                )
              );

              for (const otherPermission of otherTenantPermissions) {
                const requestIndex = permissionRequests.findIndex(r => 
                  r.entityType === otherPermission.entity_type && r.action === otherPermission.action
                );
                
                if (requestIndex >= 0) {
                  expect(results[requestIndex]).toBe(false);
                }
              }
            }
          }
        ),
        { numRuns: 15, timeout: 25000 }
      );
    });
  });
});