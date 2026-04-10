import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { seedModulePermissions } from './seed-module-permissions';

async function seedUsersPermissions(tenantId?: string) {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    await seedModulePermissions(AppDataSource, {
      moduleName: 'User Management',
      moduleCode: 'users',
      entityCode: 'User',
      description: 'Module for managing users and user accounts',
      actions: ['ViewMenu', 'read', 'write', 'delete'],
      tenantId: tenantId,
    });
  } catch (error) {
    console.error('❌ Failed:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  const tenantId = process.argv[2];
  seedUsersPermissions(tenantId)
    .then(() => {
      console.log('✅ User Management permissions created');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}

export { seedUsersPermissions };
