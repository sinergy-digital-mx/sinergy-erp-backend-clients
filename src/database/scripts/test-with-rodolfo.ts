import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function testWithRodolfo() {
  const dataSource = new DataSource(typeOrmOptions);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Find Rodolfo's user info
    console.log('\n🔍 Looking for Rodolfo Rodriguez...');
    const users = await dataSource.query(`
      SELECT u.*, ur.tenant_id, r.name as role_name
      FROM users u
      LEFT JOIN rbac_user_roles ur ON u.id = ur.user_id
      LEFT JOIN rbac_roles r ON ur.role_id = r.id
      WHERE u.username LIKE '%rodolfo%' OR u.email LIKE '%rodolfo%' OR u.first_name LIKE '%rodolfo%'
      ORDER BY u.username
    `);

    console.log(`📊 Found ${users.length} users matching 'rodolfo':`);
    users.forEach((user: any) => {
      console.log(`   • ${user.username} (${user.email}) - Role: ${user.role_name || 'No role'} - Tenant: ${user.tenant_id || 'No tenant'}`);
    });

    if (users.length > 0) {
      const rodolfo = users[0];
      console.log(`\n🎯 Using user: ${rodolfo.username} (ID: ${rodolfo.id})`);
      
      // Check his permissions
      const permissions = await dataSource.query(`
        SELECT COUNT(*) as permission_count
        FROM rbac_user_roles ur
        JOIN rbac_role_permissions rp ON ur.role_id = rp.role_id
        WHERE ur.user_id = ?
      `, [rodolfo.id]);
      
      console.log(`🔑 Rodolfo has ${permissions[0]?.permission_count || 0} permissions`);
      
      // Test if he can access the endpoint (simulate the permission check)
      const userReadPermission = await dataSource.query(`
        SELECT p.*, er.code as entity_code
        FROM rbac_user_roles ur
        JOIN rbac_role_permissions rp ON ur.role_id = rp.role_id
        JOIN rbac_permissions p ON rp.permission_id = p.id
        JOIN entity_registry er ON p.entity_registry_id = er.id
        WHERE ur.user_id = ? AND er.code = 'User' AND p.action = 'Read'
      `, [rodolfo.id]);
      
      if (userReadPermission.length > 0) {
        console.log('✅ Rodolfo has User.Read permission - should be able to access endpoint');
      } else {
        console.log('❌ Rodolfo does NOT have User.Read permission - this could be the issue');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

testWithRodolfo();