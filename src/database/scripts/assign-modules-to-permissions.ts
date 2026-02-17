import { AppDataSource } from '../data-source';

async function assignModulesToPermissions() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔄 Assigning modules to existing permissions...\n');

    // Mapping of entity_type to module code
    const mappings = [
      { entity_type: 'Lead', module_code: 'leads' },
      { entity_type: 'Customer', module_code: 'customers' },
      { entity_type: 'Activity', module_code: 'activities' },
      { entity_type: 'Report', module_code: 'reports' },
    ];

    for (const mapping of mappings) {
      console.log(`📦 Processing ${mapping.entity_type} → ${mapping.module_code}`);

      // Get module ID
      const module = await AppDataSource.query(`
        SELECT id FROM modules WHERE code = ?
      `, [mapping.module_code]);

      if (module.length === 0) {
        console.log(`  ⚠️  Module ${mapping.module_code} not found, skipping`);
        continue;
      }

      const moduleId = module[0].id;

      // Update permissions
      const result = await AppDataSource.query(`
        UPDATE rbac_permissions 
        SET module_id = ?
        WHERE entity_type = ? AND module_id IS NULL
      `, [moduleId, mapping.entity_type]);

      console.log(`  ✅ Updated ${result.affectedRows} permissions\n`);
    }

    // Verify results
    console.log('📊 Final permission structure:\n');
    const final = await AppDataSource.query(`
      SELECT 
        m.name as module,
        COUNT(*) as count,
        GROUP_CONCAT(DISTINCT p.action) as actions
      FROM rbac_permissions p
      LEFT JOIN modules m ON p.module_id = m.id
      GROUP BY m.id, m.name
      ORDER BY m.name
    `);

    final.forEach((row: any) => {
      console.log(`📦 ${row.module || 'System'}: ${row.count} permissions`);
      console.log(`   Actions: ${row.actions}\n`);
    });

    console.log('✨ Assignment complete!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

assignModulesToPermissions().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
