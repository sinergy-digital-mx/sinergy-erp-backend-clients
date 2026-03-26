import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

async function addProductsModule() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔧 Adding Products module and permissions...\n');

    // Define entities for the products module
    const entities = [
      { code: 'Product', name: 'Product Management' },
      { code: 'UoM', name: 'Unit of Measure Management' },
      { code: 'UoMRelationship', name: 'UoM Relationship Management' },
      { code: 'VendorProductPrice', name: 'Vendor Product Price Management' },
      { code: 'ProductPhoto', name: 'Product Photo Management' },
    ];

    // Step 1: Create/Get Products Module
    console.log('📦 Setting up Products module...\n');

    const existingModule = await AppDataSource.query(
      `SELECT id FROM modules WHERE code = 'products'`
    );

    let productsModuleId: string;

    if (existingModule.length) {
      productsModuleId = existingModule[0].id;
      console.log(`✅ Products module already exists with ID: ${productsModuleId}`);
    } else {
      productsModuleId = uuidv4();
      await AppDataSource.query(
        `INSERT INTO modules (id, name, code, description, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [
          productsModuleId,
          'Product Management',
          'products',
          'Module for managing products, units of measure, pricing, and photos',
        ]
      );
      console.log(`✅ Created products module with ID: ${productsModuleId}`);
    }

    // Step 2: Create/Get Entity Registry entries
    console.log('\n📋 Setting up entities...');
    const entityIds: { [key: string]: number } = {};

    for (const entity of entities) {
      const existing = await AppDataSource.query(
        `SELECT id FROM entity_registry WHERE code = ?`,
        [entity.code]
      );

      if (existing.length) {
        entityIds[entity.code] = existing[0].id;
        console.log(`  ✅ ${entity.code} entity already exists`);
      } else {
        const result = await AppDataSource.query(
          `INSERT INTO entity_registry (code, name) VALUES (?, ?)`,
          [entity.code, entity.name]
        );
        entityIds[entity.code] = result.insertId;
        console.log(`  ✅ Created ${entity.code} entity`);
      }
    }

    // Step 3: Create Permissions for each entity
    console.log('\n📝 Creating permissions...');
    const actions = ['Create', 'Read', 'Update', 'Delete'];

    for (const entity of entities) {
      console.log(`\n  ${entity.code}:`);
      const entityId = entityIds[entity.code];

      for (const action of actions) {
        const existing = await AppDataSource.query(
          `SELECT id FROM rbac_permissions 
           WHERE entity_registry_id = ? AND action = ? AND module_id = ?`,
          [entityId, action, productsModuleId]
        );

        if (existing.length) {
          console.log(`    ⏭️  ${action} permission exists`);
          continue;
        }

        try {
          await AppDataSource.query(
            `INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              uuidv4(),
              entityId,
              productsModuleId,
              action,
              `${action} ${entity.code}`,
              true,
            ]
          );
          console.log(`    ✅ Created ${action} permission`);
        } catch (err: any) {
          if (err.code === 'ER_DUP_ENTRY') {
            console.log(`    ⏭️  ${action} permission exists (duplicate)`);
          } else {
            throw err;
          }
        }
      }
    }

    // Step 4: Enable products module for all tenants
    console.log('\n🏢 Enabling products module for all tenants...');
    const tenants = await AppDataSource.query(`SELECT id, name FROM rbac_tenants`);
    console.log(`📋 Found ${tenants.length} tenant(s)\n`);

    for (const tenant of tenants) {
      const existing = await AppDataSource.query(
        `SELECT id FROM tenant_modules 
         WHERE tenant_id = ? AND module_id = ?`,
        [tenant.id, productsModuleId]
      );

      if (existing.length) {
        console.log(`  ⏭️  Products module already enabled for tenant: ${tenant.name}`);
        continue;
      }

      await AppDataSource.query(
        `INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [uuidv4(), tenant.id, productsModuleId, true]
      );

      console.log(`  ✅ Enabled products module for tenant: ${tenant.name}`);
    }

    // Step 5: Assign all product permissions to Admin roles
    console.log('\n🔑 Assigning product permissions to Admin roles...');
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

      // Get all product-related permissions
      for (const entity of entities) {
        const entityId = entityIds[entity.code];
        const perms = await AppDataSource.query(
          `SELECT id FROM rbac_permissions 
           WHERE entity_registry_id = ?`,
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
      }

      console.log(`  ✅ Assigned all product permissions to Admin role for tenant: ${tenant.name}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Products module setup completed successfully!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   - Module: Product Management`);
    console.log(`   - Entities: ${entities.length}`);
    console.log(`   - Permissions per entity: ${actions.length}`);
    console.log(`   - Total permissions: ${entities.length * actions.length}`);
    console.log(`   - Tenants enabled: ${tenants.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

addProductsModule()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
