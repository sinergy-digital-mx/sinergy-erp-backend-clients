// src/database/seeds/seed-sales-orders-permissions.ts
// Creates Sales Orders module permissions

import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { seedModulePermissions } from './seed-module-permissions';

async function seedSalesOrdersPermissions(tenantId?: string) {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    await seedModulePermissions(AppDataSource, {
      moduleName: 'Sales Orders Management',
      moduleCode: 'sales-orders',
      entityCode: 'sales_orders',
      description: 'Module for managing sales orders and order processing',
      actions: ['ViewMenu', 'read', 'write', 'delete', 'approve', 'reject'],
      tenantId: tenantId,
    });
  } catch (error) {
    console.error('❌ Failed to seed sales orders permissions:', error);
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
    console.log(`Creating Sales Orders permissions for tenant: ${tenantId}`);
  } else {
    console.log('Creating Sales Orders permissions for all active tenants');
  }

  seedSalesOrdersPermissions(tenantId)
    .then(() => {
      console.log('✅ Sales Orders permissions seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Sales Orders permissions seeding failed:', error);
      process.exit(1);
    });
}

export { seedSalesOrdersPermissions };
