import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Permission } from '../../entities/rbac/permission.entity';
import { EntityRegistry } from '../../entities/entity-registry/entity-registry.entity';

/**
 * Script to add email permissions to the system
 */
export async function addEmailPermissions(dataSource: DataSource): Promise<void> {
  const permissionRepository = dataSource.getRepository(Permission);
  const entityRegistryRepository = dataSource.getRepository(EntityRegistry);

  // Ensure email entities are in registry
  const emailEntities = [
    { code: 'EmailThread', name: 'Email Thread Management' },
    { code: 'EmailMessage', name: 'Email Message Management' },
  ];

  const entityMap = new Map<string, EntityRegistry>();

  for (const entity of emailEntities) {
    let existing = await entityRegistryRepository.findOne({
      where: { code: entity.code }
    });
    
    if (!existing) {
      const newEntity = entityRegistryRepository.create(entity);
      await entityRegistryRepository.save(newEntity);
      existing = newEntity;
      console.log(`✅ Created entity registry entry: ${entity.code}`);
    }
    entityMap.set(entity.code, existing);
  }

  // Define email permissions
  const emailPermissions = [
    // EmailThread permissions
    { entity_code: 'EmailThread', action: 'Create', description: 'Create new email threads', is_system_permission: true },
    { entity_code: 'EmailThread', action: 'Read', description: 'View email threads', is_system_permission: true },
    { entity_code: 'EmailThread', action: 'Update', description: 'Update email threads', is_system_permission: true },
    { entity_code: 'EmailThread', action: 'Delete', description: 'Delete email threads', is_system_permission: true },
    { entity_code: 'EmailThread', action: 'Archive', description: 'Archive email threads', is_system_permission: true },

    // EmailMessage permissions
    { entity_code: 'EmailMessage', action: 'Create', description: 'Send email messages', is_system_permission: true },
    { entity_code: 'EmailMessage', action: 'Read', description: 'View email messages', is_system_permission: true },
    { entity_code: 'EmailMessage', action: 'Update', description: 'Update email messages', is_system_permission: true },
    { entity_code: 'EmailMessage', action: 'Delete', description: 'Delete email messages', is_system_permission: true },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const permissionData of emailPermissions) {
    const entityRegistry = entityMap.get(permissionData.entity_code);
    if (!entityRegistry) {
      console.warn(`⚠️  Entity registry not found for: ${permissionData.entity_code}`);
      continue;
    }

    const existing = await permissionRepository.findOne({
      where: {
        entity_registry_id: entityRegistry.id,
        action: permissionData.action,
      }
    });

    if (!existing) {
      const permission = permissionRepository.create({
        entity_registry_id: entityRegistry.id,
        action: permissionData.action,
        description: permissionData.description,
        is_system_permission: permissionData.is_system_permission,
      });
      await permissionRepository.save(permission);
      createdCount++;
      console.log(`✅ Created permission: ${permissionData.entity_code}:${permissionData.action}`);
    } else {
      skippedCount++;
    }
  }

  console.log(`\n🎉 Email permissions setup completed!`);
  console.log(`✅ Created: ${createdCount} permissions`);
  console.log(`⏭️  Skipped: ${skippedCount} permissions (already exist)`);
}

/**
 * Run the script
 */
async function runEmailPermissionsScript(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    await addEmailPermissions(AppDataSource);
  } catch (error) {
    console.error('❌ Error adding email permissions:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Allow running this script directly
if (require.main === module) {
  runEmailPermissionsScript()
    .then(() => {
      console.log('✅ Email permissions setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Email permissions setup failed:', error);
      process.exit(1);
    });
}
