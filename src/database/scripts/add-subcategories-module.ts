import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

async function addSubcategoriesModule() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔧 Adding Subcategories module and permissions...\n');

    // Step 1: Get or create Subcategory entity
    const existingSubcategoryEntity = await AppDataSource.query(
      `SELECT id FROM entity_registry WHERE code = 'Subcategory'`
    );

    let subcategoryEntityId: number;

    if (existingSubcategoryEntity.length) {
      subcategoryEntityId = existingSubcategoryEntity[0].id;
      console.log(`✅ Subcategory entity already exists with ID: ${subcategoryEntityId}`);
    } else {
      const result = await AppDataSource.query(
        `INSERT INTO entity_registry (code, name) VALUES (?, ?)`,
        ['Subcategory', 'Subcategory Management']
      );
      subcategoryEntityId = result.insertId;
      console.log(`✅ Added Subcategory entity with ID: ${subcategoryEntityId}`);
    }

    // Step 2: Create or get subcategories module
    const existingModule = await AppDataSource.query(
      `SELECT id FROM modules WHERE code = 'subcategories'`
    );

    let subcategoriesModuleId: string;

    if (existingModule.length) {
      subcategoriesModuleId = existingModule[0].id;
      console.log(`✅ Subcategories module already exists with ID: ${subcategoriesModuleId}`);
    } else {
      subcategoriesModuleId = uuidv4();
      await AppDataSource.query(
        `INSERT INTO modules (id, name, code, description, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [subcategoriesModuleId, 'Subcategories Management', 'subcategories', 'Module for managing subcategories']
      );
      console.log(`✅ Created subcategories module with ID: ${subcategoriesModuleId}`);
    }

    // Step 3: Define and create permissions for subcategories
    const permissions = [
      { action: 'Create', description: 'Create new subcategories' },
      { action: 'Read', description: 'View subcategory information' },
      { action: 'Update', description: 'Edit subcategory information' },
      { action: 'Delete', description: 'Delete subcategories' },
    ];

    console.log('\n📝 Creating subcategory permissions...');
    for (const perm of permissions) {
      const existing = await AppDataSource.query(
        `SELECT id FROM rbac_permissions 
         WHERE entity_registry_id = ? AND action = ? AND module_id = ?`,
        [subcategoryEntityId, perm.action, subcategoriesModuleId]
      );

      if (existing.length) {
        console.log(`  ⏭️  Subcategory ${perm.action} permission already exists`);
        continue;
      }

      try {
        await AppDataSource.query(
          `INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [uuidv4(), subcategoryEntityId, subcategoriesModuleId, perm.action, perm.description, true]
        );

        console.log(`  ✅ Added Subcategory ${perm.action} permission`);
      } catch (err: any) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`  ⏭️  Subcategory ${perm.action} permission already exists (duplicate)`);
        } else {
          throw err;
        }
      }
    }

    // Step 4: Enable subcategories module for all tenants
    console.log('\n🏢 Enabling subcategories module for all tenants...');
    const tenants = await AppDataSource.query(`SELECT id, name FROM rbac_tenants`);
    console.log(`📋 Found ${tenants.length} tenant(s)\n`);

    for (const tenant of tenants) {
      const existing = await AppDataSource.query(
        `SELECT id FROM tenant_modules 
         WHERE tenant_id = ? AND module_id = ?`,
        [tenant.id, subcategoriesModuleId]
      );

      if (existing.length) {
        console.log(`  ⏭️  Subcategories module already enabled for tenant: ${tenant.name}`);
        continue;
      }

      await AppDataSource.query(
        `INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [uuidv4(), tenant.id, subcategoriesModuleId, true]
      );

      console.log(`  ✅ Enabled subcategories module for tenant: ${tenant.name}`);
    }

    // Step 5: Assign subcategories permissions to Admin roles
    console.log('\n🔑 Assigning subcategories permissions to Admin roles...');
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

      // Get all Subcategory permissions
      const subcategoryPerms = await AppDataSource.query(
        `SELECT id FROM rbac_permissions 
         WHERE entity_registry_id = ?`,
        [subcategoryEntityId]
      );

      for (const perm of subcategoryPerms) {
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

      console.log(`  ✅ Assigned all subcategories permissions to Admin role for tenant: ${tenant.name}`);
    }

    console.log('\n✅ Subcategories module setup completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

addSubcategoriesModule()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
