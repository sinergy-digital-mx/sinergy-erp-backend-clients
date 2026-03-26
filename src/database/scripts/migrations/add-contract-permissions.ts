import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

async function addContractPermissions() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔧 Adding Contract entity and permissions...\n');

    // Check if Contract entity already exists in registry
    const existingEntity = await AppDataSource.query(
      `SELECT id FROM entity_registry WHERE code = 'Contract'`
    );

    let contractEntityId: number;

    if (existingEntity.length) {
      contractEntityId = existingEntity[0].id;
      console.log(`✅ Contract entity already exists with ID: ${contractEntityId}`);
    } else {
      // Add Contract entity to registry
      const result = await AppDataSource.query(
        `INSERT INTO entity_registry (code, name) VALUES (?, ?)`,
        ['Contract', 'Contract Management']
      );
      contractEntityId = result.insertId;
      console.log(`✅ Added Contract entity with ID: ${contractEntityId}`);
    }

    // Define permissions to add
    const permissions = [
      { entity_registry_id: contractEntityId, action: 'Create' },
      { entity_registry_id: contractEntityId, action: 'Read' },
      { entity_registry_id: contractEntityId, action: 'Update' },
      { entity_registry_id: contractEntityId, action: 'Delete' },
    ];

    // Add each permission
    for (const perm of permissions) {
      const existing = await AppDataSource.query(
        `SELECT id FROM rbac_permissions 
         WHERE entity_registry_id = ? AND action = ?`,
        [perm.entity_registry_id, perm.action]
      );

      if (existing.length) {
        console.log(`  ⏭️  ${perm.action} permission already exists`);
        continue;
      }

      await AppDataSource.query(
        `INSERT INTO rbac_permissions (id, entity_registry_id, action, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW())`,
        [uuidv4(), perm.entity_registry_id, perm.action]
      );

      console.log(`  ✅ Added ${perm.action} permission`);
    }

    // Get all tenants and their Admin roles
    const tenants = await AppDataSource.query(`SELECT id FROM rbac_tenants`);
    console.log(`\n📋 Found ${tenants.length} tenant(s)\n`);

    for (const tenant of tenants) {
      const adminRole = await AppDataSource.query(
        `SELECT id FROM rbac_roles WHERE name = 'Admin' AND tenant_id = ?`,
        [tenant.id]
      );

      if (!adminRole.length) {
        console.log(`⚠️  No Admin role found for tenant ${tenant.id}`);
        continue;
      }

      const adminRoleId = adminRole[0].id;
      console.log(`🔑 Processing Admin role ${adminRoleId} for tenant ${tenant.id}`);

      // Get all Contract permissions
      const contractPerms = await AppDataSource.query(
        `SELECT id FROM rbac_permissions 
         WHERE entity_registry_id = ?`,
        [contractEntityId]
      );

      for (const perm of contractPerms) {
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
          console.log(`  ✅ Assigned permission ${perm.id}`);
        }
      }

      console.log(`✅ Assigned all Contract permissions to Admin role\n`);
    }

    console.log('✅ All permissions added successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

addContractPermissions()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
