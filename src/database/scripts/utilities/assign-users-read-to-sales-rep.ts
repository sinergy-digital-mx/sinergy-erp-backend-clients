import { AppDataSource } from '../data-source';
import { Permission } from '../../entities/rbac/permission.entity';
import { Role } from '../../entities/rbac/role.entity';
import { RolePermission } from '../../entities/rbac/role-permission.entity';
import { EntityRegistry } from '../../entities/entity-registry/entity-registry.entity';

async function assignUserReadToSalesRep() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔄 Assigning User:Read permission to Sales Representative role...\n');

    const permissionRepo = AppDataSource.getRepository(Permission);
    const roleRepo = AppDataSource.getRepository(Role);
    const rolePermissionRepo = AppDataSource.getRepository(RolePermission);
    const entityRegistryRepo = AppDataSource.getRepository(EntityRegistry);

    // Get Sales Representative role
    const salesRepRole = await roleRepo.findOne({
      where: { name: 'Sales Representative' }
    });

    if (!salesRepRole) {
      console.log('❌ Sales Representative role not found');
      return;
    }

    console.log(`Found Sales Representative role: ${salesRepRole.id}`);

    // Get User entity from registry
    const userEntity = await entityRegistryRepo.findOne({
      where: { code: 'User' }
    });

    if (!userEntity) {
      console.log('❌ User entity not found in registry');
      return;
    }

    // Get User:Read permission
    const userReadPermission = await permissionRepo.findOne({
      where: { entity_registry_id: userEntity.id, action: 'Read' }
    });

    if (!userReadPermission) {
      console.log('❌ User:Read permission not found');
      return;
    }

    console.log(`Found User:Read permission: ${userReadPermission.id}\n`);

    // Assign permission to Sales Representative role
    const existing = await rolePermissionRepo.findOne({
      where: { role_id: salesRepRole.id, permission_id: userReadPermission.id }
    });

    if (!existing) {
      const rolePermission = rolePermissionRepo.create({
        role_id: salesRepRole.id,
        permission_id: userReadPermission.id
      });
      await rolePermissionRepo.save(rolePermission);
      console.log(`✅ Assigned: User:Read to Sales Representative role`);
    } else {
      console.log(`⏭️  Already assigned: User:Read to Sales Representative role`);
    }

    console.log('\n✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

assignUserReadToSalesRep()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
