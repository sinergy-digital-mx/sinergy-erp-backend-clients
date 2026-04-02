// src/database/seeds/assign-all-modules-to-user.ts
import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { RBACTenant } from '../../entities/rbac/tenant.entity';
import { User } from '../../entities/users/user.entity';
import { Role } from '../../entities/rbac/role.entity';
import { UserRole } from '../../entities/rbac/user-role.entity';
import { Module } from '../../entities/rbac/module.entity';
import { TenantModule } from '../../entities/rbac/tenant-module.entity';
import { Permission } from '../../entities/rbac/permission.entity';
import { RolePermission } from '../../entities/rbac/role-permission.entity';

const TENANT_ID = 'afff1757-dbcf-4715-a756-6b22bb2c59d5';
const USER_ID = '95acc142-ec8f-4928-96ba-f715431709c0';

async function assignAllModulesToUser() {
  await AppDataSource.initialize();

  const tenantRepo = AppDataSource.getRepository(RBACTenant);
  const userRepo = AppDataSource.getRepository(User);
  const roleRepo = AppDataSource.getRepository(Role);
  const userRoleRepo = AppDataSource.getRepository(UserRole);
  const moduleRepo = AppDataSource.getRepository(Module);
  const tenantModuleRepo = AppDataSource.getRepository(TenantModule);
  const permissionRepo = AppDataSource.getRepository(Permission);
  const rolePermissionRepo = AppDataSource.getRepository(RolePermission);

  try {
    console.log('🚀 Iniciando asignación de todos los módulos al usuario...\n');

    // 1. Verificar que el tenant existe
    console.log('📍 Verificando tenant...');
    const tenant = await tenantRepo.findOne({ where: { id: TENANT_ID } });
    if (!tenant) {
      throw new Error(`❌ Tenant con ID ${TENANT_ID} no encontrado`);
    }
    console.log(`✅ Tenant encontrado: ${tenant.name} (${tenant.subdomain})\n`);

    // 2. Verificar que el usuario existe
    console.log('👤 Verificando usuario...');
    const user = await userRepo.findOne({ where: { id: USER_ID } });
    if (!user) {
      throw new Error(`❌ Usuario con ID ${USER_ID} no encontrado`);
    }
    console.log(`✅ Usuario encontrado: ${user.email}\n`);

    // 3. Crear o obtener rol Admin
    console.log('👑 Configurando rol Admin...');
    let adminRole = await roleRepo.findOne({
      where: { name: 'Admin', tenant_id: TENANT_ID },
    });
    
    if (!adminRole) {
      adminRole = await roleRepo.save({
        name: 'Admin',
        description: 'Full access to all entities and actions',
        tenant_id: TENANT_ID,
        is_system_role: true,
        is_admin: true,
      });
      console.log('✅ Rol Admin creado');
    } else {
      console.log('✅ Rol Admin ya existe');
    }

    // 4. Asignar rol Admin al usuario (si no lo tiene)
    console.log('\n🔗 Asignando rol Admin al usuario...');
    const existingUserRole = await userRoleRepo.findOne({
      where: {
        user_id: USER_ID,
        role_id: adminRole.id,
        tenant_id: TENANT_ID,
      },
    });

    if (!existingUserRole) {
      await userRoleRepo.save({
        user_id: USER_ID,
        role_id: adminRole.id,
        tenant_id: TENANT_ID,
      });
      console.log('✅ Rol Admin asignado al usuario');
    } else {
      console.log('✅ Usuario ya tiene el rol Admin');
    }

    // 5. Obtener todos los módulos
    console.log('\n📦 Obteniendo todos los módulos...');
    const allModules = await moduleRepo.find();
    console.log(`📊 Total de módulos disponibles: ${allModules.length}\n`);

    // 6. Habilitar todos los módulos para el tenant
    console.log('🔓 Habilitando todos los módulos para el tenant...');
    let enabledCount = 0;
    let alreadyEnabledCount = 0;

    for (const module of allModules) {
      const existingTenantModule = await tenantModuleRepo.findOne({
        where: {
          tenant_id: TENANT_ID,
          module_id: module.id,
        },
      });

      if (!existingTenantModule) {
        await tenantModuleRepo.save({
          tenant_id: TENANT_ID,
          module_id: module.id,
          is_enabled: true,
        });
        console.log(`   ✅ Habilitado: ${module.name} (${module.code})`);
        enabledCount++;
      } else if (!existingTenantModule.is_enabled) {
        existingTenantModule.is_enabled = true;
        await tenantModuleRepo.save(existingTenantModule);
        console.log(`   ✅ Activado: ${module.name} (${module.code})`);
        enabledCount++;
      } else {
        alreadyEnabledCount++;
      }
    }

    console.log(`\n📊 Módulos habilitados: ${enabledCount}`);
    console.log(`📊 Módulos ya habilitados: ${alreadyEnabledCount}`);

    // 7. Obtener todos los permisos
    console.log('\n🔐 Obteniendo todos los permisos...');
    const allPermissions = await permissionRepo.find();
    console.log(`📊 Total de permisos disponibles: ${allPermissions.length}\n`);

    // 8. Asignar todos los permisos al rol Admin
    console.log('🔑 Asignando todos los permisos al rol Admin...');
    let assignedCount = 0;
    let alreadyAssignedCount = 0;

    for (const permission of allPermissions) {
      const existingRolePermission = await rolePermissionRepo.findOne({
        where: {
          role_id: adminRole.id,
          permission_id: permission.id,
        },
      });

      if (!existingRolePermission) {
        await rolePermissionRepo.save({
          role_id: adminRole.id,
          permission_id: permission.id,
        });
        assignedCount++;
      } else {
        alreadyAssignedCount++;
      }
    }

    console.log(`\n📊 Permisos asignados: ${assignedCount}`);
    console.log(`📊 Permisos ya asignados: ${alreadyAssignedCount}`);

    console.log('\n✅ ¡Proceso completado exitosamente!\n');
    console.log('📋 Resumen:');
    console.log(`   Tenant: ${tenant.name} (${tenant.subdomain})`);
    console.log(`   Usuario: ${user.email}`);
    console.log(`   Rol: Admin (is_admin: true)`);
    console.log(`   Módulos habilitados: ${allModules.length}`);
    console.log(`   Permisos asignados: ${allPermissions.length}`);
    console.log('\n🎉 El usuario ahora tiene acceso completo a todos los módulos!\n');

  } catch (error) {
    console.error('❌ Error durante el proceso:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

assignAllModulesToUser()
  .then(() => {
    console.log('✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Proceso falló:', error);
    process.exit(1);
  });
