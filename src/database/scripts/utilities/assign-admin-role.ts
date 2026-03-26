import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function assignAdminRole(userId: string) {
  const dataSource = new DataSource(typeOrmOptions);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Verify user exists
    const userQuery = `
      SELECT id, email, first_name, last_name, tenant_id
      FROM users
      WHERE id = ?
    `;
    const users = await dataSource.query(userQuery, [userId]);
    
    if (users.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = users[0];
    console.log(`👤 User: ${user.email} (${user.first_name} ${user.last_name})`);

    // Find Admin role for this tenant
    const adminRoleQuery = `
      SELECT id, name
      FROM rbac_roles
      WHERE name = 'Admin' AND tenant_id = ?
    `;
    const adminRoles = await dataSource.query(adminRoleQuery, [user.tenant_id]);
    
    if (adminRoles.length === 0) {
      console.log('❌ Admin role not found for this tenant');
      return;
    }

    const adminRole = adminRoles[0];
    console.log(`🎭 Admin Role: ${adminRole.name} (${adminRole.id})`);

    // Check if user already has Admin role
    const existingRoleQuery = `
      SELECT id
      FROM rbac_user_roles
      WHERE user_id = ? AND role_id = ?
    `;
    const existingRoles = await dataSource.query(existingRoleQuery, [userId, adminRole.id]);
    
    if (existingRoles.length > 0) {
      console.log('⚠️  User already has Admin role');
      return;
    }

    // Assign Admin role
    const assignRoleQuery = `
      INSERT INTO rbac_user_roles (id, user_id, role_id, tenant_id)
      VALUES (UUID(), ?, ?, ?)
    `;
    
    await dataSource.query(assignRoleQuery, [userId, adminRole.id, user.tenant_id]);
    
    console.log('✅ Admin role assigned successfully!');
    
    // Verify assignment
    const verifyQuery = `
      SELECT 
        r.name as role_name,
        COUNT(rp.permission_id) as permission_count
      FROM rbac_user_roles ur
      JOIN rbac_roles r ON ur.role_id = r.id
      LEFT JOIN rbac_role_permissions rp ON r.id = rp.role_id
      WHERE ur.user_id = ?
      GROUP BY r.id, r.name
      ORDER BY r.name
    `;
    
    const userRoles = await dataSource.query(verifyQuery, [userId]);
    
    console.log(`\n📋 User now has ${userRoles.length} roles:`);
    userRoles.forEach((role: any) => {
      console.log(`   • ${role.role_name}: ${role.permission_count} permissions`);
    });

  } catch (error) {
    console.error('❌ Error assigning admin role:', error);
  } finally {
    await dataSource.destroy();
  }
}

// Get userId from command line argument
const userId = process.argv[2];

if (!userId) {
  console.log('❌ Please provide a user ID');
  console.log('💡 Usage: npx ts-node assign-admin-role.ts USER_ID');
  console.log('💡 Christopher ID: 763b6926-fb57-11f0-a52e-06e7ea787385');
} else {
  assignAdminRole(userId);
}