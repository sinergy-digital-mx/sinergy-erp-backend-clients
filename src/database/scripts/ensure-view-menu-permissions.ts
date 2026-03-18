import { AppDataSource } from '../data-source';
import { Module } from '../../entities/rbac/module.entity';
import { Permission } from '../../entities/rbac/permission.entity';
import { EntityRegistry } from '../../entities/entity-registry/entity-registry.entity';

async function ensureViewMenuPermissions() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    // Get all modules
    const allModules = await AppDataSource.manager.find(Module);
    console.log(`\n📦 Found ${allModules.length} modules`);

    // Get or create entity registry entries for each module
    const entityRegistryMap = new Map<string, any>();

    for (const module of allModules) {
      let entity = await AppDataSource.manager.findOne(EntityRegistry, {
        where: { code: module.code },
      });

      if (!entity) {
        entity = AppDataSource.manager.create(EntityRegistry, {
          code: module.code,
          name: module.name,
        });
        await AppDataSource.manager.save(entity);
        console.log(`✅ Created EntityRegistry for: ${module.code}`);
      }

      entityRegistryMap.set(module.code, entity);
    }

    // Check and create ViewMenu permission for each module
    console.log('\n🔍 Checking ViewMenu permissions...');

    for (const module of allModules) {
      const existing = await AppDataSource.manager.findOne(Permission, {
        where: {
          module_id: module.id,
          action: 'ViewMenu',
        },
      });

      if (!existing) {
        const entity = entityRegistryMap.get(module.code);
        const permission = AppDataSource.manager.create(Permission, {
          module_id: module.id,
          action: 'ViewMenu',
          description: `View ${module.name} menu`,
          entity_registry_id: entity.id,
          is_system_permission: true,
        });
        await AppDataSource.manager.save(permission);
        console.log(`✅ Created ViewMenu permission for: ${module.name}`);
      } else {
        console.log(`ℹ️  ViewMenu permission already exists for: ${module.name}`);
      }
    }

    console.log('\n✅ All modules now have ViewMenu permissions');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

ensureViewMenuPermissions();
