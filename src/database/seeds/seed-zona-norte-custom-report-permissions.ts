import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { seedModulePermissions } from './seed-module-permissions';

async function seedZonaNorteCustomReportPermissions(tenantId?: string) {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    await seedModulePermissions(AppDataSource, {
      moduleName: 'Reporte de Ventas',
      moduleCode: 'zona_norte_custom_report',
      entityCode: 'zona_norte_custom_report',
      description: 'Módulo personalizado para reportes de ventas de Zona Norte',
      actions: ['ViewMenu', 'read'],
      tenantId: tenantId,
    });
  } catch (error) {
    console.error('❌ Failed:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  const tenantId = process.argv[2];
  seedZonaNorteCustomReportPermissions(tenantId)
    .then(() => {
      console.log('✅ Reporte de Ventas permissions created');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}

export { seedZonaNorteCustomReportPermissions };
