import { AppDataSource } from '../data-source';
import { Role } from '../../entities/rbac/role.entity';
import { Permission } from '../../entities/rbac/permission.entity';
import { Module } from '../../entities/rbac/module.entity';
import { EntityRegistry } from '../../entities/entity-registry/entity-registry.entity';

async function addTransactionPermissions() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    // Get or create Transaction entity registry
    let transactionRegistry = await AppDataSource.manager.findOne(EntityRegistry, {
      where: { code: 'transaction' },
    });

    if (!transactionRegistry) {
      transactionRegistry = AppDataSource.manager.create(EntityRegistry, {
        code: 'transaction',
        name: 'Transaction',
      });
      await AppDataSource.manager.save(transactionRegistry);
      console.log('Created Transaction entity registry');
    }

    // Get or create Transactions module
    let transactionsModule = await AppDataSource.manager.findOne(Module, {
      where: { name: 'Transactions' },
    });

    if (!transactionsModule) {
      transactionsModule = AppDataSource.manager.create(Module, {
        name: 'Transactions',
        code: 'transactions',
        description: 'Transaction management module',
      });
      await AppDataSource.manager.save(transactionsModule);
      console.log('Created Transactions module');
    }

    // Define transaction permissions
    const transactionPermissions = [
      { action: 'Create', description: 'Create transactions' },
      { action: 'Read', description: 'Read transactions' },
      { action: 'Update', description: 'Update transactions' },
      { action: 'Delete', description: 'Delete transactions' },
    ];

    // Create or get permissions
    const permissions: Permission[] = [];
    for (const perm of transactionPermissions) {
      let permission = await AppDataSource.manager.findOne(Permission, {
        where: {
          entity_registry_id: transactionRegistry.id,
          action: perm.action,
        },
      });

      if (!permission) {
        permission = AppDataSource.manager.create(Permission, {
          entity_registry_id: transactionRegistry.id,
          action: perm.action,
          description: perm.description,
          module_id: transactionsModule.id,
        });
        await AppDataSource.manager.save(permission);
        console.log(`Created Permission: Transaction ${perm.action}`);
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
      console.log('Assigned Transaction permissions to Admin role');
    }

    console.log('Transaction permissions setup completed successfully');
  } catch (error) {
    console.error('Error setting up transaction permissions:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

addTransactionPermissions();
