import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

interface RoleSummary {
  roleName: string;
  permissionCount: number;
  isSystemRole: boolean;
  tenantId: string;
  roleId: string;
}

async function getRolePermissionsSummary() {
  const dataSource = new DataSource(typeOrmOptions);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Simple query to get role permission counts
    const query = `
      SELECT 
        r.name as "roleName",
        r.id as "roleId",
        r.is_system_role as "isSystemRole",
        r.tenant_id as "tenantId",
        COUNT(rp.permission_id) as "permissionCount"
      FROM rbac_roles r
      LEFT JOIN rbac_role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id, r.name, r.is_system_role, r.tenant_id
      ORDER BY COUNT(rp.permission_id) DESC, r.name
    `;

    const results: RoleSummary[] = await dataSource.query(query);

    console.log('\n📊 ROLE PERMISSIONS SUMMARY');
    console.log('='.repeat(80));

    if (results.length === 0) {
      console.log('❌ No roles found in the database');
      return;
    }

    // Table header
    console.log('');
    console.log('┌─────────────────────────────────┬─────────────┬──────────┬─────────────────────────────────────┐');
    console.log('│ Role Name                       │ Permissions │ Type     │ Tenant ID                           │');
    console.log('├─────────────────────────────────┼─────────────┼──────────┼─────────────────────────────────────┤');

    results.forEach(role => {
      const roleName = role.roleName.padEnd(31).substring(0, 31);
      const permCount = role.permissionCount.toString().padStart(11);
      const roleType = (role.isSystemRole ? 'System' : 'Custom').padEnd(8);
      const tenantId = (role.tenantId || 'N/A').padEnd(35).substring(0, 35);
      
      console.log(`│ ${roleName} │ ${permCount} │ ${roleType} │ ${tenantId} │`);
    });

    console.log('└─────────────────────────────────┴─────────────┴──────────┴─────────────────────────────────────┘');

    // Quick stats
    const totalRoles = results.length;
    const systemRoles = results.filter(r => r.isSystemRole).length;
    const customRoles = results.filter(r => !r.isSystemRole).length;
    const totalPermissions = results.reduce((sum, r) => sum + Number(r.permissionCount), 0);
    const rolesWithoutPermissions = results.filter(r => Number(r.permissionCount) === 0);

    console.log('\n📈 QUICK STATS:');
    console.log(`   • Total Roles: ${totalRoles}`);
    console.log(`   • System Roles: ${systemRoles}`);
    console.log(`   • Custom Roles: ${customRoles}`);
    console.log(`   • Total Permission Assignments: ${totalPermissions}`);
    console.log(`   • Roles without permissions: ${rolesWithoutPermissions.length}`);

    if (rolesWithoutPermissions.length > 0) {
      console.log('\n⚠️  ROLES WITHOUT PERMISSIONS:');
      rolesWithoutPermissions.forEach(role => {
        console.log(`   • ${role.roleName}`);
      });
    }

    // Top roles
    const topRoles = results.slice(0, 3);
    console.log('\n🏆 TOP ROLES BY PERMISSION COUNT:');
    topRoles.forEach((role, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
      console.log(`   ${medal} ${role.roleName}: ${role.permissionCount} permissions`);
    });

  } catch (error) {
    console.error('❌ Error getting role permissions summary:', error);
  } finally {
    await dataSource.destroy();
  }
}

// Run the script
if (require.main === module) {
  getRolePermissionsSummary();
}

export { getRolePermissionsSummary };