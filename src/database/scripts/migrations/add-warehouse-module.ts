import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

async function addWarehouseModule() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔧 Adding Warehouse module and permissions...\n');

    // Step 1: Check if Warehouse entity already exists in registry
    const existingEntity = await AppDataSource.query(
      `SELECT id FROM entity_registry WHERE code = 'Warehouse'`
    );

    let warehouseEntityId: number;

    if (existingEntity.length) {
      warehouseEntityId = existingEntity[0].id;
      console.log(`✅ Warehouse entity already exists with ID: ${warehouseEntityId}`);
    } else {
      // Add Warehouse entity to registry
      const result = await AppDataSource.query(
        `INSERT INTO entity_registry (code, name) VALUES (?, ?)`,
        ['Warehouse', 'Warehouse Management']
      );
      warehouseEntityId = result.insertId;
      console.log(`✅ Added Warehouse entity with ID: ${warehouseEntityId}`);
    }

    // Step 2: Check if warehouses module already exists
    const existingModule = await AppDataSource.query(
      `SELECT id FROM modules WHERE code = 'warehouses'`
    );

    let warehouseModuleId: string;

    if (existingModule.length) {
      warehouseModuleId = existingModule[0].id;
      console.log(`✅ Warehouses module already exists with ID: ${warehouseModuleId}`);
    } else {
      // Create warehouses module
      warehouseModuleId = uuidv4();
      await AppDataSource.query(
        `INSERT INTO modules (id, name, code, description, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [warehouseModuleId, 'Warehouse Management', 'warehouses', 'Module for managing warehouses and inventory locations']
      );
      console.log(`✅ Created warehouses module with ID: ${warehouseModuleId}`);
    }

    // Step 3: Define and create permissions
    const permissions = [
      { action: 'Create', description: 'Create new warehouses' },
      { action: 'Read', description: 'View warehouse information' },
      { action: 'Update', description: 'Edit warehouse information' },
      { action: 'Delete', description: 'Delete warehouses' },
    ];

    console.log('\n📝 Creating permissions...');
    for (const perm of permissions) {
      const existing = await AppDataSource.query(
        `SELECT id FROM rbac_permissions 
         WHERE entity_registry_id = ? AND action = ?`,
        [warehouseEntityId, perm.action]
      );

      if (existing.length) {
        console.log(`  ⏭️  ${perm.action} permission already exists`);
        continue;
      }

      await AppDataSource.query(
        `INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [uuidv4(), warehouseEntityId, warehouseModuleId, perm.action, perm.description, true]
      );

      console.log(`  ✅ Added ${perm.action} permission`);
    }

    // Step 4: Enable warehouse module for all tenants
    console.log('\n🏢 Enabling warehouse module for all tenants...');
    const tenants = await AppDataSource.query(`SELECT id, name FROM rbac_tenants`);
    console.log(`📋 Found ${tenants.length} tenant(s)\n`);

    for (const tenant of tenants) {
      const existing = await AppDataSource.query(
        `SELECT id FROM tenant_modules 
         WHERE tenant_id = ? AND module_id = ?`,
        [tenant.id, warehouseModuleId]
      );

      if (existing.length) {
        console.log(`  ⏭️  Warehouses module already enabled for tenant: ${tenant.name}`);
        continue;
      }

      await AppDataSource.query(
        `INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [uuidv4(), tenant.id, warehouseModuleId, true]
      );

      console.log(`  ✅ Enabled warehouses module for tenant: ${tenant.name}`);
    }

    // Step 5: Assign warehouse permissions to Admin roles
    console.log('\n🔑 Assigning warehouse permissions to Admin roles...');
    for (const tenant of tenants) {
      const adminRole = await AppDataSource.query(
        `SELECT id FROM rbac_roles WHERE name = 'Admin' AND tenant_id = ?`,
        [tenant.id]
      );

      if (!adminRole.length) {
        console.log(`  ⚠️  No Admin role found for tenant ${tenant.name}`);
        continue;
      }

      const adminRoleId = adminRole[0].id;

      // Get all Warehouse permissions
      const warehousePerms = await AppDataSource.query(
        `SELECT id FROM rbac_permissions 
         WHERE entity_registry_id = ?`,
        [warehouseEntityId]
      );

      for (const perm of warehousePerms) {
        const existing = await AppDataSource.query(
          `SELECT id FROM rbac_role_permissions 
           WHERE role_id = ? AND permission_id = ?`,
          [adminRoleId, perm.id]
        );

        if (!existing.length) {
          await AppDataSource.query(
            `INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
             VALUES (?, ?, ?, NOW())`,
            [uuidv4(), adminRoleId, perm.id]
          );
        }
      }

      console.log(`  ✅ Assigned all warehouse permissions to Admin role for tenant: ${tenant.name}`);
    }

    console.log('\n✅ Warehouse module setup completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

addWarehouseModule()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
