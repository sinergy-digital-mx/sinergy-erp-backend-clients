import { AppDataSource } from '../data-source';

async function runMigration() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔄 Running migration: Remove entity_type, use entity_registry_id only...\n');

    // First, drop the old foreign key with SET NULL
    console.log('📝 Dropping old foreign key constraint...');
    await AppDataSource.query(`
      ALTER TABLE rbac_permissions 
      DROP FOREIGN KEY FK_rbac_permissions_entity_registry
    `);
    console.log('✅ Old foreign key dropped');

    // Make entity_registry_id NOT NULL
    console.log('📝 Making entity_registry_id NOT NULL...');
    await AppDataSource.query(`
      ALTER TABLE rbac_permissions 
      MODIFY COLUMN entity_registry_id INT NOT NULL
    `);
    console.log('✅ entity_registry_id is now required');

    // Add new foreign key with RESTRICT
    console.log('📝 Adding new foreign key constraint with RESTRICT...');
    await AppDataSource.query(`
      ALTER TABLE rbac_permissions 
      ADD CONSTRAINT FK_rbac_permissions_entity_registry 
      FOREIGN KEY (entity_registry_id) 
      REFERENCES entity_registry(id) 
      ON DELETE RESTRICT
    `);
    console.log('✅ New foreign key added with RESTRICT');

    // Drop entity_type column
    console.log('📝 Dropping entity_type column...');
    await AppDataSource.query(`
      ALTER TABLE rbac_permissions 
      DROP COLUMN entity_type
    `);
    console.log('✅ entity_type column removed');

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  - entity_type column removed from rbac_permissions');
    console.log('  - entity_registry_id is now required (NOT NULL)');
    console.log('  - Foreign key changed to RESTRICT (prevents deletion of referenced entities)');
    console.log('  - entity_type is now computed from entity_registry.code');

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
