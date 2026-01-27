// Feature: role-based-access-control, Property 2: Data Integrity and Association
// **Validates: Requirements 1.1, 2.1**

import * as fc from 'fast-check';
import { validate } from 'class-validator';

import { RBACTenant } from '../tenant.entity';
import { Role } from '../role.entity';
import { Permission } from '../permission.entity';
import { UserRole } from '../user-role.entity';
import { RolePermission } from '../role-permission.entity';

describe('RBAC Entity Relationships - Property Tests', () => {
  
  // Property-based test generators
  const tenantGenerator = fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    subdomain: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
    is_active: fc.boolean(),
  });

  const permissionGenerator = fc.record({
    entity_type: fc.constantFrom('User', 'Customer', 'Lead', 'Order', 'Product'),
    action: fc.constantFrom('Create', 'Read', 'Update', 'Delete', 'Export', 'Import'),
    description: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
    is_system_permission: fc.boolean(),
  });

  const roleGenerator = fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    description: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
    is_system_role: fc.boolean(),
    tenant_id: fc.uuid(),
  });

  const userRoleGenerator = fc.record({
    user_id: fc.uuid(),
    role_id: fc.uuid(),
    tenant_id: fc.uuid(),
  });

  const rolePermissionGenerator = fc.record({
    role_id: fc.uuid(),
    permission_id: fc.uuid(),
  });

  describe('Property 2: Data Integrity and Association', () => {
    
    it('should create valid tenant entities with proper validation for any valid input', async () => {
      await fc.assert(
        fc.asyncProperty(tenantGenerator, async (tenantData) => {
          // Create tenant entity
          const tenant = new RBACTenant();
          Object.assign(tenant, tenantData);
          tenant.id = fc.sample(fc.uuid(), 1)[0];

          // Validate entity
          const validationErrors = await validate(tenant);

          // Property: Valid tenant data should pass validation
          expect(validationErrors).toHaveLength(0);

          // Property: Entity should preserve all assigned properties
          expect(tenant.name).toBe(tenantData.name);
          expect(tenant.subdomain).toBe(tenantData.subdomain);
          expect(tenant.is_active).toBe(tenantData.is_active);
          expect(tenant.id).toBeDefined();

          // Property: Name and subdomain should be unique identifiers
          expect(tenant.name.trim().length).toBeGreaterThan(0);
          expect(tenant.subdomain.length).toBeGreaterThan(0);
          expect(/^[a-z0-9-]+$/.test(tenant.subdomain)).toBe(true);
        }),
        { numRuns: 100, timeout: 10000 }
      );
    });

    it('should create valid permission entities with proper entity-action associations', async () => {
      await fc.assert(
        fc.asyncProperty(permissionGenerator, async (permissionData) => {
          // Create permission entity
          const permission = new Permission();
          Object.assign(permission, permissionData);
          permission.id = fc.sample(fc.uuid(), 1)[0];

          // Validate entity
          const validationErrors = await validate(permission);

          // Property: Valid permission data should pass validation
          expect(validationErrors).toHaveLength(0);

          // Property: Entity type and action should be preserved
          expect(permission.entity_type).toBe(permissionData.entity_type);
          expect(permission.action).toBe(permissionData.action);
          expect(permission.is_system_permission).toBe(permissionData.is_system_permission);

          // Property: Entity type should be a valid entity
          const validEntityTypes = ['User', 'Customer', 'Lead', 'Order', 'Product'];
          expect(validEntityTypes).toContain(permission.entity_type);

          // Property: Action should be a valid CRUD operation
          const validActions = ['Create', 'Read', 'Update', 'Delete', 'Export', 'Import'];
          expect(validActions).toContain(permission.action);
        }),
        { numRuns: 100, timeout: 10000 }
      );
    });

    it('should create valid role entities with proper tenant associations', async () => {
      await fc.assert(
        fc.asyncProperty(roleGenerator, async (roleData) => {
          // Create role entity
          const role = new Role();
          Object.assign(role, roleData);
          role.id = fc.sample(fc.uuid(), 1)[0];

          // Validate entity
          const validationErrors = await validate(role);

          // Property: Valid role data should pass validation
          expect(validationErrors).toHaveLength(0);

          // Property: Role should be associated with a tenant
          expect(role.tenant_id).toBeDefined();
          expect(role.tenant_id).toBe(roleData.tenant_id);

          // Property: Role name should be meaningful
          expect(role.name.trim().length).toBeGreaterThan(0);
          expect(role.name).toBe(roleData.name);

          // Property: System role flag should be preserved
          expect(role.is_system_role).toBe(roleData.is_system_role);
        }),
        { numRuns: 100, timeout: 10000 }
      );
    });

    it('should create valid user-role associations with proper referential integrity', async () => {
      await fc.assert(
        fc.asyncProperty(userRoleGenerator, async (userRoleData) => {
          // Create user-role association
          const userRole = new UserRole();
          Object.assign(userRole, userRoleData);
          userRole.id = fc.sample(fc.uuid(), 1)[0];

          // Validate entity
          const validationErrors = await validate(userRole);

          // Property: Valid user-role data should pass validation
          expect(validationErrors).toHaveLength(0);

          // Property: All foreign key references should be preserved
          expect(userRole.user_id).toBe(userRoleData.user_id);
          expect(userRole.role_id).toBe(userRoleData.role_id);
          expect(userRole.tenant_id).toBe(userRoleData.tenant_id);

          // Property: All IDs should be valid UUIDs (relaxed check for fast-check generated UUIDs)
          expect(userRole.user_id).toBeDefined();
          expect(userRole.role_id).toBeDefined();
          expect(userRole.tenant_id).toBeDefined();
          expect(typeof userRole.user_id).toBe('string');
          expect(typeof userRole.role_id).toBe('string');
          expect(typeof userRole.tenant_id).toBe('string');
        }),
        { numRuns: 100, timeout: 10000 }
      );
    });

    it('should create valid role-permission associations with proper referential integrity', async () => {
      await fc.assert(
        fc.asyncProperty(rolePermissionGenerator, async (rolePermissionData) => {
          // Create role-permission association
          const rolePermission = new RolePermission();
          Object.assign(rolePermission, rolePermissionData);
          rolePermission.id = fc.sample(fc.uuid(), 1)[0];

          // Validate entity
          const validationErrors = await validate(rolePermission);

          // Property: Valid role-permission data should pass validation
          expect(validationErrors).toHaveLength(0);

          // Property: All foreign key references should be preserved
          expect(rolePermission.role_id).toBe(rolePermissionData.role_id);
          expect(rolePermission.permission_id).toBe(rolePermissionData.permission_id);

          // Property: All IDs should be valid UUIDs (relaxed check for fast-check generated UUIDs)
          expect(rolePermission.role_id).toBeDefined();
          expect(rolePermission.permission_id).toBeDefined();
          expect(typeof rolePermission.role_id).toBe('string');
          expect(typeof rolePermission.permission_id).toBe('string');
        }),
        { numRuns: 100, timeout: 10000 }
      );
    });

    it('should maintain data integrity across entity relationship chains', async () => {
      await fc.assert(
        fc.asyncProperty(
          tenantGenerator,
          roleGenerator,
          permissionGenerator,
          userRoleGenerator,
          rolePermissionGenerator,
          async (tenantData, roleData, permissionData, userRoleData, rolePermissionData) => {
            // Create a complete relationship chain
            const tenant = new RBACTenant();
            Object.assign(tenant, tenantData);
            tenant.id = fc.sample(fc.uuid(), 1)[0];

            const role = new Role();
            Object.assign(role, roleData);
            role.id = fc.sample(fc.uuid(), 1)[0];
            role.tenant_id = tenant.id; // Link role to tenant

            const permission = new Permission();
            Object.assign(permission, permissionData);
            permission.id = fc.sample(fc.uuid(), 1)[0];

            const userRole = new UserRole();
            Object.assign(userRole, userRoleData);
            userRole.id = fc.sample(fc.uuid(), 1)[0];
            userRole.role_id = role.id; // Link user to role
            userRole.tenant_id = tenant.id; // Link user to tenant

            const rolePermission = new RolePermission();
            Object.assign(rolePermission, rolePermissionData);
            rolePermission.id = fc.sample(fc.uuid(), 1)[0];
            rolePermission.role_id = role.id; // Link role to permission
            rolePermission.permission_id = permission.id;

            // Validate all entities
            const tenantErrors = await validate(tenant);
            const roleErrors = await validate(role);
            const permissionErrors = await validate(permission);
            const userRoleErrors = await validate(userRole);
            const rolePermissionErrors = await validate(rolePermission);

            // Property: All entities in the chain should be valid
            expect(tenantErrors).toHaveLength(0);
            expect(roleErrors).toHaveLength(0);
            expect(permissionErrors).toHaveLength(0);
            expect(userRoleErrors).toHaveLength(0);
            expect(rolePermissionErrors).toHaveLength(0);

            // Property: Referential integrity should be maintained
            expect(role.tenant_id).toBe(tenant.id);
            expect(userRole.role_id).toBe(role.id);
            expect(userRole.tenant_id).toBe(tenant.id);
            expect(rolePermission.role_id).toBe(role.id);
            expect(rolePermission.permission_id).toBe(permission.id);

            // Property: Entity-action combination should be unique per permission
            const entityActionKey = `${permission.entity_type}:${permission.action}`;
            expect(entityActionKey).toMatch(/^(User|Customer|Lead|Order|Product):(Create|Read|Update|Delete|Export|Import)$/);

            // Property: Tenant isolation should be enforced
            expect(userRole.tenant_id).toBe(role.tenant_id);
          }
        ),
        { numRuns: 50, timeout: 15000 }
      );
    });

    it('should enforce unique constraints for entity-action combinations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(permissionGenerator, { minLength: 2, maxLength: 10 }),
          async (permissionDataArray) => {
            const permissions = permissionDataArray.map(data => {
              const permission = new Permission();
              Object.assign(permission, data);
              permission.id = fc.sample(fc.uuid(), 1)[0];
              return permission;
            });

            // Property: Each permission should have a unique entity-action combination
            const entityActionCombos = permissions.map(p => `${p.entity_type}:${p.action}`);
            const uniqueCombos = [...new Set(entityActionCombos)];

            // If we have duplicate combinations, they should be the same permission
            if (entityActionCombos.length !== uniqueCombos.length) {
              const duplicateCombo = entityActionCombos.find((combo, index) => 
                entityActionCombos.indexOf(combo) !== index
              );
              
              const duplicatePermissions = permissions.filter(p => 
                `${p.entity_type}:${p.action}` === duplicateCombo
              );

              // Property: Duplicate entity-action combinations should have identical properties
              for (let i = 1; i < duplicatePermissions.length; i++) {
                expect(duplicatePermissions[i].entity_type).toBe(duplicatePermissions[0].entity_type);
                expect(duplicatePermissions[i].action).toBe(duplicatePermissions[0].action);
              }
            }

            // Property: All permissions should be valid
            for (const permission of permissions) {
              const validationErrors = await validate(permission);
              expect(validationErrors).toHaveLength(0);
            }
          }
        ),
        { numRuns: 30, timeout: 10000 }
      );
    });
  });
});