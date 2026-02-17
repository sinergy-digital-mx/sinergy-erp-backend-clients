import { AppDataSource } from '../data-source';

async function runMigration() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔄 Running is_admin migration...\n');

    // Check if column already exists
    const queryRunner = AppDataSource.createQueryRunner();
    const table = await queryRunner.getTable('rbac_roles');
    const hasColumn = table?.columns.some(col => col.name === 'is_admin');

    if (hasColumn) {
      console.log('⏭️  Column is_admin already exists');
    } else {
      // Add the column
      await queryRunner.query(
        `ALTER TABLE rbac_roles ADD COLUMN is_admin BOOLEAN DEFAULT false NOT NULL`
      );
      console.log('✅ Added is_admin column to rbac_roles');

      // Mark Admin role as admin
      await queryRunner.query(
        `UPDATE rbac_roles SET is_admin = true WHERE name = 'Admin'`
      );
      console.log('✅ Marked Admin role as admin');
    }

    await queryRunner.release();
    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

runMigration()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
