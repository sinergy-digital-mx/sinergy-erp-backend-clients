import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';
import { Role } from '../../entities/rbac/role.entity';
import { RolePermission } from '../../entities/rbac/role-permission.entity';
import { Permission } from '../../entities/rbac/permission.entity';

interface RolePermissionCount {
  roleId: string;
  roleName: string;
  permissionCount: number;
  isSystemRole: boolean;
  tenantId: string;
}

async function checkRolePermissionsCount() {
  const dataSource = new DataSource(typeOrmOptions);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Query to get role permission counts
    const query = `
      SELECT 
        r.id as "roleId",
        r.name as "roleName",
        r.is_system_role as "isSystemRole",
        r.tenant_id as "tenantId",
        COUNT(rp.permission_id) as "permissionCount"
      FROM rbac_roles r
      LEFT JOIN rbac_role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id, r.name, r.is_system_role, r.tenant_id
      ORDER BY r.name
    `;

    const results: RolePermissionCount[] = await dataSource.query(query);

    console.log('\n📊 ROLE PERMISSIONS COUNT REPORT');
    console.log('='.repeat(80));

    if (results.length === 0) {
      console.log('❌ No roles found in the database');
      return;
    }

    // Group by tenant
    const rolesByTenant = results.reduce((acc, role) => {
      const tenantId = role.tenantId || 'system';
      if (!acc[tenantId]) {
        acc[tenantId] = [];
      }
      acc[tenantId].push(role);
      return acc;
    }, {} as Record<string, RolePermissionCount[]>);

    // Display results by tenant
    for (const [tenantId, roles] of Object.entries(rolesByTenant)) {
      console.log(`\n🏢 TENANT: ${tenantId === 'system' ? 'System Roles' : tenantId}`);
      console.log('-'.repeat(60));
      
      roles.forEach(role => {
        const systemBadge = role.isSystemRole ? '🔧 [SYSTEM]' : '👤 [CUSTOM]';
        const permissionText = role.permissionCount === 1 ? 'permission' : 'permissions';
        
        console.log(`${systemBadge} ${role.roleName}`);
        console.log(`   📋 ${role.permissionCount} ${permissionText}`);
        console.log(`   🆔 ID: ${role.roleId}`);
        console.log('');
      });
    }

    // Summary statistics
    const totalRoles = results.length;
    const systemRoles = results.filter(r => r.isSystemRole).length;
    const customRoles = results.filter(r => !r.isSystemRole).length;
    const totalPermissions = results.reduce((sum, r) => sum + Number(r.permissionCount), 0);
    const avgPermissions = totalRoles > 0 ? (totalPermissions / totalRoles).toFixed(1) : '0';

    console.log('\n📈 SUMMARY STATISTICS');
    console.log('='.repeat(40));
    console.log(`Total Roles: ${totalRoles}`);
    console.log(`System Roles: ${systemRoles}`);
    console.log(`Custom Roles: ${customRoles}`);
    console.log(`Total Permission Assignments: ${totalPermissions}`);
    console.log(`Average Permissions per Role: ${avgPermissions}`);

    // Roles with most permissions
    const topRoles = results
      .sort((a, b) => Number(b.permissionCount) - Number(a.permissionCount))
      .slice(0, 5);

    console.log('\n🏆 TOP 5 ROLES BY PERMISSION COUNT');
    console.log('-'.repeat(40));
    topRoles.forEach((role, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
      console.log(`${medal} ${role.roleName}: ${role.permissionCount} permissions`);
    });

    // Roles with no permissions
    const rolesWithoutPermissions = results.filter(r => Number(r.permissionCount) === 0);
    if (rolesWithoutPermissions.length > 0) {
      console.log('\n⚠️  ROLES WITHOUT PERMISSIONS');
      console.log('-'.repeat(40));
      rolesWithoutPermissions.forEach(role => {
        console.log(`❌ ${role.roleName} (${role.roleId})`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking role permissions:', error);
  } finally {
    await dataSource.destroy();
  }
}

// Run the script
if (require.main === module) {
  checkRolePermissionsCount();
}

export { checkRolePermissionsCount };