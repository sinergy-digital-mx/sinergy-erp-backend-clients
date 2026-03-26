import { AppDataSource } from '../data-source';
import { Module } from '../../entities/rbac/module.entity';
import { Permission } from '../../entities/rbac/permission.entity';
import { Role } from '../../entities/rbac/role.entity';
import { EntityRegistry } from '../../entities/entity-registry/entity-registry.entity';
import { TenantModule } from '../../entities/rbac/tenant-module.entity';

async function addContractsAndPropertiesPermissions() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    // Tenant ID to ensure modules are assigned to
    const targetTenantId = '54481b63-5516-458d-9bb3-d4e5cb028864';

    // Get or create Contracts module
    let contractsModule = await AppDataSource.manager.findOne(Module, {
      where: { code: 'contracts' },
    });

    if (!contractsModule) {
      contractsModule = AppDataSource.manager.create(Module, {
        name: 'Contracts',
        code: 'contracts',
        description: 'Contract management module',
      });
      await AppDataSource.manager.save(contractsModule);
      console.log('Contracts module created');
    }

    // Get or create Properties module
    let propertiesModule = await AppDataSource.manager.findOne(Module, {
      where: { code: 'properties' },
    });

    if (!propertiesModule) {
      propertiesModule = AppDataSource.manager.create(Module, {
        name: 'Properties',
        code: 'properties',
        description: 'Properties/Lots management module',
      });
      await AppDataSource.manager.save(propertiesModule);
      console.log('Properties module created');
    }

    // Get or create entity registry entries for Contracts and Properties
    let contractsEntity = await AppDataSource.manager.findOne(EntityRegistry, {
      where: { code: 'contracts' },
    });

    if (!contractsEntity) {
      contractsEntity = AppDataSource.manager.create(EntityRegistry, {
        code: 'contracts',
        name: 'Contracts',
      });
      await AppDataSource.manager.save(contractsEntity);
    }

    let propertiesEntity = await AppDataSource.manager.findOne(EntityRegistry, {
      where: { code: 'properties' },
    });

    if (!propertiesEntity) {
      propertiesEntity = AppDataSource.manager.create(EntityRegistry, {
        code: 'properties',
        name: 'Properties',
      });
      await AppDataSource.manager.save(propertiesEntity);
    }

    // Define permissions for Contracts
    const contractsPermissions = [
      { action: 'view', description: 'View contracts' },
      { action: 'create', description: 'Create contracts' },
      { action: 'update', description: 'Update contracts' },
      { action: 'delete', description: 'Delete contracts' },
      { action: 'view_stats', description: 'View contract statistics' },
    ];

    // Define permissions for Properties
    const propertiesPermissions = [
      { action: 'view', description: 'View properties' },
      { action: 'create', description: 'Create properties' },
      { action: 'update', description: 'Update properties' },
      { action: 'delete', description: 'Delete properties' },
    ];

    // Create Contracts permissions
    for (const perm of contractsPermissions) {
      const existing = await AppDataSource.manager.findOne(Permission, {
        where: {
          module_id: contractsModule.id,
          action: perm.action,
        },
      });

      if (!existing) {
        const permission = AppDataSource.manager.create(Permission, {
          module_id: contractsModule.id,
          action: perm.action,
          description: perm.description,
          entity_registry_id: contractsEntity.id,
        });
        await AppDataSource.manager.save(permission);
        console.log(`Created permission: contracts:${perm.action}`);
      }
    }

    // Create Properties permissions
    for (const perm of propertiesPermissions) {
      const existing = await AppDataSource.manager.findOne(Permission, {
        where: {
          module_id: propertiesModule.id,
          action: perm.action,
        },
      });

      if (!existing) {
        const permission = AppDataSource.manager.create(Permission, {
          module_id: propertiesModule.id,
          action: perm.action,
          description: perm.description,
          entity_registry_id: propertiesEntity.id,
        });
        await AppDataSource.manager.save(permission);
        console.log(`Created permission: properties:${perm.action}`);
      }
    }

    // Get all permissions for both modules
    const allContractsPermissions = await AppDataSource.manager.find(Permission, {
      where: { module_id: contractsModule.id },
    });

    const allPropertiesPermissions = await AppDataSource.manager.find(Permission, {
      where: { module_id: propertiesModule.id },
    });

    // Assign modules to the specific tenant
    console.log(`\n🏢 Assigning modules to tenant: ${targetTenantId}`);

    // Check if Contracts module is already assigned to tenant
    let contractsTenantModule = await AppDataSource.manager.findOne(TenantModule, {
      where: {
        tenant_id: targetTenantId,
        module_id: contractsModule.id,
      },
    });

    if (!contractsTenantModule) {
      contractsTenantModule = AppDataSource.manager.create(TenantModule, {
        tenant_id: targetTenantId,
        module_id: contractsModule.id,
        is_enabled: true,
      });
      await AppDataSource.manager.save(contractsTenantModule);
      console.log('✅ Contracts module assigned to tenant');
    } else {
      console.log('ℹ️  Contracts module already assigned to tenant');
    }

    // Check if Properties module is already assigned to tenant
    let propertiesTenantModule = await AppDataSource.manager.findOne(TenantModule, {
      where: {
        tenant_id: targetTenantId,
        module_id: propertiesModule.id,
      },
    });

    if (!propertiesTenantModule) {
      propertiesTenantModule = AppDataSource.manager.create(TenantModule, {
        tenant_id: targetTenantId,
        module_id: propertiesModule.id,
        is_enabled: true,
      });
      await AppDataSource.manager.save(propertiesTenantModule);
      console.log('✅ Properties module assigned to tenant');
    } else {
      console.log('ℹ️  Properties module already assigned to tenant');
    }

    // Get admin roles (is_admin = true) for the specific tenant
    const adminRoles = await AppDataSource.manager.find(Role, {
      where: { is_admin: true, tenant_id: targetTenantId },
      relations: ['role_permissions'],
    });

    const allPermissions = [...allContractsPermissions, ...allPropertiesPermissions];

    for (const adminRole of adminRoles) {
      // Add all permissions to admin role via role_permissions
      for (const permission of allPermissions) {
        const existingRolePermission = await AppDataSource.manager.findOne('RolePermission', {
          where: {
            role_id: adminRole.id,
            permission_id: permission.id,
          },
        });

        if (!existingRolePermission) {
          const rolePermission = AppDataSource.manager.create('RolePermission', {
            role_id: adminRole.id,
            permission_id: permission.id,
          });
          await AppDataSource.manager.save(rolePermission);
        }
      }

      console.log(`Added all contracts and properties permissions to admin role: ${adminRole.name}`);
    }

    console.log(`✅ Contracts and Properties permissions setup completed for tenant: ${targetTenantId}`);
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addContractsAndPropertiesPermissions();
