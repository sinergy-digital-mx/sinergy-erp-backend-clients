import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

async function addCategoriesModule() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔧 Adding Categories module and permissions...\n');

    // Step 1: Check if Category entity already exists in registry
    const existingCategoryEntity = await AppDataSource.query(
      `SELECT id FROM entity_registry WHERE code = 'Category'`
    );

    let categoryEntityId: number;

    if (existingCategoryEntity.length) {
      categoryEntityId = existingCategoryEntity[0].id;
      console.log(`✅ Category entity already exists with ID: ${categoryEntityId}`);
    } else {
      const result = await AppDataSource.query(
        `INSERT INTO entity_registry (code, name) VALUES (?, ?)`,
        ['Category', 'Category Management']
      );
      categoryEntityId = result.insertId;
      console.log(`✅ Added Category entity with ID: ${categoryEntityId}`);
    }

    // Step 2: Check if Subcategory entity already exists in registry
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

    // Step 3: Check if categories module already exists
    const existingModule = await AppDataSource.query(
      `SELECT id FROM modules WHERE code = 'categories'`
    );

    let categoriesModuleId: string;

    if (existingModule.length) {
      categoriesModuleId = existingModule[0].id;
      console.log(`✅ Categories module already exists with ID: ${categoriesModuleId}`);
    } else {
      categoriesModuleId = uuidv4();
      await AppDataSource.query(
        `INSERT INTO modules (id, name, code, description, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [categoriesModuleId, 'Categories Management', 'categories', 'Module for managing categories and subcategories']
      );
      console.log(`✅ Created categories module with ID: ${categoriesModuleId}`);
    }

    // Step 4: Define and create permissions for categories
    const permissions = [
      { action: 'Create', description: 'Create new categories' },
      { action: 'Read', description: 'View category information' },
      { action: 'Update', description: 'Edit category information' },
      { action: 'Delete', description: 'Delete categories' },
    ];

    console.log('\n📝 Creating category permissions...');
    for (const perm of permissions) {
      const existing = await AppDataSource.query(
        `SELECT id FROM rbac_permissions 
         WHERE entity_registry_id = ? AND action = ? AND module_id = ?`,
        [categoryEntityId, perm.action, categoriesModuleId]
      );

      if (existing.length) {
        console.log(`  ⏭️  Category ${perm.action} permission already exists`);
        continue;
      }

      try {
        await AppDataSource.query(
          `INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [uuidv4(), categoryEntityId, categoriesModuleId, perm.action, perm.description, true]
        );

        console.log(`  ✅ Added Category ${perm.action} permission`);
      } catch (err: any) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`  ⏭️  Category ${perm.action} permission already exists (duplicate)`);
        } else {
          throw err;
        }
      }
    }

    // Step 5: Create permissions for subcategories
    console.log('\n📝 Creating subcategory permissions...');
    for (const perm of permissions) {
      const existing = await AppDataSource.query(
        `SELECT id FROM rbac_permissions 
         WHERE entity_registry_id = ? AND action = ? AND module_id = ?`,
        [subcategoryEntityId, perm.action, categoriesModuleId]
      );

      if (existing.length) {
        console.log(`  ⏭️  Subcategory ${perm.action} permission already exists`);
        continue;
      }

      try {
        await AppDataSource.query(
          `INSERT INTO rbac_permissions (id, entity_registry_id, module_id, action, description, is_system_permission, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [uuidv4(), subcategoryEntityId, categoriesModuleId, perm.action, perm.description, true]
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

    // Step 6: Enable categories module for all tenants
    console.log('\n🏢 Enabling categories module for all tenants...');
    const tenants = await AppDataSource.query(`SELECT id, name FROM rbac_tenants`);
    console.log(`📋 Found ${tenants.length} tenant(s)\n`);

    for (const tenant of tenants) {
      const existing = await AppDataSource.query(
        `SELECT id FROM tenant_modules 
         WHERE tenant_id = ? AND module_id = ?`,
        [tenant.id, categoriesModuleId]
      );

      if (existing.length) {
        console.log(`  ⏭️  Categories module already enabled for tenant: ${tenant.name}`);
        continue;
      }

      await AppDataSource.query(
        `INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [uuidv4(), tenant.id, categoriesModuleId, true]
      );

      console.log(`  ✅ Enabled categories module for tenant: ${tenant.name}`);
    }

    // Step 7: Assign categories permissions to Admin roles
    console.log('\n🔑 Assigning categories permissions to Admin roles...');
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

      // Get all Category and Subcategory permissions
      const categoryPerms = await AppDataSource.query(
        `SELECT id FROM rbac_permissions 
         WHERE entity_registry_id IN (?, ?)`,
        [categoryEntityId, subcategoryEntityId]
      );

      for (const perm of categoryPerms) {
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

      console.log(`  ✅ Assigned all categories permissions to Admin role for tenant: ${tenant.name}`);
    }

    console.log('\n✅ Categories module setup completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

addCategoriesModule()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
