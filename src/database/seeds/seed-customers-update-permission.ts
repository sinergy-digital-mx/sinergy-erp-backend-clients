import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { AddCustomersUpdateAndRemoveOldPermissions1789300000000 } from '../migrations/1789300000000-add-customers-update-and-remove-old-permissions';

/**
 * Aplica customers:Update y limpia Customer OLD / leadOLD
 * sin correr el resto de migraciones pendientes.
 */
async function seedCustomersUpdatePermission() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const migration = new AddCustomersUpdateAndRemoveOldPermissions1789300000000();
    await migration.up(queryRunner);
    await queryRunner.commitTransaction();
    console.log('✅ customers:Update listo. Customer OLD / leadOLD eliminados.');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Failed:', error);
    throw error;
  } finally {
    await queryRunner.release();
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  seedCustomersUpdatePermission()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedCustomersUpdatePermission };
