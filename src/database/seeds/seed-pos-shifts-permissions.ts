import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { seedModulePermissions } from './seed-module-permissions';

async function seedPosShiftsPermissions(tenantId?: string) {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    await seedModulePermissions(AppDataSource, {
      moduleName: 'POS Shifts',
      moduleCode: 'pos-shifts',
      entityCode: 'PosShift',
      description: 'Module for managing POS daily shifts and partial cash removals',
      actions: ['ViewMenu', 'Create', 'Read', 'Update'],
      tenantId,
    });
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  const tenantId = process.argv[2];
  seedPosShiftsPermissions(tenantId)
    .then(() => {
      console.log('✅ POS Shifts permissions created');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}

export { seedPosShiftsPermissions };
