import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { seedModulePermissions } from './seed-module-permissions';

async function seedPosConfigurationPermissions(tenantId?: string) {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    await seedModulePermissions(AppDataSource, {
      moduleName: 'POS Configuration',
      moduleCode: 'pos-configuration',
      entityCode: 'pos_configuration',
      description: 'Module for managing point of sale configuration and settings',
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
  seedPosConfigurationPermissions(tenantId)
    .then(() => {
      console.log('✅ POS Configuration permissions created');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}

export { seedPosConfigurationPermissions };
