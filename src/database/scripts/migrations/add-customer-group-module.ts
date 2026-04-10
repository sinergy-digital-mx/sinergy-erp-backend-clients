import { AppDataSource } from '../../data-source';
import { v4 as uuidv4 } from 'uuid';

async function addCustomerGroupModule() {
  try {
    await AppDataSource.initialize();
    console.log('🔄 Adding CustomerGroup module...');

    // Check if CustomerGroup entity exists in registry
    const existingEntity = await AppDataSource.query(
      `SELECT id FROM entity_registry WHERE code = ?`,
      ['CustomerGroup']
    );

    let customerGroupEntityId: string;

    if (existingEntity.length > 0) {
      customerGroupEntityId = existingEntity[0].id;
      console.log('✅ CustomerGroup entity already exists in registry');
    } else {
      // Add CustomerGroup entity to registry
      const result = await AppDataSource.query(
        `INSERT INTO entity_registry (code, name) VALUES (?, ?)`,
        ['CustomerGroup', 'Customer Group Management']
      );
      customerGroupEntityId = result.insertId;
      console.log('✅ Added CustomerGroup to entity_registry');
    }

    // Check if Customer Management module exists
    const existingModule = await AppDataSource.query(
      `SELECT id FROM modules WHERE code = ?`,
      ['customers']
    );

    let customerModuleId: string;

    if (existingModule.length === 0) {
      // Create Customer Management module if it doesn't exist
      const moduleResult = await AppDataSource.query(
        `INSERT INTO modules (code, name, description) VALUES (?, ?, ?)`,
        ['customers', 'Customer Management', 'Manage customers and customer groups']
      );
      customerModuleId = moduleResult.insertId;
      console.log('✅ Created Customer Management module');
    } else {
      customerModuleId = existingModule[0].id;
      console.log('✅ Customer Management module already exists');
    }

    // Define permissions for CustomerGroup
    const permissions = [
      { action: 'Create', description: 'Create customer groups' },
      { action: 'Read', description: 'View customer groups' },
      { action: 'Update', description: 'Update customer groups' },
      { action: 'Delete', description: 'Delete customer groups' },
    ];

    // Add permissions
    for (const perm of permissions) {
      // Check if permission already exists
      const existingPerm = await AppDataSource.query(
        `SELECT id FROM rbac_permissions WHERE entity_registry_id = ? AND action = ?`,
        [customerGroupEntityId, perm.action]
      );

      if (existingPerm.length === 0) {
        try {
          await AppDataSource.query(
            `INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [uuidv4(), customerGroupEntityId, customerModuleId, perm.action, perm.description, true]
          );
          console.log(`✅ Added permission: CustomerGroup:${perm.action}`);
        } catch (error) {
          console.error(`❌ Error adding permission CustomerGroup:${perm.action}:`, error.message);
        }
      } else {
        console.log(`⏭️  Permission CustomerGroup:${perm.action} already exists`);
      }
    }

    // Get all tenants
    const tenants = await AppDataSource.query(`SELECT id, name FROM rbac_tenants`);
    console.log(`\n🔄 Enabling Customer Management module for ${tenants.length} tenants...`);

    // Enable module for all tenants
    for (const tenant of tenants) {
      const existingTenantModule = await AppDataSource.query(
        `SELECT id FROM tenant_modules WHERE tenant_id = ? AND module_id = ?`,
        [tenant.id, customerModuleId]
      );

      if (existingTenantModule.length === 0) {
        await AppDataSource.query(
          `INSERT INTO tenant_modules (tenant_id, module_id, is_enabled) VALUES (?, ?, ?)`,
          [tenant.id, customerModuleId, true]
        );
        console.log(`✅ Enabled Customer Management module for tenant: ${tenant.name}`);
      } else {
        // Update to ensure it's enabled
        await AppDataSource.query(
          `UPDATE tenant_modules SET is_enabled = ? WHERE tenant_id = ? AND module_id = ?`,
          [true, tenant.id, customerModuleId]
        );
        console.log(`✅ Customer Management module already enabled for tenant: ${tenant.name}`);
      }
    }

    console.log('\n✅ CustomerGroup module setup completed successfully!');
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up CustomerGroup module:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

addCustomerGroupModule();
