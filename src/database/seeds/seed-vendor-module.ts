// src/database/seeds/seed-vendor-module.ts
import { DataSource } from 'typeorm';
import { Module as ModuleEntity } from '../../entities/rbac/module.entity';
import { Permission } from '../../entities/rbac/permission.entity';
import { TenantModule } from '../../entities/rbac/tenant-module.entity';
import { EntityRegistry } from '../../entities/entity-registry/entity-registry.entity';
import { RBACTenant } from '../../entities/rbac/tenant.entity';

/**
 * Seed script to create vendor module and permissions
 * This creates the vendor module, its permissions, and enables it for all tenants
 */
export async function seedVendorModule(dataSource: DataSource): Promise<void> {
  const moduleRepository = dataSource.getRepository(ModuleEntity);
  const permissionRepository = dataSource.getRepository(Permission);
  const tenantModuleRepository = dataSource.getRepository(TenantModule);
  const entityRegistryRepository = dataSource.getRepository(EntityRegistry);
  const tenantRepository = dataSource.getRepository(RBACTenant);

  try {
    // Step 1: Create or get the Vendor entity registry
    let vendorEntity = await entityRegistryRepository.findOne({
      where: { code: 'Vendor' }
    });

    if (!vendorEntity) {
      vendorEntity = entityRegistryRepository.create({
        code: 'Vendor',
        name: 'Vendor Management'
      });
      await entityRegistryRepository.save(vendorEntity);
      console.log('✅ Created Vendor entity registry');
    } else {
      console.log('⏭️  Vendor entity registry already exists');
    }

    // Step 2: Create or get the vendors module
    let vendorModule = await moduleRepository.findOne({
      where: { code: 'vendors' }
    });

    if (!vendorModule) {
      vendorModule = moduleRepository.create({
        name: 'Vendor Management',
        code: 'vendors',
        description: 'Module for managing vendors and suppliers'
      });
      await moduleRepository.save(vendorModule);
      console.log('✅ Created vendors module');
    } else {
      console.log('⏭️  Vendors module already exists');
    }

    // Step 3: Create vendor permissions
    const vendorActions = ['Create', 'Read', 'Update', 'Delete'];
    const permissionDescriptions = {
      Create: 'Create new vendors',
      Read: 'View vendor information',
      Update: 'Edit vendor information',
      Delete: 'Delete vendors'
    };

    let createdPermissions = 0;
    for (const action of vendorActions) {
      const existing = await permissionRepository.findOne({
        where: {
          entity_registry_id: vendorEntity.id,
          action: action
        }
      });

      if (!existing) {
        const permission = permissionRepository.create({
          entity_registry_id: vendorEntity.id,
          module_id: vendorModule.id,
          action: action,
          description: permissionDescriptions[action],
          is_system_permission: true
        });
        await permissionRepository.save(permission);
        createdPermissions++;
        console.log(`✅ Created permission: vendors:${action}`);
      } else {
        console.log(`⏭️  Permission vendors:${action} already exists`);
      }
    }

    // Step 4: Enable vendor module for all tenants
    const allTenants = await tenantRepository.find();
    let enabledForTenants = 0;

    for (const tenant of allTenants) {
      const existing = await tenantModuleRepository.findOne({
        where: {
          tenant_id: tenant.id,
          module_id: vendorModule.id
        }
      });

      if (!existing) {
        const tenantModule = tenantModuleRepository.create({
          tenant_id: tenant.id,
          module_id: vendorModule.id,
          is_enabled: true
        });
        await tenantModuleRepository.save(tenantModule);
        enabledForTenants++;
        console.log(`✅ Enabled vendors module for tenant: ${tenant.name}`);
      } else {
        console.log(`⏭️  Vendors module already enabled for tenant: ${tenant.name}`);
      }
    }

    console.log(`\n🎉 Vendor module seeding completed!`);
    console.log(`✅ Created: ${createdPermissions} permissions`);
    console.log(`✅ Enabled for: ${enabledForTenants} tenants`);
  } catch (error) {
    console.error('❌ Error seeding vendor module:', error);
    throw error;
  }
}

/**
 * Run the seed script
 */
export async function runVendorModuleSeed(): Promise<void> {
  const { AppDataSource } = await import('../data-source.js');
  
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    await seedVendorModule(AppDataSource);
  } catch (error) {
    console.error('❌ Error seeding vendor module:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Allow running this script directly
if (require.main === module) {
  runVendorModuleSeed()
    .then(() => {
      console.log('✅ Vendor module seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Vendor module seeding failed:', error);
      process.exit(1);
    });
}
