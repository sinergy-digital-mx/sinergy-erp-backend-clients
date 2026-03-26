import { AppDataSource } from '../data-source';

async function verify() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('✅ Verifying entity_registry migration...\n');

    // Check permissions with entity_registry mapping
    const result = await AppDataSource.query(`
      SELECT p.id, p.entity_type, p.action, p.entity_registry_id, er.code, er.name
      FROM rbac_permissions p
      LEFT JOIN entity_registry er ON p.entity_registry_id = er.id
      ORDER BY p.entity_type, p.action
      LIMIT 15
    `);

    console.log('📋 Sample permissions with entity_registry mapping:');
    console.log('─'.repeat(100));
    result.forEach((row: any) => {
      console.log(`  ${row.entity_type.padEnd(15)} | ${row.action.padEnd(15)} | Registry ID: ${row.entity_registry_id} | Code: ${row.code}`);
    });

    // Check for any unmapped permissions
    const unmapped = await AppDataSource.query(`
      SELECT COUNT(*) as count FROM rbac_permissions WHERE entity_registry_id IS NULL
    `);

    console.log('\n─'.repeat(100));
    console.log(`\n✅ Total permissions: ${result.length}`);
    console.log(`⚠️  Unmapped permissions: ${unmapped[0].count}`);

    if (unmapped[0].count === 0) {
      console.log('\n✅ All permissions are properly mapped to entity_registry!');
    } else {
      console.log('\n⚠️  Some permissions are not mapped. This might be expected for custom permissions.');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

verify()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
