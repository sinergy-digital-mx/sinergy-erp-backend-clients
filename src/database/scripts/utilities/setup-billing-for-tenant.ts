import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

async function setupBillingForTenant() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const tenantId = 'afff1757-dbcf-4715-a756-6b22bb2c59d5';

    console.log(`🔧 Setting up Billing module for tenant: ${tenantId}\n`);

    // Step 1: Verify tenant exists
    const tenant = await AppDataSource.query(
      `SELECT id, name FROM rbac_tenants WHERE id = ?`,
      [tenantId]
    );

    if (!tenant.length) {
      console.error(`❌ Tenant ${tenantId} not found`);
      process.exit(1);
    }

    console.log(`✅ Found tenant: ${tenant[0].name}\n`);

    // Step 2: Get or create FiscalConfiguration entity in registry
    let fiscalEntityId: number;
    const existingEntity = await AppDataSource.query(
      `SELECT id FROM entity_registry WHERE code = 'FiscalConfiguration'`
    );

    if (existingEntity.length) {
      fiscalEntityId = existingEntity[0].id;
      console.log(`✅ FiscalConfiguration entity exists with ID: ${fiscalEntityId}`);
    } else {
      const result = await AppDataSource.query(
        `INSERT INTO entity_registry (code, name) VALUES (?, ?)`,
        ['FiscalConfiguration', 'Fiscal Configuration Management']
      );
      fiscalEntityId = result.insertId;
      console.log(`✅ Created FiscalConfiguration entity with ID: ${fiscalEntityId}`);
    }

    // Step 3: Get or create billing module
    let billingModuleId: string;
    const existingModule = await AppDataSource.query(
      `SELECT id FROM modules WHERE code = 'billing'`
    );

    if (existingModule.length) {
      billingModuleId = existingModule[0].id;
      console.log(`✅ Billing module exists with ID: ${billingModuleId}`);
    } else {
      billingModuleId = uuidv4();
      await AppDataSource.query(
        `INSERT INTO modules (id, name, code, description, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [billingModuleId, 'Billing Management', 'billing', 'Module for managing fiscal configurations and billing']
      );
      console.log(`✅ Created billing module with ID: ${billingModuleId}`);
    }

    // Step 4: Create permissions if they don't exist
    const permissions = [
      { action: 'Create', description: 'Create new fiscal configurations' },
      { action: 'Read', description: 'View fiscal configuration information' },
      { action: 'Update', description: 'Edit fiscal configuration information' },
      { action: 'Delete', description: 'Delete fiscal configurations' },
    ];

    console.log('\n📝 Creating/Verifying permissions...');
    const permissionIds: string[] = [];

    for (const perm of permissions) {
      const existing = await AppDataSource.query(
        `SELECT id FROM rbac_permissions 
         WHERE entity_registry_id = ? AND action = ? AND module_id = ?`,
        [fiscalEntityId, perm.action, billingModuleId]
      );

      let permId: string;

      if (existing.length) {
        permId = existing[0].id;
        console.log(`  ⏭️  ${perm.action} permission already exists`);
      } else {
        try {
          permId = uuidv4();
          await AppDataSource.query(
            `INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [permId, fiscalEntityId, billingModuleId, perm.action, perm.description, true]
          );
          console.log(`  ✅ Created ${perm.action} permission`);
        } catch (err: any) {
          if (err.code === 'ER_DUP_ENTRY') {
            const existing2 = await AppDataSource.query(
              `SELECT id FROM rbac_permissions 
               WHERE entity_registry_id = ? AND action = ?`,
              [fiscalEntityId, perm.action]
            );
            permId = existing2[0].id;
            console.log(`  ⏭️  ${perm.action} permission already exists (duplicate)`);
          } else {
            throw err;
          }
        }
      }

      permissionIds.push(permId);
    }

    // Step 5: Enable billing module for this tenant
    console.log(`\n🏢 Enabling billing module for tenant...`);
    const existingTenantModule = await AppDataSource.query(
      `SELECT id FROM tenant_modules 
       WHERE tenant_id = ? AND module_id = ?`,
      [tenantId, billingModuleId]
    );

    if (existingTenantModule.length) {
      console.log(`  ⏭️  Billing module already enabled for this tenant`);
    } else {
      await AppDataSource.query(
        `INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [uuidv4(), tenantId, billingModuleId, true]
      );
      console.log(`  ✅ Enabled billing module for tenant`);
    }

    // Step 6: Get Admin role for this tenant
    console.log(`\n🔑 Assigning permissions to Admin role...`);
    const adminRole = await AppDataSource.query(
      `SELECT id FROM rbac_roles WHERE name = 'Admin' AND tenant_id = ?`,
      [tenantId]
    );

    if (!adminRole.length) {
      console.log(`  ⚠️  No Admin role found for this tenant`);
      console.log(`\n✅ Billing module setup completed!`);
      console.log(`⚠️  Please manually assign permissions to roles for this tenant`);
      process.exit(0);
    }

    const adminRoleId = adminRole[0].id;
    console.log(`  Found Admin role: ${adminRoleId}`);

    // Step 7: Assign all permissions to Admin role
    for (const permId of permissionIds) {
      const existing = await AppDataSource.query(
        `SELECT id FROM rbac_role_permissions 
         WHERE role_id = ? AND permission_id = ?`,
        [adminRoleId, permId]
      );

      if (!existing.length) {
        await AppDataSource.query(
          `INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
           VALUES (?, ?, ?, NOW())`,
          [uuidv4(), adminRoleId, permId]
        );
        console.log(`  ✅ Assigned permission to Admin role`);
      } else {
        console.log(`  ⏭️  Permission already assigned to Admin role`);
      }
    }

    console.log('\n✅ Billing module setup completed successfully for tenant!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Tenant: ${tenant[0].name}`);
    console.log(`   - Module: Billing (${billingModuleId})`);
    console.log(`   - Permissions: 4 (Create, Read, Update, Delete)`);
    console.log(`   - Admin Role: ${adminRoleId}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

setupBillingForTenant()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
