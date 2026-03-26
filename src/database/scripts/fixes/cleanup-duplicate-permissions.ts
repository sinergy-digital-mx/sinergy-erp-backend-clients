import { AppDataSource } from '../data-source';

async function cleanupDuplicatePermissions() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔄 Cleaning up duplicate permissions...\n');

    // Simply delete all permissions without module_id
    const query = `DELETE FROM rbac_permissions WHERE module_id IS NULL`;

    const result = await AppDataSource.query(query);
    console.log(`✅ Deleted ${result.affectedRows} duplicate permissions without module_id\n`);

    // Show remaining permissions
    console.log('📊 Remaining permissions:\n');
    const remaining = await AppDataSource.query(`
      SELECT 
        m.name as module,
        COUNT(*) as count
      FROM rbac_permissions p
      LEFT JOIN modules m ON p.module_id = m.id
      GROUP BY m.id, m.name
      ORDER BY m.name
    `);

    remaining.forEach((row: any) => {
      console.log(`  📦 ${row.module || 'System'}: ${row.count} permissions`);
    });

    console.log('\n✨ Cleanup complete!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

cleanupDuplicatePermissions().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
