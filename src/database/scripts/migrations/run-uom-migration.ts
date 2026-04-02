import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../../data-source';
import { AddTenantToUomCatalog1735000000001 } from '../../migrations/1735000000001-add-tenant-to-uom-catalog';

async function runMigration() {
  await AppDataSource.initialize();

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    console.log('🚀 Ejecutando migración: Agregar tenant_id a uom_catalog...\n');

    const migration = new AddTenantToUomCatalog1735000000001();
    await migration.up(queryRunner);

    console.log('\n✅ Migración completada exitosamente!\n');
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

runMigration()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falló:', error);
    process.exit(1);
  });
