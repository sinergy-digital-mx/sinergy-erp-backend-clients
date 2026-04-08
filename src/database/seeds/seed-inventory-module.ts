// src/database/seeds/seed-inventory-module.ts

import { DataSource } from 'typeorm';
import { Module as ModuleEntity } from '../../entities/rbac/module.entity';
import { Permission } from '../../entities/rbac/permission.entity';
import { TenantModule } from '../../entities/rbac/tenant-module.entity';
import { EntityRegistry } from '../../entities/entity-registry/entity-registry.entity';
import { RBACTenant } from '../../entities/rbac/tenant.entity';

/**
 * Seed script to create inventory module and permissions
 * This creates the inventory module, its permissions, and enables it for all tenants
 */
export async function seedInventoryModule(dataSource: DataSource): Promise<void> {
  const moduleRepository = dataSource.getRepository(ModuleEntity);
  const permissionRepository = dataSource.getRepository(Permission);
  const tenantModuleRepository = dataSource.getRepository(TenantModule);
  const entityRegistryRepository = dataSource.getRepository(EntityRegistry);
  const tenantRepository = dataSource.getRepository(RBACTenant);

  try {
    // Step 1: Create or get the Inventory entity registry
    let inventoryEntity = await entityRegistryRepository.findOne({
      where: { code: 'inventory' }
    });

    if (!inventoryEntity) {
      inventoryEntity = entityRegistryRepository.create({
        code: 'inventory',
        name: 'Inventory Management'
      });
      await entityRegistryRepository.save(inventoryEntity);
      console.log('✅ Created inventory entity registry');
    } else {
      console.log('⏭️  Inventory entity registry already exists');
    }

    // Step 2: Create or get the inventory module
    let inventoryModule = await moduleRepository.findOne({
      where: { code: 'inventory' }
    });

    if (!inventoryModule) {
      inventoryModule = moduleRepository.create({
        name: 'Inventory Management',
        code: 'inventory',
        description: 'Module for managing inventory batches and stock tracking'
      });
      await moduleRepository.save(inventoryModule);
      console.log('✅ Created inventory module');
    } else {
      console.log('⏭️  Inventory module already exists');
    }

    // Step 3: Create inventory permissions
    const inventoryActions = ['read', 'write', 'delete'];
    const permissionDescriptions = {
      read: 'View inventory batches and stock information',
      write: 'Create and update inventory batches',
      delete: 'Delete inventory batches'
    };

    let createdPermissions = 0;
    for (const action of inventoryActions) {
      const existing = await permissionRepository.findOne({
        where: {
          entity_registry_id: inventoryEntity.id,
          action: action
        }
      });

      if (!existing) {
        const permission = permissionRepository.create({
          entity_registry_id: inventoryEntity.id,
          module_id: inventoryModule.id,
          action: action,
          description: permissionDescriptions[action],
        });
        await permissionRepository.save(permission);
        createdPermissions++;
        console.log(`✅ Created permission: inventory:${action}`);
      } else {
        console.log(`⏭️  Permission inventory:${action} already exists`);
      }
    }

    // Step 4: Enable inventory module for all tenants
    const allTenants = await tenantRepository.find();
    let enabledForTenants = 0;
    for (const tenant of allTenants) {
      const existing = await tenantModuleRepository.findOne({
        where: {
          tenant_id: tenant.id,
          module_id: inventoryModule.id
        }
      });

      if (!existing) {
        const tenantModule = tenantModuleRepository.create({
          tenant_id: tenant.id,
          module_id: inventoryModule.id,
          is_enabled: true
        });
        await tenantModuleRepository.save(tenantModule);
        enabledForTenants++;
        console.log(`✅ Enabled inventory module for tenant: ${tenant.name}`);
      } else {
        console.log(`⏭️  Inventory module already enabled for tenant: ${tenant.name}`);
      }
    }

    console.log(`\n🎉 Inventory module seeding completed!`);
    console.log(`✅ Created: ${createdPermissions} permissions`);
    console.log(`✅ Enabled for: ${enabledForTenants} tenants`);
  } catch (error) {
    console.error('❌ Error seeding inventory module:', error);
    throw error;
  }
}

/**
 * Run the seed script
 */
export async function runInventoryModuleSeed(): Promise<void> {
  const { AppDataSource } = await import('../data-source.js');
  
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    await seedInventoryModule(AppDataSource);
  } catch (error) {
    console.error('❌ Error seeding inventory module:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Allow running this script directly
if (require.main === module) {
  runInventoryModuleSeed()
    .then(() => {
      console.log('✅ Inventory module seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Inventory module seeding failed:', error);
      process.exit(1);
    });
}
