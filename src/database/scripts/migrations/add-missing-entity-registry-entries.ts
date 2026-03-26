import { AppDataSource } from '../data-source';

async function addMissingEntries() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔄 Adding missing entity registry entries...\n');

    // Add lowercase plural versions that match the permissions table
    const entriesToAdd = [
      { code: 'activities', name: 'Activities' },
      { code: 'customers', name: 'Customers' },
      { code: 'leads', name: 'Leads' },
    ];

    for (const entry of entriesToAdd) {
      const existing = await AppDataSource.query(`
        SELECT id FROM entity_registry WHERE LOWER(code) = LOWER(?)
      `, [entry.code]);

      if (existing.length === 0) {
        await AppDataSource.query(`
          INSERT INTO entity_registry (code, name) VALUES (?, ?)
        `, [entry.code, entry.name]);
        console.log(`✅ Added: ${entry.code}`);
      } else {
        console.log(`⏭️  Already exists: ${entry.code}`);
      }
    }

    console.log('\n✅ Entity registry entries added successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

addMissingEntries()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
