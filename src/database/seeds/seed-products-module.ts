// src/database/seeds/seed-products-module.ts
import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { Module as ModuleEntity } from '../../entities/rbac/module.entity';
import { Permission } from '../../entities/rbac/permission.entity';
import { EntityRegistry } from '../../entities/entity-registry/entity-registry.entity';
import { TenantModule } from '../../entities/rbac/tenant-module.entity';
import { RBACTenant } from '../../entities/rbac/tenant.entity';
import { Role } from '../../entities/rbac/role.entity';
import { RolePermission } from '../../entities/rbac/role-permission.entity';

async function seedProductsModule() {
  await AppDataSource.initialize();

  const moduleRepo = AppDataSource.getRepository(ModuleEntity);
  const permissionRepo = AppDataSource.getRepository(Permission);
  const entityRegistryRepo = AppDataSource.getRepository(EntityRegistry);
  const tenantModuleRepo = AppDataSource.getRepository(TenantModule);
  const tenantRepo = AppDataSource.getRepository(RBACTenant);
  const roleRepo = AppDataSource.getRepository(Role);
  const rolePermissionRepo = AppDataSource.getRepository(RolePermission);

  try {
    console.log('🌱 Iniciando seed del módulo Products...\n');

    // 1. Crear EntityRegistry
    console.log('📋 Creando EntityRegistry...');
    let entityRegistry = await entityRegistryRepo.findOne({
      where: { code: 'Product' },
    });

    if (!entityRegistry) {
      entityRegistry = entityRegistryRepo.create({
        code: 'Product',
        name: 'Gestión de Productos',
      });
      await entityRegistryRepo.save(entityRegistry);
      console.log('✅ EntityRegistry creado');
    } else {
      console.log('✅ EntityRegistry ya existe');
    }

    // 2. Crear Módulo
    console.log('\n📦 Creando módulo...');
    let module = await moduleRepo.findOne({
      where: { code: 'products' },
    });

    if (!module) {
      module = moduleRepo.create({
        name: 'Gestión de Productos',
        code: 'products',
        description: 'Módulo para gestionar productos del catálogo',
      });
      await moduleRepo.save(module);
      console.log('✅ Módulo creado');
    } else {
      console.log('✅ Módulo ya existe');
    }

    // 3. Crear Permisos
    console.log('\n🔐 Creando permisos...');
    const actions = [
      { action: 'Create', description: 'Crear productos' },
      { action: 'Read', description: 'Ver productos' },
      { action: 'Update', description: 'Actualizar productos' },
      { action: 'Delete', description: 'Eliminar productos' },
      { action: 'Export', description: 'Descargar catálogo de productos' },
    ];

    let createdPermissions = 0;
    for (const { action, description } of actions) {
      const existing = await permissionRepo.findOne({
        where: {
          entity_registry_id: entityRegistry.id,
          action,
        },
      });

      if (!existing) {
        const permission = permissionRepo.create({
          entity_registry_id: entityRegistry.id,
          module_id: module.id,
          action,
          description,
          is_system_permission: true,
        });
        await permissionRepo.save(permission);
        console.log(`   ✅ Permiso creado: Product:${action}`);
        createdPermissions++;
      } else {
        console.log(`   ⏭️  Permiso ya existe: Product:${action}`);
      }
    }

    const exportPermission = await permissionRepo.findOne({
      where: {
        entity_registry_id: entityRegistry.id,
        action: 'Export',
      },
    });

    if (exportPermission) {
      console.log('\n👤 Asignando Product:Export a roles admin...');
      const adminRoles = await roleRepo.find({ where: { is_admin: true } });
      let assigned = 0;
      for (const role of adminRoles) {
        const existing = await rolePermissionRepo.findOne({
          where: {
            role_id: role.id,
            permission_id: exportPermission.id,
          },
        });
        if (!existing) {
          await rolePermissionRepo.save(
            rolePermissionRepo.create({
              role_id: role.id,
              permission_id: exportPermission.id,
            }),
          );
          assigned++;
          console.log(`   ✅ Asignado a rol admin: ${role.name}`);
        }
      }
      console.log(`   Roles actualizados: ${assigned}`);
    }

    // 4. Habilitar para todos los tenants
    console.log('\n🏢 Habilitando módulo para todos los tenants...');
    const allTenants = await tenantRepo.find();
    let enabledCount = 0;

    for (const tenant of allTenants) {
      const existing = await tenantModuleRepo.findOne({
        where: {
          tenant_id: tenant.id,
          module_id: module.id,
        },
      });

      if (!existing) {
        const tenantModule = tenantModuleRepo.create({
          tenant_id: tenant.id,
          module_id: module.id,
          is_enabled: true,
        });
        await tenantModuleRepo.save(tenantModule);
        console.log(`   ✅ Habilitado para: ${tenant.name}`);
        enabledCount++;
      } else {
        console.log(`   ⏭️  Ya habilitado para: ${tenant.name}`);
      }
    }

    console.log('\n✅ Seed completado exitosamente!\n');
    console.log('📋 Resumen:');
    console.log(`   Módulo: Gestión de Productos (products)`);
    console.log(`   Permisos creados: ${createdPermissions}`);
    console.log(`   Tenants habilitados: ${enabledCount}`);
    console.log('\n🎉 Módulo listo para usar!\n');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

seedProductsModule()
  .then(() => {
    console.log('✅ Seed completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed falló:', error);
    process.exit(1);
  });
