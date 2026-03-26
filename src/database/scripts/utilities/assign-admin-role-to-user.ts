import { AppDataSource } from '../data-source';
import { Role } from '../../entities/rbac/role.entity';
import { UserRole } from '../../entities/rbac/user-role.entity';

async function assignAdminRoleToUser() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔄 Assigning Admin role to user 763b6ebe-fb57-11f0-a52e-06e7ea787385...\n');

    const roleRepo = AppDataSource.getRepository(Role);
    const userRoleRepo = AppDataSource.getRepository(UserRole);

    const userId = '763b6ebe-fb57-11f0-a52e-06e7ea787385';
    const tenantId = '54481b63-5516-458d-9bb3-d4e5cb028864';

    // Get Admin role
    const adminRole = await roleRepo.findOne({
      where: { name: 'Admin', tenant_id: tenantId }
    });

    if (!adminRole) {
      console.log('❌ Admin role not found in this tenant');
      return;
    }

    console.log(`Found Admin role: ${adminRole.id}`);

    // Check if user already has Admin role
    const existing = await userRoleRepo.findOne({
      where: { user_id: userId, role_id: adminRole.id, tenant_id: tenantId }
    });

    if (existing) {
      console.log('⏭️  User already has Admin role');
    } else {
      // Assign Admin role to user
      const userRole = userRoleRepo.create({
        user_id: userId,
        role_id: adminRole.id,
        tenant_id: tenantId
      });
      await userRoleRepo.save(userRole);
      console.log(`✅ Assigned Admin role to user ${userId}`);
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

assignAdminRoleToUser()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
