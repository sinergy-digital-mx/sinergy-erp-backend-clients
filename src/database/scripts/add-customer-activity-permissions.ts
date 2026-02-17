import { AppDataSource } from '../data-source';
import { Role } from '../../entities/rbac/role.entity';
import { Permission } from '../../entities/rbac/permission.entity';
import { Module } from '../../entities/rbac/module.entity';
import { EntityRegistry } from '../../entities/entity-registry/entity-registry.entity';

async function addCustomerActivityPermissions() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    // Get Customer entity registry
    let customerRegistry = await AppDataSource.manager.findOne(EntityRegistry, {
      where: { code: 'customer' },
    });

    if (!customerRegistry) {
      customerRegistry = AppDataSource.manager.create(EntityRegistry, {
        code: 'customer',
        name: 'Customer',
      });
      await AppDataSource.manager.save(customerRegistry);
      console.log('Created Customer entity registry');
    }

    // Get or create Customer Activities module
    let customerActivitiesModule = await AppDataSource.manager.findOne(Module, {
      where: { name: 'Customer Activities' },
    });

    if (!customerActivitiesModule) {
      customerActivitiesModule = AppDataSource.manager.create(Module, {
        name: 'Customer Activities',
        code: 'customer_activities',
        description: 'Customer activity management module',
      });
      await AppDataSource.manager.save(customerActivitiesModule);
      console.log('Created Customer Activities module');
    }

    // Define customer activity permissions
    const activityPermissions = [
      { action: 'Activity:Create', description: 'Create customer activities' },
      { action: 'Activity:Read', description: 'Read customer activities' },
      { action: 'Activity:Update', description: 'Update customer activities' },
      { action: 'Activity:Delete', description: 'Delete customer activities' },
    ];

    // Create or get permissions
    const permissions: Permission[] = [];
    for (const perm of activityPermissions) {
      let permission = await AppDataSource.manager.findOne(Permission, {
        where: {
          entity_registry_id: customerRegistry.id,
          action: perm.action,
        },
      });

      if (!permission) {
        permission = AppDataSource.manager.create(Permission, {
          entity_registry_id: customerRegistry.id,
          action: perm.action,
          description: perm.description,
          module_id: customerActivitiesModule.id,
        });
        await AppDataSource.manager.save(permission);
        console.log(`Created Permission: Customer ${perm.action}`);
      }
      permissions.push(permission);
    }

    // Get Admin role and assign permissions
    const adminRole = await AppDataSource.manager.findOne(Role, {
      where: { name: 'Admin' },
      relations: ['role_permissions'],
    });

    if (adminRole) {
      for (const permission of permissions) {
        // Check if permission already assigned via role_permissions
        const rolePermission = await AppDataSource.manager.findOne('RolePermission', {
          where: { role_id: adminRole.id, permission_id: permission.id },
        });

        if (!rolePermission) {
          await AppDataSource.manager.insert('rbac_role_permissions', {
            role_id: adminRole.id,
            permission_id: permission.id,
          });
        }
      }
      console.log('Assigned Customer Activity permissions to Admin role');
    }

    console.log('Customer activity permissions setup completed successfully');
  } catch (error) {
    console.error('Error setting up customer activity permissions:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

addCustomerActivityPermissions();
