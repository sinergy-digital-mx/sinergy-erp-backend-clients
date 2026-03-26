import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

async function addBillingModule() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔧 Adding Billing module and permissions...\n');

    // Step 1: Check if FiscalConfiguration entity already exists in registry
    const existingEntity = await AppDataSource.query(
      `SELECT id FROM entity_registry WHERE code = 'FiscalConfiguration'`
    );

    let fiscalEntityId: number;

    if (existingEntity.length) {
      fiscalEntityId = existingEntity[0].id;
      console.log(`✅ FiscalConfiguration entity already exists with ID: ${fiscalEntityId}`);
    } else {
      const result = await AppDataSource.query(
        `INSERT INTO entity_registry (code, name) VALUES (?, ?)`,
        ['FiscalConfiguration', 'Fiscal Configuration Management']
      );
      fiscalEntityId = result.insertId;
      console.log(`✅ Added FiscalConfiguration entity with ID: ${fiscalEntityId}`);
    }

    // Step 2: Check if billing module already exists
    const existingModule = await AppDataSource.query(
      `SELECT id FROM modules WHERE code = 'billing'`
    );

    let billingModuleId: string;

    if (existingModule.length) {
      billingModuleId = existingModule[0].id;
      console.log(`✅ Billing module already exists with ID: ${billingModuleId}`);
    } else {
      billingModuleId = uuidv4();
      await AppDataSource.query(
        `INSERT INTO modules (id, name, code, description, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [billingModuleId, 'Billing Management', 'billing', 'Module for managing fiscal configurations and billing']
      );
      console.log(`✅ Created billing module with ID: ${billingModuleId}`);
    }

    // Step 3: Define and create permissions
    const permissions = [
      { action: 'Create', description: 'Create new fiscal configurations' },
      { action: 'Read', description: 'View fiscal configuration information' },
      { action: 'Update', description: 'Edit fiscal configuration information' },
      { action: 'Delete', description: 'Delete fiscal configurations' },
    ];

    console.log('\n📝 Creating permissions...');
    for (const perm of permissions) {
      const existing = await AppDataSource.query(
        `SELECT id FROM rbac_permissions 
         WHERE entity_registry_id = ? AND action = ? AND module_id = ?`,
        [fiscalEntityId, perm.action, billingModuleId]
      );

      if (existing.length) {
        console.log(`  ⏭️  ${perm.action} permission already exists`);
        continue;
      }

      try {
        await AppDataSource.query(
          `INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [uuidv4(), fiscalEntityId, billingModuleId, perm.action, perm.description, true]
        );

        console.log(`  ✅ Added ${perm.action} permission`);
      } catch (err: any) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`  ⏭️  ${perm.action} permission already exists (duplicate)`);
        } else {
          throw err;
        }
      }
    }

    // Step 4: Enable billing module for all tenants
    console.log('\n🏢 Enabling billing module for all tenants...');
    const tenants = await AppDataSource.query(`SELECT id, name FROM rbac_tenants`);
    console.log(`📋 Found ${tenants.length} tenant(s)\n`);

    for (const tenant of tenants) {
      const existing = await AppDataSource.query(
        `SELECT id FROM tenant_modules 
         WHERE tenant_id = ? AND module_id = ?`,
        [tenant.id, billingModuleId]
      );

      if (existing.length) {
        console.log(`  ⏭️  Billing module already enabled for tenant: ${tenant.name}`);
        continue;
      }

      await AppDataSource.query(
        `INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [uuidv4(), tenant.id, billingModuleId, true]
      );

      console.log(`  ✅ Enabled billing module for tenant: ${tenant.name}`);
    }

    // Step 5: Assign billing permissions to Admin roles
    console.log('\n🔑 Assigning billing permissions to Admin roles...');
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

      // Get all FiscalConfiguration permissions
      const fiscalPerms = await AppDataSource.query(
        `SELECT id FROM rbac_permissions 
         WHERE entity_registry_id = ?`,
        [fiscalEntityId]
      );

      for (const perm of fiscalPerms) {
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

      console.log(`  ✅ Assigned all billing permissions to Admin role for tenant: ${tenant.name}`);
    }

    console.log('\n✅ Billing module setup completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

addBillingModule()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
