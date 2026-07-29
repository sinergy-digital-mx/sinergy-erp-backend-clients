// src/database/seeds/seed-logistics-permissions.ts
// Crea módulos Camiones + Envíos y permisos por organización

import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { seedModulePermissions } from './seed-module-permissions';

async function seedLogisticsPermissions(tenantId?: string) {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    await seedModulePermissions(AppDataSource, {
      moduleName: 'Camiones',
      moduleCode: 'trucks',
      entityCode: 'Truck',
      description: 'Catálogo de camiones / flota de entrega',
      actions: ['ViewMenu', 'Create', 'Read', 'Update', 'Delete'],
      tenantId,
    });

    await seedModulePermissions(AppDataSource, {
      moduleName: 'Envíos',
      moduleCode: 'shippings',
      entityCode: 'Shipping',
      description: 'Envíos y rutas de entrega',
      actions: ['ViewMenu', 'Create', 'Read', 'Update', 'Delete'],
      tenantId,
    });
  } catch (error) {
    console.error('❌ Failed to seed logistics permissions:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  const tenantId = process.argv[2];

  if (tenantId) {
    console.log(`Creating Logistics permissions for organization: ${tenantId}`);
  } else {
    console.log('Creating Logistics permissions for all active organizations');
  }

  seedLogisticsPermissions(tenantId)
    .then(() => {
      console.log('✅ Logistics permissions seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Logistics permissions seeding failed:', error);
      process.exit(1);
    });
}

export { seedLogisticsPermissions };
