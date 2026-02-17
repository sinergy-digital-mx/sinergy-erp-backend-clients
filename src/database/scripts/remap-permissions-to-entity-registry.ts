import { AppDataSource } from '../data-source';

async function remapPermissions() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔄 Remapping permissions to entity_registry...\n');

    // Update permissions with entity_registry_id
    const result = await AppDataSource.query(`
      UPDATE rbac_permissions p
      SET entity_registry_id = (
        SELECT id FROM entity_registry er
        WHERE LOWER(er.code) = LOWER(p.entity_type)
        LIMIT 1
      )
      WHERE entity_registry_id IS NULL
    `);

    console.log(`✅ Updated ${result.affectedRows || 0} permissions\n`);

    // Verify the mapping
    console.log('📋 Verification - Permissions with entity_registry mapping:\n');
    const verified = await AppDataSource.query(`
      SELECT p.entity_type, p.action, p.entity_registry_id, er.code, er.name
      FROM rbac_permissions p
      LEFT JOIN entity_registry er ON p.entity_registry_id = er.id
      ORDER BY p.entity_type, p.action
      LIMIT 10
    `);

    verified.forEach((row: any) => {
      const status = row.entity_registry_id ? '✅' : '❌';
      console.log(`  ${status} ${row.entity_type.padEnd(15)} | ${row.action.padEnd(15)} | Registry: ${row.code || 'NULL'}`);
    });

    // Check for unmapped
    const unmapped = await AppDataSource.query(`
      SELECT COUNT(*) as count FROM rbac_permissions WHERE entity_registry_id IS NULL
    `);

    console.log(`\n✅ Unmapped permissions: ${unmapped[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

remapPermissions()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
