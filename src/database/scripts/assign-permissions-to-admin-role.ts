import { AppDataSource } from '../data-source';

async function assignPermissionsToAdminRole() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔄 Assigning all module permissions to Admin role...\n');

    // Get Admin role
    const adminRole = await AppDataSource.query(`
      SELECT id FROM rbac_roles WHERE name = 'Admin' LIMIT 1
    `);

    if (adminRole.length === 0) {
      console.log('❌ Admin role not found');
      return;
    }

    const adminRoleId = adminRole[0].id;
    console.log(`📦 Admin Role ID: ${adminRoleId}\n`);

    // Get all permissions with modules
    const permissions = await AppDataSource.query(`
      SELECT p.id, m.name as module, p.action
      FROM rbac_permissions p
      LEFT JOIN modules m ON p.module_id = m.id
      ORDER BY m.name, p.action
    `);

    console.log(`📋 Found ${permissions.length} permissions to assign\n`);

    // Assign each permission to Admin role
    let assigned = 0;
    for (const perm of permissions) {
      // Check if already assigned
      const exists = await AppDataSource.query(`
        SELECT id FROM rbac_role_permissions 
        WHERE role_id = ? AND permission_id = ?
      `, [adminRoleId, perm.id]);

      if (exists.length === 0) {
        await AppDataSource.query(`
          INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
          VALUES (UUID(), ?, ?, NOW())
        `, [adminRoleId, perm.id]);
        assigned++;
      }
    }

    console.log(`✅ Assigned ${assigned} permissions to Admin role\n`);

    // Show final structure
    console.log('📊 Admin role permissions by module:\n');
    const grouped = await AppDataSource.query(`
      SELECT 
        m.name as module,
        p.action,
        p.description
      FROM rbac_role_permissions rp
      JOIN rbac_permissions p ON rp.permission_id = p.id
      LEFT JOIN modules m ON p.module_id = m.id
      WHERE rp.role_id = ?
      ORDER BY m.name, p.action
    `, [adminRoleId]);

    let currentModule = '';
    grouped.forEach((row: any) => {
      if (row.module !== currentModule) {
        if (currentModule !== '') console.log('');
        console.log(`📦 ${row.module}`);
        currentModule = row.module;
      }
      console.log(`  ✅ ${row.action.padEnd(10)} - ${row.description}`);
    });

    console.log('\n✨ Assignment complete!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

assignPermissionsToAdminRole().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
