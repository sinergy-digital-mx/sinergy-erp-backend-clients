import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

interface RoleWithPermissions {
  roleId: string;
  roleName: string;
  isSystemRole: boolean;
  tenantId: string;
  permissions: {
    id: string;
    action: string;
    entityType: string;
    description: string;
    moduleName: string;
  }[];
}

async function getDetailedRolePermissions() {
  const dataSource = new DataSource(typeOrmOptions);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Query to get detailed role permissions
    const query = `
      SELECT 
        r.id as "roleId",
        r.name as "roleName",
        r.is_system_role as "isSystemRole",
        r.tenant_id as "tenantId",
        p.id as "permissionId",
        p.action as "action",
        er.entity_name as "entityType",
        p.description as "description",
        m.name as "moduleName"
      FROM rbac_roles r
      LEFT JOIN rbac_role_permissions rp ON r.id = rp.role_id
      LEFT JOIN rbac_permissions p ON rp.permission_id = p.id
      LEFT JOIN rbac_entity_registry er ON p.entity_registry_id = er.id
      LEFT JOIN rbac_modules m ON p.module_id = m.id
      ORDER BY r.name, m.name, er.entity_name, p.action
    `;

    const results = await dataSource.query(query);

    // Group results by role
    const roleMap = new Map<string, RoleWithPermissions>();

    results.forEach((row: any) => {
      if (!roleMap.has(row.roleId)) {
        roleMap.set(row.roleId, {
          roleId: row.roleId,
          roleName: row.roleName,
          isSystemRole: row.isSystemRole,
          tenantId: row.tenantId,
          permissions: []
        });
      }

      const role = roleMap.get(row.roleId)!;
      
      // Only add permission if it exists (not null from LEFT JOIN)
      if (row.permissionId) {
        role.permissions.push({
          id: row.permissionId,
          action: row.action,
          entityType: row.entityType || 'Unknown',
          description: row.description || '',
          moduleName: row.moduleName || 'No Module'
        });
      }
    });

    const roles = Array.from(roleMap.values());

    console.log('\n📋 DETAILED ROLE PERMISSIONS REPORT');
    console.log('='.repeat(80));

    if (roles.length === 0) {
      console.log('❌ No roles found in the database');
      return;
    }

    // Group by tenant
    const rolesByTenant = roles.reduce((acc, role) => {
      const tenantId = role.tenantId || 'system';
      if (!acc[tenantId]) {
        acc[tenantId] = [];
      }
      acc[tenantId].push(role);
      return acc;
    }, {} as Record<string, RoleWithPermissions[]>);

    // Display detailed results
    for (const [tenantId, tenantRoles] of Object.entries(rolesByTenant)) {
      console.log(`\n🏢 TENANT: ${tenantId === 'system' ? 'System Roles' : tenantId}`);
      console.log('='.repeat(60));
      
      tenantRoles.forEach(role => {
        const systemBadge = role.isSystemRole ? '🔧 [SYSTEM]' : '👤 [CUSTOM]';
        const permissionCount = role.permissions.length;
        const permissionText = permissionCount === 1 ? 'permission' : 'permissions';
        
        console.log(`\n${systemBadge} ${role.roleName}`);
        console.log(`📊 Total: ${permissionCount} ${permissionText}`);
        console.log(`🆔 ID: ${role.roleId}`);
        
        if (permissionCount === 0) {
          console.log('   ❌ No permissions assigned');
        } else {
          // Group permissions by module
          const permissionsByModule = role.permissions.reduce((acc, perm) => {
            const module = perm.moduleName || 'No Module';
            if (!acc[module]) {
              acc[module] = [];
            }
            acc[module].push(perm);
            return acc;
          }, {} as Record<string, typeof role.permissions>);

          Object.entries(permissionsByModule).forEach(([moduleName, modulePermissions]) => {
            console.log(`\n   📦 Module: ${moduleName} (${modulePermissions.length} permissions)`);
            
            // Group by entity type within module
            const permissionsByEntity = modulePermissions.reduce((acc, perm) => {
              const entity = perm.entityType;
              if (!acc[entity]) {
                acc[entity] = [];
              }
              acc[entity].push(perm);
              return acc;
            }, {} as Record<string, typeof modulePermissions>);

            Object.entries(permissionsByEntity).forEach(([entityType, entityPermissions]) => {
              console.log(`      🏷️  ${entityType}:`);
              entityPermissions.forEach(perm => {
                const description = perm.description ? ` - ${perm.description}` : '';
                console.log(`         ✓ ${perm.action}${description}`);
              });
            });
          });
        }
        
        console.log('-'.repeat(50));
      });
    }

    // Summary by module
    console.log('\n📊 PERMISSIONS SUMMARY BY MODULE');
    console.log('='.repeat(50));
    
    const allPermissions = roles.flatMap(role => role.permissions);
    const permissionsByModule = allPermissions.reduce((acc, perm) => {
      const module = perm.moduleName || 'No Module';
      if (!acc[module]) {
        acc[module] = new Set();
      }
      acc[module].add(`${perm.entityType}.${perm.action}`);
      return acc;
    }, {} as Record<string, Set<string>>);

    Object.entries(permissionsByModule)
      .sort(([, a], [, b]) => b.size - a.size)
      .forEach(([module, permissions]) => {
        console.log(`📦 ${module}: ${permissions.size} unique permissions`);
      });

    // Overall statistics
    const totalRoles = roles.length;
    const systemRoles = roles.filter(r => r.isSystemRole).length;
    const customRoles = roles.filter(r => !r.isSystemRole).length;
    const totalPermissionAssignments = roles.reduce((sum, r) => sum + r.permissions.length, 0);
    const avgPermissions = totalRoles > 0 ? (totalPermissionAssignments / totalRoles).toFixed(1) : '0';
    const rolesWithoutPermissions = roles.filter(r => r.permissions.length === 0).length;

    console.log('\n📈 OVERALL STATISTICS');
    console.log('='.repeat(40));
    console.log(`Total Roles: ${totalRoles}`);
    console.log(`System Roles: ${systemRoles}`);
    console.log(`Custom Roles: ${customRoles}`);
    console.log(`Roles without permissions: ${rolesWithoutPermissions}`);
    console.log(`Total Permission Assignments: ${totalPermissionAssignments}`);
    console.log(`Average Permissions per Role: ${avgPermissions}`);

  } catch (error) {
    console.error('❌ Error getting detailed role permissions:', error);
  } finally {
    await dataSource.destroy();
  }
}

// Run the script
if (require.main === module) {
  getDetailedRolePermissions();
}

export { getDetailedRolePermissions };