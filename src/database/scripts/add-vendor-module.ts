import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

async function addVendorModule() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔧 Adding Vendor module and permissions...\n');

    // Step 1: Check if Vendor entity already exists in registry
    const existingEntity = await AppDataSource.query(
      `SELECT id FROM entity_registry WHERE code = 'Vendor'`
    );

    let vendorEntityId: number;

    if (existingEntity.length) {
      vendorEntityId = existingEntity[0].id;
      console.log(`✅ Vendor entity already exists with ID: ${vendorEntityId}`);
    } else {
      // Add Vendor entity to registry
      const result = await AppDataSource.query(
        `INSERT INTO entity_registry (code, name) VALUES (?, ?)`,
        ['Vendor', 'Vendor Management']
      );
      vendorEntityId = result.insertId;
      console.log(`✅ Added Vendor entity with ID: ${vendorEntityId}`);
    }

    // Step 2: Check if vendors module already exists
    const existingModule = await AppDataSource.query(
      `SELECT id FROM modules WHERE code = 'vendors'`
    );

    let vendorModuleId: string;

    if (existingModule.length) {
      vendorModuleId = existingModule[0].id;
      console.log(`✅ Vendors module already exists with ID: ${vendorModuleId}`);
    } else {
      // Create vendors module
      vendorModuleId = uuidv4();
      await AppDataSource.query(
        `INSERT INTO modules (id, name, code, description, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [vendorModuleId, 'Vendor Management', 'vendors', 'Module for managing vendors and suppliers']
      );
      console.log(`✅ Created vendors module with ID: ${vendorModuleId}`);
    }

    // Step 3: Define and create permissions
    const permissions = [
      { action: 'Create', description: 'Create new vendors' },
      { action: 'Read', description: 'View vendor information' },
      { action: 'Update', description: 'Edit vendor information' },
      { action: 'Delete', description: 'Delete vendors' },
    ];

    console.log('\n📝 Creating permissions...');
    for (const perm of permissions) {
      const existing = await AppDataSource.query(
        `SELECT id FROM rbac_permissions 
         WHERE entity_registry_id = ? AND action = ?`,
        [vendorEntityId, perm.action]
      );

      if (existing.length) {
        console.log(`  ⏭️  ${perm.action} permission already exists`);
        continue;
      }

      await AppDataSource.query(
        `INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [uuidv4(), vendorEntityId, vendorModuleId, perm.action, perm.description, true]
      );

      console.log(`  ✅ Added ${perm.action} permission`);
    }

    // Step 4: Enable vendor module for all tenants
    console.log('\n🏢 Enabling vendor module for all tenants...');
    const tenants = await AppDataSource.query(`SELECT id, name FROM rbac_tenants`);
    console.log(`📋 Found ${tenants.length} tenant(s)\n`);

    for (const tenant of tenants) {
      const existing = await AppDataSource.query(
        `SELECT id FROM tenant_modules 
         WHERE tenant_id = ? AND module_id = ?`,
        [tenant.id, vendorModuleId]
      );

      if (existing.length) {
        console.log(`  ⏭️  Vendors module already enabled for tenant: ${tenant.name}`);
        continue;
      }

      await AppDataSource.query(
        `INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [uuidv4(), tenant.id, vendorModuleId, true]
      );

      console.log(`  ✅ Enabled vendors module for tenant: ${tenant.name}`);
    }

    // Step 5: Assign vendor permissions to Admin roles
    console.log('\n🔑 Assigning vendor permissions to Admin roles...');
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

      // Get all Vendor permissions
      const vendorPerms = await AppDataSource.query(
        `SELECT id FROM rbac_permissions 
         WHERE entity_registry_id = ?`,
        [vendorEntityId]
      );

      for (const perm of vendorPerms) {
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

      console.log(`  ✅ Assigned all vendor permissions to Admin role for tenant: ${tenant.name}`);
    }

    console.log('\n✅ Vendor module setup completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

addVendorModule()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
