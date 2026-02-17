import { AppDataSource } from '../data-source';

async function check() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('📋 Entity Registry Contents:\n');
    const entities = await AppDataSource.query(`SELECT * FROM entity_registry`);
    console.table(entities);

    console.log('\n📋 Permissions entity_type values:\n');
    const permissions = await AppDataSource.query(`
      SELECT DISTINCT entity_type FROM rbac_permissions ORDER BY entity_type
    `);
    console.table(permissions);

    console.log('\n🔍 Checking case-insensitive matches:\n');
    for (const perm of permissions) {
      const match = await AppDataSource.query(`
        SELECT id, code FROM entity_registry 
        WHERE LOWER(code) = LOWER(?)
      `, [perm.entity_type]);
      
      console.log(`  "${perm.entity_type}" -> ${match.length > 0 ? `✅ Found: ${match[0].code} (ID: ${match[0].id})` : '❌ No match'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

check()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
