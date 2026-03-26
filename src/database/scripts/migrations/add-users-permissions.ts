import { AppDataSource } from '../data-source';
import { Permission } from '../../entities/rbac/permission.entity';
import { EntityRegistry } from '../../entities/entity-registry/entity-registry.entity';

async function addUserPermissions() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔄 Adding User permissions...\n');

    const permissionRepo = AppDataSource.getRepository(Permission);
    const entityRegistryRepo = AppDataSource.getRepository(EntityRegistry);

    // Get User entity from registry (should already exist from seed)
    let userEntity = await entityRegistryRepo.findOne({
      where: { code: 'User' }
    });

    if (!userEntity) {
      userEntity = entityRegistryRepo.create({
        code: 'User',
        name: 'User Management'
      });
      await entityRegistryRepo.save(userEntity);
      console.log('✅ Added User to entity_registry');
    } else {
      console.log('⏭️  User already in entity_registry');
    }

    // Add user permissions
    const permissionsToAdd = [
      { action: 'Create', description: 'Create new users' },
      { action: 'Read', description: 'View users' },
      { action: 'Update', description: 'Edit users' },
      { action: 'Delete', description: 'Delete users' },
    ];

    for (const perm of permissionsToAdd) {
      const existing = await permissionRepo.findOne({
        where: { entity_registry_id: userEntity.id, action: perm.action }
      });

      if (!existing) {
        const permission = permissionRepo.create({
          action: perm.action,
          description: perm.description,
          is_system_permission: true,
          entity_registry_id: userEntity.id
        });
        await permissionRepo.save(permission);
        console.log(`✅ Added permission: User:${perm.action}`);
      } else {
        console.log(`⏭️  Permission already exists: User:${perm.action}`);
      }
    }

    console.log('\n✅ User permissions added successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

addUserPermissions()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
