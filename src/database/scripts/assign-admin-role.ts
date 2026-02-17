import { AppDataSource } from '../data-source';

async function assignAdminRole() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userId = '763b6ebe-fb57-11f0-a52e-06e7ea787385';

    console.log('🔍 Finding Admin role...');
    const adminRole = await AppDataSource.query(`
      SELECT id, name FROM rbac_roles WHERE name = 'Admin' LIMIT 1
    `);

    if (adminRole.length === 0) {
      console.log('❌ Admin role not found. Creating it...');
      const roleId = await AppDataSource.query(`
        INSERT INTO rbac_roles (id, name, description, is_system_role, created_at, updated_at)
        VALUES (UUID(), 'Admin', 'System Administrator', true, NOW(), NOW())
      `);
      console.log('✅ Admin role created');
    }

    const role = adminRole.length > 0 ? adminRole[0] : await AppDataSource.query(`
      SELECT id FROM rbac_roles WHERE name = 'Admin' LIMIT 1
    `)[0];

    console.log(`\n📋 Admin Role ID: ${role.id}`);
    console.log(`👤 User ID: ${userId}`);

    // Check if user already has this role
    const existingRole = await AppDataSource.query(`
      SELECT id FROM rbac_user_roles 
      WHERE user_id = ? AND role_id = ?
    `, [userId, role.id]);

    if (existingRole.length > 0) {
      console.log('⏭️  User already has Admin role');
      return;
    }

    // Assign role to user
    console.log('\n🔗 Assigning Admin role to user...');
    await AppDataSource.query(`
      INSERT INTO rbac_user_roles (id, user_id, role_id, tenant_id, created_at)
      VALUES (UUID(), ?, ?, ?, NOW())
    `, [userId, role.id, '54481b63-5516-458d-9bb3-d4e5cb028864']);

    console.log('✅ Admin role assigned successfully!\n');

    // Verify
    const userRoles = await AppDataSource.query(`
      SELECT r.id, r.name, r.description
      FROM rbac_user_roles ur
      JOIN rbac_roles r ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `, [userId]);

    console.log('📊 User roles after assignment:');
    userRoles.forEach((r: any) => {
      console.log(`  ✅ ${r.name} - ${r.description}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

assignAdminRole().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
