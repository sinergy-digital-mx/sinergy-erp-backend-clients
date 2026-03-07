import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

async function setupAllModules() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔧 Setting up ALL modules and permissions...\n');

    // Get all tenants
    const tenants = await AppDataSource.query(`SELECT id, name FROM rbac_tenants`);
    console.log(`📋 Found ${tenants.length} tenant(s)\n`);

    // Modules to setup
    const modules = [
      { code: 'vendors', name: 'Vendor Management', entity: 'Vendor' },
      { code: 'warehouses', name: 'Warehouse Management', entity: 'Warehouse' },
      { code: 'categories', name: 'Categories Management', entity: 'Category' },
      { code: 'billing', name: 'Billing Management', entity: 'FiscalConfiguration' },
      { code: 'products', name: 'Product Management', entity: 'Product' },
    ];

    for (const moduleConfig of modules) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📦 Setting up ${moduleConfig.name}`);
      console.log(`${'='.repeat(60)}`);

      // Step 1: Create/Get Entity Registry
      let entityId: number;
      const existingEntity = await AppDataSource.query(
        `SELECT id FROM entity_registry WHERE code = ?`,
        [moduleConfig.entity]
      );

      if (existingEntity.length) {
        entityId = existingEntity[0].id;
        console.log(`✅ Entity ${moduleConfig.entity} exists`);
      } else {
        const result = await AppDataSource.query(
          `INSERT INTO entity_registry (code, name) VALUES (?, ?)`,
          [moduleConfig.entity, `${moduleConfig.entity} Management`]
        );
        entityId = result.insertId;
        console.log(`✅ Created entity ${moduleConfig.entity}`);
      }

      // Step 2: Create/Get Module
      let moduleId: string;
      const existingModule = await AppDataSource.query(
        `SELECT id FROM modules WHERE code = ?`,
        [moduleConfig.code]
      );

      if (existingModule.length) {
        moduleId = existingModule[0].id;
        console.log(`✅ Module ${moduleConfig.code} exists`);
      } else {
        moduleId = uuidv4();
        await AppDataSource.query(
          `INSERT INTO modules (id, name, code, description, created_at) 
           VALUES (?, ?, ?, ?, NOW())`,
          [moduleId, moduleConfig.name, moduleConfig.code, `Module for managing ${moduleConfig.code}`]
        );
        console.log(`✅ Created module ${moduleConfig.code}`);
      }

      // Step 3: Create Permissions
      const permissions = ['Create', 'Read', 'Update', 'Delete'];
      console.log(`\n📝 Creating permissions...`);

      for (const action of permissions) {
        const existing = await AppDataSource.query(
          `SELECT id FROM rbac_permissions 
           WHERE entity_registry_id = ? AND action = ? AND module_id = ?`,
          [entityId, action, moduleId]
        );

        if (existing.length) {
          console.log(`  ⏭️  ${action} permission exists`);
          continue;
        }

        try {
          await AppDataSource.query(
            `INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [uuidv4(), entityId, moduleId, action, `${action} ${moduleConfig.entity}`, true]
          );
          console.log(`  ✅ Created ${action} permission`);
        } catch (err: any) {
          if (err.code === 'ER_DUP_ENTRY') {
            console.log(`  ⏭️  ${action} permission exists (duplicate)`);
          } else {
            throw err;
          }
        }
      }

      // Step 4: Enable for all tenants
      console.log(`\n🏢 Enabling for tenants...`);
      for (const tenant of tenants) {
        const existing = await AppDataSource.query(
          `SELECT id FROM tenant_modules 
           WHERE tenant_id = ? AND module_id = ?`,
          [tenant.id, moduleId]
        );

        if (existing.length) {
          console.log(`  ⏭️  ${tenant.name}: already enabled`);
          continue;
        }

        await AppDataSource.query(
          `INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [uuidv4(), tenant.id, moduleId, true]
        );
        console.log(`  ✅ ${tenant.name}: enabled`);
      }

      // Step 5: Assign to Admin roles
      console.log(`\n🔑 Assigning to Admin roles...`);
      for (const tenant of tenants) {
        const adminRole = await AppDataSource.query(
          `SELECT id FROM rbac_roles WHERE name = 'Admin' AND tenant_id = ?`,
          [tenant.id]
        );

        if (!adminRole.length) {
          console.log(`  ⚠️  ${tenant.name}: No Admin role`);
          continue;
        }

        const adminRoleId = adminRole[0].id;
        const perms = await AppDataSource.query(
          `SELECT id FROM rbac_permissions WHERE entity_registry_id = ?`,
          [entityId]
        );

        for (const perm of perms) {
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
        console.log(`  ✅ ${tenant.name}: permissions assigned`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ ALL MODULES SETUP COMPLETED!`);
    console.log(`${'='.repeat(60)}`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Modules: ${modules.length}`);
    console.log(`   - Tenants: ${tenants.length}`);
    console.log(`   - Permissions per module: 4 (Create, Read, Update, Delete)`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

setupAllModules()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
