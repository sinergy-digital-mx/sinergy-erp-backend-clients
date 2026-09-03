import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { seedModulePermissions } from './seed-module-permissions';

async function seedQuotationsModule(tenantId?: string) {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    await seedModulePermissions(AppDataSource, {
      moduleName: 'Cotizaciones',
      moduleCode: 'quotations',
      entityCode: 'Quotation',
      description:
        'Cotizaciones de venta. Sin facturación ni reserva de inventario hasta convertir a OV.',
      actions: ['ViewMenu', 'Create', 'Read', 'Update', 'Delete', 'Convert', 'Send'],
      tenantId,
    });
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  const tenantId = process.argv[2];
  seedQuotationsModule(tenantId)
    .then(() => {
      console.log('✅ Quotations module seeded');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { seedQuotationsModule };
