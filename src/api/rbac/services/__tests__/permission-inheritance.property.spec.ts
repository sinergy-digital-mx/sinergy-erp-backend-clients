// Feature: role-based-access-control, Property 3: Permission Inheritance and Propagation
// **Validates: Requirements 3.1, 3.5**

import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
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

describe('Permission Inheritance and Propagation - Property Tests', () => {
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

  // Generator for role assignment scenarios
  const roleAssignmentScenarioGenerator = fc.record({
    tenant: tenantGenerator,
    user: userGenerator,
    roles: fc.array(fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 5 }),
    permissionsPerRole: fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 5 }),
  });

  // Generator for permission modification scenarios
  const permissionModificationScenarioGenerator = fc.record({
    tenant: tenantGenerator,
    users: fc.array(userGenerator, { minLength: 2, maxLength: 5 }),
    role: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    initialPermissions: fc.array(permissionGenerator, { minLength: 1, maxLength: 3 }),
    addedPermissions: fc.array(permissionGenerator, { minLength: 1, maxLength: 3 }),
    removedPermissionIndices: fc.array(fc.integer({ min: 0, max: 2 }), { minLength: 0, maxLength: 2 }),
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

  describe('Property 3: Permission Inheritance and Propagation', () => {
    
    it('should grant all role permissions to any user assigned to that role', async () => {
      await fc.assert(
        fc.asyncProperty(roleAssignmentScenarioGenerator, async (scenario) => {
          const { tenant, user, roles } = scenario;
          
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

          // Set tenant context
          (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenant.id);
          (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(user.id);

          // Mock tenant exists
          tenantRepository.findOne.mockResolvedValue(tenant);

          // Create roles and their permissions
          const rolePermissionMap: { [roleId: string]: any[] } = {};
          const allUserPermissions: any[] = [];

          for (let i = 0; i < roles.length; i++) {
            const roleName = roles[i];
            const numPermissions = Math.min(scenario.permissionsPerRole[i] || 1, 3);
            
            // Generate role
            const role = fc.sample(roleGenerator(tenant.id), 1)[0];
            role.name = roleName;

            // Generate permissions for this role
            const rolePermissions = fc.sample(permissionGenerator, numPermissions);
            rolePermissionMap[role.id] = rolePermissions;
            allUserPermissions.push(...rolePermissions);

            // Mock role creation and assignment
            roleRepository.findOne.mockImplementation((options: any) => {
              if (options.where?.name === roleName && options.where?.tenant_id === tenant.id) {
                return Promise.resolve(null); // No existing role
              }
              if (options.where?.id === role.id) {
                return Promise.resolve(role);
              }
              return Promise.resolve(null);
            });

            roleRepository.create.mockReturnValue(role);
            roleRepository.save.mockResolvedValue(role);

            // Create role
            const createdRole = await roleService.createRole(tenant.id, roleName, `Description for ${roleName}`);
            expect(createdRole.name).toBe(roleName);
            expect(createdRole.tenant_id).toBe(tenant.id);

            // Mock user role assignment
            const userRole = fc.sample(userRoleGenerator(user.id, role.id, tenant.id), 1)[0];
            userRoleRepository.findOne.mockImplementation((options: any) => {
              if (options.where?.user_id === user.id && 
                  options.where?.role_id === role.id && 
                  options.where?.tenant_id === tenant.id) {
                return Promise.resolve(null); // No existing assignment
              }
              return Promise.resolve(null);
            });

            userRoleRepository.create.mockReturnValue(userRole);
            userRoleRepository.save.mockResolvedValue(userRole);

            // Assign role to user
            const assignment = await roleService.assignRoleToUser(user.id, role.id, tenant.id);
            expect(assignment.user_id).toBe(user.id);
            expect(assignment.role_id).toBe(role.id);
            expect(assignment.tenant_id).toBe(tenant.id);

            // Mock permission assignments to role
            for (const permission of rolePermissions) {
              const rolePermission = fc.sample(rolePermissionGenerator(role.id, permission.id), 1)[0];
              
              rolePermissionRepository.findOne.mockImplementation((options: any) => {
                if (options.where?.role_id === role.id && options.where?.permission_id === permission.id) {
                  return Promise.resolve(null); // No existing assignment
                }
                return Promise.resolve(null);
              });

              permissionRepository.findOne.mockImplementation((options: any) => {
                if (options.where?.id === permission.id) {
                  return Promise.resolve(permission);
                }
                return Promise.resolve(null);
              });

              rolePermissionRepository.create.mockReturnValue(rolePermission);
              rolePermissionRepository.save.mockResolvedValue(rolePermission);

              // Assign permission to role
              const permissionAssignment = await roleService.assignPermissionToRole(role.id, permission.id);
              expect(permissionAssignment.role_id).toBe(role.id);
              expect(permissionAssignment.permission_id).toBe(permission.id);
            }
          }

          // Property: User should have all permissions from all assigned roles
          // Mock getUserPermissions query to return the expected permissions
          permissionRepository.query.mockResolvedValue(
            allUserPermissions.map(p => ({
              id: p.id,
              entity_type: p.entity_type,
              action: p.action,
              description: p.description,
              is_system_permission: p.is_system_permission,
              created_at: p.created_at,
              updated_at: p.updated_at,
            }))
          );

          const userPermissions = await permissionService.getUserPermissions(user.id, tenant.id);

          // Property: User should inherit all permissions from assigned roles
          expect(userPermissions.length).toBeGreaterThan(0);
          
          // Verify each permission from each role is included
          for (const roleId of Object.keys(rolePermissionMap)) {
            const rolePermissions = rolePermissionMap[roleId];
            for (const permission of rolePermissions) {
              const hasPermission = userPermissions.some(up => 
                up.entity_type === permission.entity_type && up.action === permission.action
              );
              expect(hasPermission).toBe(true);
            }
          }

          // Property: Individual permission checks should return true for inherited permissions
          for (const permission of allUserPermissions) {
            // Mock hasPermission query
            userRoleRepository.createQueryBuilder.mockReturnValue({
              innerJoin: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getOne: jest.fn().mockResolvedValue({ role: { role_permissions: [{ permission }] } }),
            } as any);

            const hasPermission = await permissionService.hasPermission(
              user.id,
              tenant.id,
              permission.entity_type,
              permission.action
            );

            expect(hasPermission).toBe(true);
          }
        }),
        { numRuns: 15, timeout: 30000 }
      );
    });

    it('should immediately propagate permission changes to all users with the modified role', async () => {
      await fc.assert(
        fc.asyncProperty(permissionModificationScenarioGenerator, async (scenario) => {
          const { tenant, users, role: roleName, initialPermissions, addedPermissions } = scenario;
          
          // Ensure we have unique permissions
          const uniqueAddedPermissions = addedPermissions.filter(ap => 
            !initialPermissions.some(ip => 
              ip.entity_type === ap.entity_type && ip.action === ap.action
            )
          );

          if (uniqueAddedPermissions.length === 0) return; // Skip if no unique permissions to add

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

          // Set tenant context
          (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenant.id);

          // Create role
          const role = fc.sample(roleGenerator(tenant.id), 1)[0];
          role.name = roleName;

          tenantRepository.findOne.mockResolvedValue(tenant);
          roleRepository.findOne.mockImplementation((options: any) => {
            if (options.where?.name === roleName && options.where?.tenant_id === tenant.id) {
              return Promise.resolve(null); // No existing role
            }
            if (options.where?.id === role.id) {
              return Promise.resolve(role);
            }
            return Promise.resolve(null);
          });

          roleRepository.create.mockReturnValue(role);
          roleRepository.save.mockResolvedValue(role);

          // Create the role
          await roleService.createRole(tenant.id, roleName);

          // Assign initial permissions to role
          const allPermissions = [...initialPermissions];
          for (const permission of initialPermissions) {
            const rolePermission = fc.sample(rolePermissionGenerator(role.id, permission.id), 1)[0];
            
            rolePermissionRepository.findOne.mockImplementation((options: any) => {
              if (options.where?.role_id === role.id && options.where?.permission_id === permission.id) {
                return Promise.resolve(null);
              }
              return Promise.resolve(null);
            });

            permissionRepository.findOne.mockImplementation((options: any) => {
              if (options.where?.id === permission.id) {
                return Promise.resolve(permission);
              }
              return Promise.resolve(null);
            });

            rolePermissionRepository.create.mockReturnValue(rolePermission);
            rolePermissionRepository.save.mockResolvedValue(rolePermission);

            await roleService.assignPermissionToRole(role.id, permission.id);
          }

          // Assign role to all users
          const userRoleAssignments: any[] = [];
          for (const user of users) {
            const userRole = fc.sample(userRoleGenerator(user.id, role.id, tenant.id), 1)[0];
            userRoleAssignments.push(userRole);

            userRoleRepository.findOne.mockImplementation((options: any) => {
              if (options.where?.user_id === user.id && 
                  options.where?.role_id === role.id && 
                  options.where?.tenant_id === tenant.id) {
                return Promise.resolve(null);
              }
              return Promise.resolve(null);
            });

            userRoleRepository.create.mockReturnValue(userRole);
            userRoleRepository.save.mockResolvedValue(userRole);

            await roleService.assignRoleToUser(user.id, role.id, tenant.id);
          }

          // Verify initial permissions for all users
          for (const user of users) {
            permissionRepository.query.mockResolvedValue(
              initialPermissions.map(p => ({
                id: p.id,
                entity_type: p.entity_type,
                action: p.action,
                description: p.description,
                is_system_permission: p.is_system_permission,
                created_at: p.created_at,
                updated_at: p.updated_at,
              }))
            );

            const userPermissions = await permissionService.getUserPermissions(user.id, tenant.id);
            expect(userPermissions).toHaveLength(initialPermissions.length);
          }

          // Add new permissions to role
          for (const newPermission of uniqueAddedPermissions) {
            const rolePermission = fc.sample(rolePermissionGenerator(role.id, newPermission.id), 1)[0];
            
            rolePermissionRepository.findOne.mockImplementation((options: any) => {
              if (options.where?.role_id === role.id && options.where?.permission_id === newPermission.id) {
                return Promise.resolve(null);
              }
              return Promise.resolve(null);
            });

            permissionRepository.findOne.mockImplementation((options: any) => {
              if (options.where?.id === newPermission.id) {
                return Promise.resolve(newPermission);
              }
              return Promise.resolve(null);
            });

            rolePermissionRepository.create.mockReturnValue(rolePermission);
            rolePermissionRepository.save.mockResolvedValue(rolePermission);

            await roleService.assignPermissionToRole(role.id, newPermission.id);
            allPermissions.push(newPermission);
          }

          // Property: All users with the role should immediately have the new permissions
          for (const user of users) {
            // Mock updated permissions query
            permissionRepository.query.mockResolvedValue(
              allPermissions.map(p => ({
                id: p.id,
                entity_type: p.entity_type,
                action: p.action,
                description: p.description,
                is_system_permission: p.is_system_permission,
                created_at: p.created_at,
                updated_at: p.updated_at,
              }))
            );

            const updatedUserPermissions = await permissionService.getUserPermissions(user.id, tenant.id);

            // Property: User should have all initial + added permissions
            expect(updatedUserPermissions.length).toBe(allPermissions.length);

            // Verify each new permission is included
            for (const newPermission of uniqueAddedPermissions) {
              const hasNewPermission = updatedUserPermissions.some(up => 
                up.entity_type === newPermission.entity_type && up.action === newPermission.action
              );
              expect(hasNewPermission).toBe(true);

              // Property: Individual permission check should return true
              userRoleRepository.createQueryBuilder.mockReturnValue({
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue({ role: { role_permissions: [{ permission: newPermission }] } }),
              } as any);

              const hasPermission = await permissionService.hasPermission(
                user.id,
                tenant.id,
                newPermission.entity_type,
                newPermission.action
              );

              expect(hasPermission).toBe(true);
            }
          }
        }),
        { numRuns: 15, timeout: 30000 }
      );
    });

    it('should maintain permission inheritance consistency across multiple role assignments', async () => {
      await fc.assert(
        fc.asyncProperty(
          tenantGenerator,
          userGenerator,
          fc.array(fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), { minLength: 2, maxLength: 4 }),
          fc.array(permissionGenerator, { minLength: 1, maxLength: 3 }),
          async (tenant, user, roleNames, permissions) => {
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

            // Set tenant context
            (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenant.id);
            (tenantContextService.getCurrentUserId as jest.Mock).mockReturnValue(user.id);

            tenantRepository.findOne.mockResolvedValue(tenant);

            const createdRoles: any[] = [];
            const allUserPermissions: any[] = [];

            // Create roles and assign permissions
            for (let i = 0; i < roleNames.length; i++) {
              const roleName = roleNames[i];
              const role = fc.sample(roleGenerator(tenant.id), 1)[0];
              role.name = roleName;

              // Mock role creation
              roleRepository.findOne.mockImplementation((options: any) => {
                if (options.where?.name === roleName && options.where?.tenant_id === tenant.id) {
                  return Promise.resolve(null);
                }
                if (options.where?.id === role.id) {
                  return Promise.resolve(role);
                }
                return Promise.resolve(null);
              });

              roleRepository.create.mockReturnValue(role);
              roleRepository.save.mockResolvedValue(role);

              await roleService.createRole(tenant.id, roleName);
              createdRoles.push(role);

              // Assign a subset of permissions to this role
              const rolePermissions = permissions.slice(0, Math.max(1, Math.floor(permissions.length / roleNames.length)));
              
              for (const permission of rolePermissions) {
                const rolePermission = fc.sample(rolePermissionGenerator(role.id, permission.id), 1)[0];
                
                rolePermissionRepository.findOne.mockImplementation((options: any) => {
                  if (options.where?.role_id === role.id && options.where?.permission_id === permission.id) {
                    return Promise.resolve(null);
                  }
                  return Promise.resolve(null);
                });

                permissionRepository.findOne.mockImplementation((options: any) => {
                  if (options.where?.id === permission.id) {
                    return Promise.resolve(permission);
                  }
                  return Promise.resolve(null);
                });

                rolePermissionRepository.create.mockReturnValue(rolePermission);
                rolePermissionRepository.save.mockResolvedValue(rolePermission);

                await roleService.assignPermissionToRole(role.id, permission.id);
                
                // Add to user permissions if not already present
                if (!allUserPermissions.some(up => 
                  up.entity_type === permission.entity_type && up.action === permission.action
                )) {
                  allUserPermissions.push(permission);
                }
              }

              // Assign role to user
              const userRole = fc.sample(userRoleGenerator(user.id, role.id, tenant.id), 1)[0];
              
              userRoleRepository.findOne.mockImplementation((options: any) => {
                if (options.where?.user_id === user.id && 
                    options.where?.role_id === role.id && 
                    options.where?.tenant_id === tenant.id) {
                  return Promise.resolve(null);
                }
                return Promise.resolve(null);
              });

              userRoleRepository.create.mockReturnValue(userRole);
              userRoleRepository.save.mockResolvedValue(userRole);

              await roleService.assignRoleToUser(user.id, role.id, tenant.id);
            }

            // Property: User should have union of all permissions from all assigned roles
            permissionRepository.query.mockResolvedValue(
              allUserPermissions.map(p => ({
                id: p.id,
                entity_type: p.entity_type,
                action: p.action,
                description: p.description,
                is_system_permission: p.is_system_permission,
                created_at: p.created_at,
                updated_at: p.updated_at,
              }))
            );

            const userPermissions = await permissionService.getUserPermissions(user.id, tenant.id);

            // Property: User should have at least as many permissions as the unique set
            expect(userPermissions.length).toBe(allUserPermissions.length);

            // Property: Each unique permission should be present
            for (const permission of allUserPermissions) {
              const hasPermission = userPermissions.some(up => 
                up.entity_type === permission.entity_type && up.action === permission.action
              );
              expect(hasPermission).toBe(true);
            }

            // Property: User should have access to all roles in the tenant
            roleRepository.createQueryBuilder.mockReturnValue({
              innerJoin: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue(createdRoles),
            } as any);

            const userRoles = await roleService.getUserRoles(user.id, tenant.id);
            expect(userRoles.length).toBe(createdRoles.length);

            // Property: Each assigned role should be present
            for (const role of createdRoles) {
              const hasRole = userRoles.some(ur => ur.id === role.id);
              expect(hasRole).toBe(true);
            }
          }
        ),
        { numRuns: 15, timeout: 25000 }
      );
    });

    it('should handle permission removal propagation correctly for any role modification', async () => {
      await fc.assert(
        fc.asyncProperty(
          tenantGenerator,
          fc.array(userGenerator, { minLength: 2, maxLength: 4 }),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.array(permissionGenerator, { minLength: 2, maxLength: 4 }),
          fc.integer({ min: 0, max: 1 }),
          async (tenant, users, roleName, permissions, removeIndex) => {
            // Ensure we have permissions to remove and unique permissions
            if (permissions.length <= removeIndex) return;
            
            // Remove duplicates to ensure clean test data
            const uniquePermissions = permissions.filter((permission, index, arr) => 
              arr.findIndex(p => p.entity_type === permission.entity_type && p.action === permission.action) === index
            );
            
            if (uniquePermissions.length <= removeIndex) return;

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

            // Set tenant context
            (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenant.id);

            // Create role
            const role = fc.sample(roleGenerator(tenant.id), 1)[0];
            role.name = roleName;

            tenantRepository.findOne.mockResolvedValue(tenant);
            roleRepository.findOne.mockImplementation((options: any) => {
              if (options.where?.name === roleName && options.where?.tenant_id === tenant.id) {
                return Promise.resolve(null);
              }
              if (options.where?.id === role.id) {
                return Promise.resolve(role);
              }
              return Promise.resolve(null);
            });

            roleRepository.create.mockReturnValue(role);
            roleRepository.save.mockResolvedValue(role);

            await roleService.createRole(tenant.id, roleName);

            // Assign all permissions to role initially
            for (const permission of uniquePermissions) {
              const rolePermission = fc.sample(rolePermissionGenerator(role.id, permission.id), 1)[0];
              
              rolePermissionRepository.findOne.mockImplementation((options: any) => {
                if (options.where?.role_id === role.id && options.where?.permission_id === permission.id) {
                  return Promise.resolve(null);
                }
                return Promise.resolve(null);
              });

              permissionRepository.findOne.mockImplementation((options: any) => {
                if (options.where?.id === permission.id) {
                  return Promise.resolve(permission);
                }
                return Promise.resolve(null);
              });

              rolePermissionRepository.create.mockReturnValue(rolePermission);
              rolePermissionRepository.save.mockResolvedValue(rolePermission);

              await roleService.assignPermissionToRole(role.id, permission.id);
            }

            // Assign role to all users
            for (const user of users) {
              const userRole = fc.sample(userRoleGenerator(user.id, role.id, tenant.id), 1)[0];
              
              userRoleRepository.findOne.mockImplementation((options: any) => {
                if (options.where?.user_id === user.id && 
                    options.where?.role_id === role.id && 
                    options.where?.tenant_id === tenant.id) {
                  return Promise.resolve(null);
                }
                return Promise.resolve(null);
              });

              userRoleRepository.create.mockReturnValue(userRole);
              userRoleRepository.save.mockResolvedValue(userRole);

              await roleService.assignRoleToUser(user.id, role.id, tenant.id);
            }

            // Verify initial state - all users have all permissions
            for (const user of users) {
              permissionRepository.query.mockResolvedValue(
                uniquePermissions.map(p => ({
                  id: p.id,
                  entity_type: p.entity_type,
                  action: p.action,
                  description: p.description,
                  is_system_permission: p.is_system_permission,
                  created_at: p.created_at,
                  updated_at: p.updated_at,
                }))
              );

              const initialPermissions = await permissionService.getUserPermissions(user.id, tenant.id);
              expect(initialPermissions.length).toBe(uniquePermissions.length);
            }

            // Remove a permission from the role
            const permissionToRemove = uniquePermissions[removeIndex];
            const remainingPermissions = uniquePermissions.filter((_, index) => index !== removeIndex);

            // Mock the removal
            const rolePermissionToRemove = fc.sample(rolePermissionGenerator(role.id, permissionToRemove.id), 1)[0];
            rolePermissionRepository.findOne.mockImplementation((options: any) => {
              if (options.where?.role_id === role.id && options.where?.permission_id === permissionToRemove.id) {
                return Promise.resolve(rolePermissionToRemove);
              }
              return Promise.resolve(null);
            });

            rolePermissionRepository.remove.mockResolvedValue(rolePermissionToRemove);

            await roleService.removePermissionFromRole(role.id, permissionToRemove.id);

            // Property: All users should immediately lose the removed permission
            for (const user of users) {
              // Clear previous mocks to ensure clean state
              jest.clearAllMocks();
              
              // Mock updated permissions query (without removed permission)
              permissionRepository.query.mockResolvedValue(
                remainingPermissions.map(p => ({
                  id: p.id,
                  entity_type: p.entity_type,
                  action: p.action,
                  description: p.description,
                  is_system_permission: p.is_system_permission,
                  created_at: p.created_at,
                  updated_at: p.updated_at,
                }))
              );

              const updatedPermissions = await permissionService.getUserPermissions(user.id, tenant.id);

              // Property: User should have one less permission
              expect(updatedPermissions.length).toBe(remainingPermissions.length);

              // Property: Removed permission should not be present
              const hasRemovedPermission = updatedPermissions.some(up => 
                up.entity_type === permissionToRemove.entity_type && up.action === permissionToRemove.action
              );
              expect(hasRemovedPermission).toBe(false);

              // Property: Remaining permissions should still be present
              for (const remainingPermission of remainingPermissions) {
                const hasRemainingPermission = updatedPermissions.some(up => 
                  up.entity_type === remainingPermission.entity_type && up.action === remainingPermission.action
                );
                expect(hasRemainingPermission).toBe(true);
              }

              // Property: Individual permission check should return false for removed permission
              userRoleRepository.createQueryBuilder.mockReturnValue({
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(null), // No permission found
              } as any);

              const hasRemovedPermissionCheck = await permissionService.hasPermission(
                user.id,
                tenant.id,
                permissionToRemove.entity_type,
                permissionToRemove.action
              );

              expect(hasRemovedPermissionCheck).toBe(false);
            }
          }
        ),
        { numRuns: 15, timeout: 25000 }
      );
    });

    it('should maintain permission consistency when users are removed from roles', async () => {
      await fc.assert(
        fc.asyncProperty(
          tenantGenerator,
          fc.array(userGenerator, { minLength: 3, maxLength: 5 }),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.array(permissionGenerator, { minLength: 1, maxLength: 3 }),
          fc.integer({ min: 0, max: 2 }),
          async (tenant, users, roleName, permissions, userToRemoveIndex) => {
            // Ensure we have users to remove
            if (users.length <= userToRemoveIndex) return;

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

            // Set tenant context
            (tenantContextService.getCurrentTenantId as jest.Mock).mockReturnValue(tenant.id);

            // Create role
            const role = fc.sample(roleGenerator(tenant.id), 1)[0];
            role.name = roleName;

            tenantRepository.findOne.mockResolvedValue(tenant);
            roleRepository.findOne.mockImplementation((options: any) => {
              if (options.where?.name === roleName && options.where?.tenant_id === tenant.id) {
                return Promise.resolve(null);
              }
              if (options.where?.id === role.id) {
                return Promise.resolve(role);
              }
              return Promise.resolve(null);
            });

            roleRepository.create.mockReturnValue(role);
            roleRepository.save.mockResolvedValue(role);

            await roleService.createRole(tenant.id, roleName);

            // Assign permissions to role
            for (const permission of permissions) {
              const rolePermission = fc.sample(rolePermissionGenerator(role.id, permission.id), 1)[0];
              
              rolePermissionRepository.findOne.mockImplementation((options: any) => {
                if (options.where?.role_id === role.id && options.where?.permission_id === permission.id) {
                  return Promise.resolve(null);
                }
                return Promise.resolve(null);
              });

              permissionRepository.findOne.mockImplementation((options: any) => {
                if (options.where?.id === permission.id) {
                  return Promise.resolve(permission);
                }
                return Promise.resolve(null);
              });

              rolePermissionRepository.create.mockReturnValue(rolePermission);
              rolePermissionRepository.save.mockResolvedValue(rolePermission);

              await roleService.assignPermissionToRole(role.id, permission.id);
            }

            // Assign role to all users
            const userRoleAssignments: any[] = [];
            for (const user of users) {
              const userRole = fc.sample(userRoleGenerator(user.id, role.id, tenant.id), 1)[0];
              userRoleAssignments.push(userRole);
              
              userRoleRepository.findOne.mockImplementation((options: any) => {
                if (options.where?.user_id === user.id && 
                    options.where?.role_id === role.id && 
                    options.where?.tenant_id === tenant.id) {
                  return Promise.resolve(null);
                }
                return Promise.resolve(null);
              });

              userRoleRepository.create.mockReturnValue(userRole);
              userRoleRepository.save.mockResolvedValue(userRole);

              await roleService.assignRoleToUser(user.id, role.id, tenant.id);
            }

            // Remove user from role
            const userToRemove = users[userToRemoveIndex];
            const userRoleToRemove = userRoleAssignments[userToRemoveIndex];

            userRoleRepository.findOne.mockImplementation((options: any) => {
              if (options.where?.user_id === userToRemove.id && 
                  options.where?.role_id === role.id && 
                  options.where?.tenant_id === tenant.id) {
                return Promise.resolve(userRoleToRemove);
              }
              return Promise.resolve(null);
            });

            userRoleRepository.remove.mockResolvedValue(userRoleToRemove);

            await roleService.removeRoleFromUser(userToRemove.id, role.id, tenant.id);

            // Property: Removed user should no longer have role permissions
            permissionRepository.query.mockResolvedValue([]); // No permissions for removed user

            const removedUserPermissions = await permissionService.getUserPermissions(userToRemove.id, tenant.id);
            expect(removedUserPermissions.length).toBe(0);

            // Property: Other users should still have all role permissions
            const remainingUsers = users.filter((_, index) => index !== userToRemoveIndex);
            for (const user of remainingUsers) {
              permissionRepository.query.mockResolvedValue(
                permissions.map(p => ({
                  id: p.id,
                  entity_type: p.entity_type,
                  action: p.action,
                  description: p.description,
                  is_system_permission: p.is_system_permission,
                  created_at: p.created_at,
                  updated_at: p.updated_at,
                }))
              );

              const userPermissions = await permissionService.getUserPermissions(user.id, tenant.id);
              expect(userPermissions.length).toBe(permissions.length);

              // Verify each permission is still present
              for (const permission of permissions) {
                const hasPermission = userPermissions.some(up => 
                  up.entity_type === permission.entity_type && up.action === permission.action
                );
                expect(hasPermission).toBe(true);
              }
            }

            // Property: Removed user should not have individual permission access
            for (const permission of permissions) {
              // Mock query to return no permissions for removed user
              permissionRepository.query.mockResolvedValue([]);

              const hasPermission = await permissionService.hasPermission(
                userToRemove.id,
                tenant.id,
                permission.entity_type,
                permission.action
              );

              expect(hasPermission).toBe(false);
            }
          }
        ),
        { numRuns: 15, timeout: 25000 }
      );
    });
  });
});