// src/database/seeds/seed-inventory-permissions.ts
// Creates Inventory module permissions

import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { seedModulePermissions } from './seed-module-permissions';

async function seedInventoryPermissions(tenantId?: string) {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    await seedModulePermissions(AppDataSource, {
      moduleName: 'Inventory Management',
      moduleCode: 'inventory',
      entityCode: 'inventory',
      description: 'Module for managing inventory batches and stock tracking',
      actions: ['ViewMenu', 'read', 'write', 'delete'],
      tenantId: tenantId,
    });
  } catch (error) {
    console.error('❌ Failed to seed inventory permissions:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Allow running this script directly
if (require.main === module) {
  // Get tenant ID from command line argument if provided
  const tenantId = process.argv[2];

  if (tenantId) {
    console.log(`Creating Inventory permissions for tenant: ${tenantId}`);
  } else {
    console.log('Creating Inventory permissions for all active tenants');
  }

  seedInventoryPermissions(tenantId)
    .then(() => {
      console.log('✅ Inventory permissions seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Inventory permissions seeding failed:', error);
      process.exit(1);
    });
}

export { seedInventoryPermissions };
