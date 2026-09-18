import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { AddCustomersComprasFrecuentesPermission1789700000000 } from '../migrations/1789700000000-add-customers-compras-frecuentes-permission';

async function seedCustomersComprasFrecuentesPermission() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const migration = new AddCustomersComprasFrecuentesPermission1789700000000();
    await migration.up(queryRunner);

    const migrationsTable = await queryRunner.getTable('migrations');
    if (migrationsTable) {
      await queryRunner.query(
        `
        INSERT INTO migrations (timestamp, name)
        SELECT 1789700000000, 'AddCustomersComprasFrecuentesPermission1789700000000'
        FROM DUAL
        WHERE NOT EXISTS (
          SELECT 1 FROM migrations
          WHERE name = 'AddCustomersComprasFrecuentesPermission1789700000000'
        )
        `,
      );
    }

    await queryRunner.commitTransaction();
    console.log('customers:ComprasFrecuentes listo y asignado a Admin.');
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
  seedCustomersComprasFrecuentesPermission()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedCustomersComprasFrecuentesPermission };
