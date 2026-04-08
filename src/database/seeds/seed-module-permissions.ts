// src/database/seeds/seed-module-permissions.ts

import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Module as ModuleEntity } from '../../entities/rbac/module.entity';
import { Permission } from '../../entities/rbac/permission.entity';
import { TenantModule } from '../../entities/rbac/tenant-module.entity';
import { EntityRegistry } from '../../entities/entity-registry/entity-registry.entity';
import { RBACTenant } from '../../entities/rbac/tenant.entity';

interface ModulePermissionConfig {
  moduleName: string;
  moduleCode: string;
  entityCode: string;
  description?: string;
  actions?: string[];
  tenantId?: string; // If provided, only assign to this tenant
}

interface PermissionDescriptions {
  [key: string]: string;
}

/**
 * Generic seed function to create module permissions
 * Can be used for any module by providing the configuration
 */
export async function seedModulePermissions(
  dataSource: DataSource,
  config: ModulePermissionConfig,
): Promise<void> {
  const moduleRepository = dataSource.getRepository(ModuleEntity);
  const permissionRepository = dataSource.getRepository(Permission);
  const tenantModuleRepository = dataSource.getRepository(TenantModule);
  const entityRegistryRepository = dataSource.getRepository(EntityRegistry);
  const tenantRepository = dataSource.getRepository(RBACTenant);

  const {
    moduleName,
    moduleCode,
    entityCode,
    description,
    actions = ['read', 'write', 'delete'],
    tenantId,
  } = config;

  try {
    console.log(`\n📦 Creating permissions for module: ${moduleName}`);
    console.log(`   Code: ${moduleCode}`);
    console.log(`   Entity: ${entityCode}`);
    if (tenantId) {
      console.log(`   Tenant: ${tenantId}`);
    }
    console.log('');

    // Step 1: Create or get the entity registry
    let entity = await entityRegistryRepository.findOne({
      where: { code: entityCode },
    });

    if (!entity) {
      entity = entityRegistryRepository.create({
        code: entityCode,
        name: moduleName,
      });
      await entityRegistryRepository.save(entity);
      console.log(`✅ Created entity registry: ${entityCode}`);
    } else {
      console.log(`⏭️  Entity registry already exists: ${entityCode}`);
    }

    // Step 2: Create or get the module
    let module = await moduleRepository.findOne({
      where: { code: moduleCode },
    });

    if (!module) {
      module = moduleRepository.create({
        name: moduleName,
        code: moduleCode,
        description: description || `${moduleName} module`,
      });
      await moduleRepository.save(module);
      console.log(`✅ Created module: ${moduleName}`);
    } else {
      console.log(`⏭️  Module already exists: ${moduleName}`);
    }

    // Step 3: Create permissions
    const permissionDescriptions: PermissionDescriptions = {
      ViewMenu: `View ${moduleName} in menu`,
      read: `View and read access to ${moduleName}`,
      write: `Create and update access to ${moduleName}`,
      delete: `Delete access to ${moduleName}`,
      create: `Create access to ${moduleName}`,
      update: `Update access to ${moduleName}`,
      export: `Export access to ${moduleName}`,
      import: `Import access to ${moduleName}`,
      approve: `Approve access to ${moduleName}`,
      reject: `Reject access to ${moduleName}`,
    };

    let createdPermissions = 0;
    const createdPermissionsList: string[] = [];

    for (const action of actions) {
      const existing = await permissionRepository.findOne({
        where: {
          entity_registry_id: entity.id,
          action: action,
        },
      });

      if (!existing) {
        const permission = permissionRepository.create({
          entity_registry_id: entity.id,
          module_id: module.id,
          action: action,
          description: permissionDescriptions[action] || `${action} access to ${moduleName}`,
        });
        await permissionRepository.save(permission);
        createdPermissions++;
        createdPermissionsList.push(`${entityCode}:${action}`);
        console.log(`✅ Created permission: ${entityCode}:${action}`);
      } else {
        console.log(`⏭️  Permission already exists: ${entityCode}:${action}`);
      }
    }

    // Step 4: Assign to tenant(s)
    let enabledForTenants = 0;
    const enabledTenantsList: string[] = [];

    if (tenantId) {
      // Assign to specific tenant
      const tenant = await tenantRepository.findOne({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new Error(`Tenant not found: ${tenantId}`);
      }

      const existing = await tenantModuleRepository.findOne({
        where: {
          tenant_id: tenant.id,
          module_id: module.id,
        },
      });

      if (!existing) {
        const tenantModule = tenantModuleRepository.create({
          tenant_id: tenant.id,
          module_id: module.id,
          is_enabled: true,
        });
        await tenantModuleRepository.save(tenantModule);
        enabledForTenants++;
        enabledTenantsList.push(tenant.name);
        console.log(`✅ Enabled module for tenant: ${tenant.name}`);
      } else {
        console.log(`⏭️  Module already enabled for tenant: ${tenant.name}`);
      }
    } else {
      // Assign to all active tenants
      const allTenants = await tenantRepository.find({
        where: { is_active: true },
      });

      for (const tenant of allTenants) {
        const existing = await tenantModuleRepository.findOne({
          where: {
            tenant_id: tenant.id,
            module_id: module.id,
          },
        });

        if (!existing) {
          const tenantModule = tenantModuleRepository.create({
            tenant_id: tenant.id,
            module_id: module.id,
            is_enabled: true,
          });
          await tenantModuleRepository.save(tenantModule);
          enabledForTenants++;
          enabledTenantsList.push(tenant.name);
          console.log(`✅ Enabled module for tenant: ${tenant.name}`);
        } else {
          console.log(`⏭️  Module already enabled for tenant: ${tenant.name}`);
        }
      }
    }

    // Step 5: Summary
    console.log(`\n🎉 Module permissions setup completed!`);
    console.log(`✅ Module: ${moduleName} (${moduleCode})`);
    console.log(`✅ Created permissions: ${createdPermissions}`);
    if (createdPermissionsList.length > 0) {
      console.log(`   ${createdPermissionsList.join(', ')}`);
    }
    console.log(`✅ Enabled for tenants: ${enabledForTenants}`);
    if (enabledTenantsList.length > 0) {
      console.log(`   ${enabledTenantsList.join(', ')}`);
    }
    console.log('');
  } catch (error) {
    console.error(`❌ Error creating module permissions: ${error.message}`);
    throw error;
  }
}

/**
 * Helper function to run the seed with a specific module configuration
 * This is exported for use by specific seed scripts
 */
