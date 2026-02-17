import { AppDataSource } from '../data-source';
import { Permission } from '../../entities/rbac/permission.entity';
import { Role } from '../../entities/rbac/role.entity';
import { RolePermission } from '../../entities/rbac/role-permission.entity';
import { EntityRegistry } from '../../entities/entity-registry/entity-registry.entity';

async function assignUserPermissionsToAdmin() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔄 Assigning User permissions to Admin role...\n');

    const permissionRepo = AppDataSource.getRepository(Permission);
    const roleRepo = AppDataSource.getRepository(Role);
    const rolePermissionRepo = AppDataSource.getRepository(RolePermission);
    const entityRegistryRepo = AppDataSource.getRepository(EntityRegistry);

    // Get Admin role
    const adminRole = await roleRepo.findOne({
      where: { name: 'Admin' }
    });

    if (!adminRole) {
      console.log('❌ Admin role not found');
      return;
    }

    console.log(`Found Admin role: ${adminRole.id}`);

    // Get User entity from registry
    const userEntity = await entityRegistryRepo.findOne({
      where: { code: 'User' }
    });

    if (!userEntity) {
      console.log('❌ User entity not found in registry');
      return;
    }

    // Get User permissions
    const userPermissions = await permissionRepo.find({
      where: { entity_registry_id: userEntity.id }
    });

    console.log(`Found ${userPermissions.length} User permissions\n`);

    // Assign each permission to Admin role
    for (const permission of userPermissions) {
      const existing = await rolePermissionRepo.findOne({
        where: { role_id: adminRole.id, permission_id: permission.id }
      });

      if (!existing) {
        const rolePermission = rolePermissionRepo.create({
          role_id: adminRole.id,
          permission_id: permission.id
        });
        await rolePermissionRepo.save(rolePermission);
        console.log(`✅ Assigned: User:${permission.action}`);
      } else {
        console.log(`⏭️  Already assigned: User:${permission.action}`);
      }
    }

    console.log('\n✅ User permissions assigned to Admin role successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

assignUserPermissionsToAdmin()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
