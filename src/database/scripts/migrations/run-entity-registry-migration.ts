import { AppDataSource } from '../data-source';

async function runMigration() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔄 Running migration: Add entity_registry_id foreign key to permissions...');

    // Add entity_registry_id column to rbac_permissions
    await AppDataSource.query(`
      ALTER TABLE rbac_permissions 
      ADD COLUMN entity_registry_id INT NULL
    `).catch(err => {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Column entity_registry_id already exists, skipping...');
      } else {
        throw err;
      }
    });

    // Migrate existing data: map entity_type strings to entity_registry ids
    console.log('📝 Migrating existing permission data...');
    const result = await AppDataSource.query(`
      UPDATE rbac_permissions p
      SET entity_registry_id = (
        SELECT id FROM entity_registry er
        WHERE LOWER(er.code) = LOWER(p.entity_type)
        LIMIT 1
      )
      WHERE entity_registry_id IS NULL
    `);

    console.log(`✅ Updated ${result.affectedRows || 0} permissions with entity_registry_id`);

    // Add foreign key constraint
    console.log('🔗 Adding foreign key constraint...');
    await AppDataSource.query(`
      ALTER TABLE rbac_permissions 
      ADD CONSTRAINT FK_rbac_permissions_entity_registry 
      FOREIGN KEY (entity_registry_id) 
      REFERENCES entity_registry(id) 
      ON DELETE SET NULL
    `).catch(err => {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️  Foreign key already exists, skipping...');
      } else {
        throw err;
      }
    });

    // Add index
    console.log('📊 Adding index...');
    await AppDataSource.query(`
      CREATE INDEX IDX_rbac_permissions_entity_registry_id 
      ON rbac_permissions(entity_registry_id)
    `).catch(err => {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️  Index already exists, skipping...');
      } else {
        throw err;
      }
    });

    console.log('✅ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  - Added entity_registry_id column to rbac_permissions');
    console.log('  - Migrated existing permission data');
    console.log('  - Added foreign key constraint');
    console.log('  - Added index for performance');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

runMigration()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
