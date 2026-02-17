import { AppDataSource } from '../data-source';
import { Role } from '../../entities/rbac/role.entity';
import { Permission } from '../../entities/rbac/permission.entity';
import { Module } from '../../entities/rbac/module.entity';
import { EntityRegistry } from '../../entities/entity-registry/entity-registry.entity';

async function addPaymentPermissions() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    // Get or create Payment entity registry
    let paymentRegistry = await AppDataSource.manager.findOne(EntityRegistry, {
      where: { code: 'Payment' },
    });

    if (!paymentRegistry) {
      paymentRegistry = AppDataSource.manager.create(EntityRegistry, {
        code: 'Payment',
        name: 'Payment',
      });
      await AppDataSource.manager.save(paymentRegistry);
      console.log('Created Payment entity registry');
    }

    // Get or create Payments module
    let paymentsModule = await AppDataSource.manager.findOne(Module, {
      where: { name: 'Payments' },
    });

    if (!paymentsModule) {
      paymentsModule = AppDataSource.manager.create(Module, {
        name: 'Payments',
        code: 'payments',
        description: 'Payment management module',
      });
      await AppDataSource.manager.save(paymentsModule);
      console.log('Created Payments module');
    }

    // Define payment permissions
    const paymentPermissions = [
      { action: 'Create', description: 'Create payments' },
      { action: 'Read', description: 'Read payments' },
      { action: 'Update', description: 'Update payments' },
      { action: 'Delete', description: 'Delete payments' },
    ];

    // Create or get permissions
    const permissions: Permission[] = [];
    for (const perm of paymentPermissions) {
      let permission = await AppDataSource.manager.findOne(Permission, {
        where: {
          entity_registry_id: paymentRegistry.id,
          action: perm.action,
        },
      });

      if (!permission) {
        permission = AppDataSource.manager.create(Permission, {
          entity_registry_id: paymentRegistry.id,
          action: perm.action,
          description: perm.description,
          module_id: paymentsModule.id,
        });
        await AppDataSource.manager.save(permission);
        console.log(`Created Permission: Payment ${perm.action}`);
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
      console.log('Assigned Payment permissions to Admin role');
    }

    console.log('Payment permissions setup completed successfully');
  } catch (error) {
    console.error('Error setting up payment permissions:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

addPaymentPermissions();
