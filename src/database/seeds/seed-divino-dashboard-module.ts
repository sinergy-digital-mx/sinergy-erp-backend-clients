import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { seedModulePermissions } from './seed-module-permissions';

const TENANT_ID = '54481b63-5516-458d-9bb3-d4e5cb028864';

async function seedDivinoDashboardModule() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    await seedModulePermissions(AppDataSource, {
      moduleName: 'Divino Dashboard',
      moduleCode: 'divino_dashboard',
      entityCode: 'DivinoDashboard',
      description: 'Dashboard analítico de ventas Divino',
      actions: ['ViewMenu', 'Read'],
      tenantId: TENANT_ID,
    });
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  seedDivinoDashboardModule()
    .then(() => {
      console.log('✅ Divino Dashboard module seeded');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { seedDivinoDashboardModule };
