import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { AddListViewStatsPermissions1794900000000 } from '../migrations/1794900000000-add-list-view-stats-permissions';

async function seedListViewStatsPermissions() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const migration = new AddListViewStatsPermissions1794900000000();
    await migration.up(queryRunner);

    const migrationsTable = await queryRunner.getTable('migrations');
    if (migrationsTable) {
      await queryRunner.query(
        `
        INSERT INTO migrations (timestamp, name)
        SELECT 1794900000000, 'AddListViewStatsPermissions1794900000000'
        FROM DUAL
        WHERE NOT EXISTS (
          SELECT 1 FROM migrations
          WHERE name = 'AddListViewStatsPermissions1794900000000'
        )
        `,
      );
    }

    await queryRunner.commitTransaction();
    console.log('ViewStats de inventario, compras y ventas listo y asignado a Admin.');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Failed:', error);
    throw error;
  } finally {
    await queryRunner.release();
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  seedListViewStatsPermissions()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedListViewStatsPermissions };
