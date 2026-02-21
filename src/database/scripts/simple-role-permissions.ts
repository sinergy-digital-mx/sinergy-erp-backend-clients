import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

interface RolePermissionDetail {
  roleId: string;
  roleName: string;
  isSystemRole: boolean;
  tenantId: string;
  permissionId: string;
  action: string;
  description: string;
}

async function getSimpleRolePermissions() {
  const dataSource = new DataSource(typeOrmOptions);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Simple query without entity registry
    const query = `
      SELECT 
        r.id as "roleId",
        r.name as "roleName",
        r.is_system_role as "isSystemRole",
        r.tenant_id as "tenantId",
        p.id as "permissionId",
        p.action as "action",
        p.description as "description"
      FROM rbac_roles r
      LEFT JOIN rbac_role_permissions rp ON r.id = rp.role_id
      LEFT JOIN rbac_permissions p ON rp.permission_id = p.id
      ORDER BY r.name, p.action
    `;

    const results: RolePermissionDetail[] = await dataSource.query(query);

    console.log('\n📋 ROLE PERMISSIONS DETAILED REPORT');
    console.log('='.repeat(80));

    if (results.length === 0) {
      console.log('❌ No roles found in the database');
      return;
    }

    // Group by role
    const roleMap = new Map<string, {
      roleInfo: { roleId: string; roleName: string; isSystemRole: boolean; tenantId: string };
      permissions: { permissionId: string; action: string; description: string }[];
    }>();

    results.forEach(row => {
      if (!roleMap.has(row.roleId)) {
        roleMap.set(row.roleId, {
          roleInfo: {
            roleId: row.roleId,
            roleName: row.roleName,
            isSystemRole: row.isSystemRole,
            tenantId: row.tenantId
          },
          permissions: []
        });
      }

      const role = roleMap.get(row.roleId)!;
      
      // Only add permission if it exists
      if (row.permissionId) {
        role.permissions.push({
          permissionId: row.permissionId,
          action: row.action,
          description: row.description || ''
        });
      }
    });

    const roles = Array.from(roleMap.values());

    // Display results
    roles.forEach(role => {
      const { roleInfo, permissions } = role;
      const systemBadge = roleInfo.isSystemRole ? '🔧 [SYSTEM]' : '👤 [CUSTOM]';
      const permissionCount = permissions.length;
      const permissionText = permissionCount === 1 ? 'permission' : 'permissions';
      
      console.log(`\n${systemBadge} ${roleInfo.roleName}`);
      console.log(`📊 Total: ${permissionCount} ${permissionText}`);
      console.log(`🆔 ID: ${roleInfo.roleId}`);
      console.log(`🏢 Tenant: ${roleInfo.tenantId}`);
      
      if (permissionCount === 0) {
        console.log('   ❌ No permissions assigned');
      } else {
        console.log('\n   📋 Permissions:');
        permissions.forEach((perm, index) => {
          const description = perm.description ? ` - ${perm.description}` : '';
          console.log(`      ${index + 1}. ${perm.action}${description}`);
        });
      }
      
      console.log('-'.repeat(60));
    });

    // Summary
    const totalRoles = roles.length;
    const rolesWithPermissions = roles.filter(r => r.permissions.length > 0).length;
    const rolesWithoutPermissions = roles.filter(r => r.permissions.length === 0).length;
    const totalPermissionAssignments = roles.reduce((sum, r) => sum + r.permissions.length, 0);

    console.log('\n📈 SUMMARY');
    console.log('='.repeat(40));
    console.log(`Total Roles: ${totalRoles}`);
    console.log(`Roles with permissions: ${rolesWithPermissions}`);
    console.log(`Roles without permissions: ${rolesWithoutPermissions}`);
    console.log(`Total permission assignments: ${totalPermissionAssignments}`);

    // Show roles without permissions
    const emptyRoles = roles.filter(r => r.permissions.length === 0);
    if (emptyRoles.length > 0) {
      console.log('\n⚠️  ROLES WITHOUT PERMISSIONS:');
      emptyRoles.forEach(role => {
        console.log(`   • ${role.roleInfo.roleName}`);
      });
    }

    // Show top roles
    const topRoles = roles
      .sort((a, b) => b.permissions.length - a.permissions.length)
      .slice(0, 3);

    console.log('\n🏆 TOP ROLES BY PERMISSION COUNT:');
    topRoles.forEach((role, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
      console.log(`   ${medal} ${role.roleInfo.roleName}: ${role.permissions.length} permissions`);
    });

  } catch (error) {
    console.error('❌ Error getting role permissions:', error);
  } finally {
    await dataSource.destroy();
  }
}

// Run the script
if (require.main === module) {
  getSimpleRolePermissions();
}

export { getSimpleRolePermissions };