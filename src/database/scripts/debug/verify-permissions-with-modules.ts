import { AppDataSource } from '../data-source';

async function verifyPermissionsWithModules() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userId = '763b6ebe-fb57-11f0-a52e-06e7ea787385';
    const tenantId = '54481b63-5516-458d-9bb3-d4e5cb028864';

    console.log('🔍 Verifying permissions with module info...\n');

    const query = `
      SELECT DISTINCT p.id, p.entity_type, p.action, p.description, p.is_system_permission, 
             m.id as module_id, m.name as module_name, m.code as module_code
      FROM rbac_permissions p
      LEFT JOIN modules m ON p.module_id = m.id
      INNER JOIN rbac_role_permissions rp ON p.id = rp.permission_id
      INNER JOIN rbac_roles r ON rp.role_id = r.id
      INNER JOIN rbac_user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ? AND ur.tenant_id = ?
      ORDER BY m.name, p.action
    `;

    const results = await AppDataSource.query(query, [userId, tenantId]);

    console.log(`📊 Found ${results.length} permissions\n`);

    // Group by module
    const grouped: any = {};
    results.forEach((row: any) => {
      const moduleName = row.module_name || 'System';
      if (!grouped[moduleName]) {
        grouped[moduleName] = [];
      }
      grouped[moduleName].push({
        id: row.id,
        action: row.action,
        description: row.description,
        module_id: row.module_id,
      });
    });

    // Display grouped
    Object.entries(grouped).forEach(([module, perms]: any) => {
      console.log(`📦 ${module}`);
      perms.forEach((p: any) => {
        console.log(`  ✅ ${p.action.padEnd(10)} - ${p.description}`);
      });
      console.log('');
    });

    console.log('✨ Verification complete!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

verifyPermissionsWithModules().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
