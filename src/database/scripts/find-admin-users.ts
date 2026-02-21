import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function findAdminUsers() {
  const dataSource = new DataSource(typeOrmOptions);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Find Admin role
    const adminRoleQuery = `
      SELECT id, name, description
      FROM rbac_roles
      WHERE name = 'Admin'
      AND tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
    `;

    const adminRoles = await dataSource.query(adminRoleQuery);
    
    if (adminRoles.length === 0) {
      console.log('❌ No Admin role found');
      return;
    }

    const adminRole = adminRoles[0];
    console.log(`🎭 Admin Role: ${adminRole.name} (${adminRole.id})`);

    // Find users with Admin role
    const adminUsersQuery = `
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name
      FROM rbac_user_roles ur
      JOIN users u ON ur.user_id = u.id
      WHERE ur.role_id = ?
    `;

    const adminUsers = await dataSource.query(adminUsersQuery, [adminRole.id]);

    if (adminUsers.length === 0) {
      console.log('❌ No users have the Admin role assigned');
      
      // Show all users for reference
      console.log('\n📋 Available users in tenant:');
      const allUsers = await dataSource.query(`
        SELECT id, email, first_name, last_name
        FROM users
        WHERE tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
      `);
      
      allUsers.forEach((user: any) => {
        console.log(`   • ${user.email} (${user.first_name} ${user.last_name}) - ID: ${user.id}`);
      });

      console.log('\n💡 You need to assign the Admin role to a user');
      console.log('💡 Run: npx ts-node assign-admin-role.ts USER_ID');
      
    } else {
      console.log(`\n👥 Users with Admin role (${adminUsers.length}):`);
      adminUsers.forEach((user: any) => {
        console.log(`   • ${user.email} (${user.first_name} ${user.last_name}) - ID: ${user.id}`);
      });
    }

  } catch (error) {
    console.error('❌ Error finding admin users:', error);
  } finally {
    await dataSource.destroy();
  }
}

findAdminUsers();