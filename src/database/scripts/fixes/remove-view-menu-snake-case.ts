import { AppDataSource } from '../data-source';
import { Permission } from '../../entities/rbac/permission.entity';

async function removeViewMenuSnakeCase() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    // Find all View_Menu permissions (snake_case)
    const viewMenuPermissions = await AppDataSource.manager.find(Permission, {
      where: { action: 'View_Menu' },
    });

    console.log(`\n🔍 Found ${viewMenuPermissions.length} View_Menu (snake_case) permissions`);

    if (viewMenuPermissions.length > 0) {
      // Delete them
      await AppDataSource.manager.remove(viewMenuPermissions);
      console.log(`✅ Deleted ${viewMenuPermissions.length} View_Menu permissions`);
    }

    console.log('\n✅ Cleanup completed');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

removeViewMenuSnakeCase();
