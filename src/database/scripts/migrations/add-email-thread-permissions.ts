import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

async function addEmailThreadPermissions() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔧 Adding EmailThread and EmailMessage permissions...\n');

    // Get the entity registry IDs
    const emailThreadEntity = await AppDataSource.query(
      `SELECT id FROM entity_registry WHERE code = 'EmailThread'`
    );
    const emailMessageEntity = await AppDataSource.query(
      `SELECT id FROM entity_registry WHERE code = 'EmailMessage'`
    );

    if (!emailThreadEntity.length || !emailMessageEntity.length) {
      throw new Error('EmailThread or EmailMessage entity not found in registry');
    }

    const emailThreadId = emailThreadEntity[0].id;
    const emailMessageId = emailMessageEntity[0].id;

    console.log(`✅ Found EmailThread entity ID: ${emailThreadId}`);
    console.log(`✅ Found EmailMessage entity ID: ${emailMessageId}\n`);

    // Define permissions to add (global, not tenant-specific)
    const permissions = [
      { entity_registry_id: emailThreadId, action: 'Create' },
      { entity_registry_id: emailThreadId, action: 'Read' },
      { entity_registry_id: emailThreadId, action: 'Update' },
      { entity_registry_id: emailThreadId, action: 'Delete' },
      { entity_registry_id: emailMessageId, action: 'Create' },
      { entity_registry_id: emailMessageId, action: 'Read' },
      { entity_registry_id: emailMessageId, action: 'Update' },
      { entity_registry_id: emailMessageId, action: 'Delete' },
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

      const result = await AppDataSource.query(
        `INSERT INTO rbac_permissions (entity_registry_id, action, created_at, updated_at)
         VALUES (?, ?, NOW(), NOW())`,
        [perm.entity_registry_id, perm.action]
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

      // Get all EmailThread and EmailMessage permissions
      const emailPerms = await AppDataSource.query(
        `SELECT id FROM rbac_permissions 
         WHERE entity_registry_id IN (?, ?)`,
        [emailThreadId, emailMessageId]
      );

      for (const perm of emailPerms) {
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

      console.log(`✅ Assigned all EmailThread/EmailMessage permissions to Admin role\n`);
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

addEmailThreadPermissions()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
