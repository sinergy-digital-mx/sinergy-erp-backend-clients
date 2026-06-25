import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { RBACTenant } from '../../entities/rbac/tenant.entity';
import { User } from '../../entities/users/user.entity';
import { UserStatus } from '../../entities/users/user-status.entity';
import { Role } from '../../entities/rbac/role.entity';
import { UserRole } from '../../entities/rbac/user-role.entity';
import { Module } from '../../entities/rbac/module.entity';
import { TenantModule } from '../../entities/rbac/tenant-module.entity';
import { Permission } from '../../entities/rbac/permission.entity';
import { RolePermission } from '../../entities/rbac/role-permission.entity';
import * as bcrypt from 'bcrypt';

const TENANT_NAME = 'Verduleria';
const TENANT_SUBDOMAIN = 'verduleria';
const USER_PASSWORD = '123';
const ADMIN_USERS = [
  { email: 'rrv@gmail.com', firstName: 'Admin', lastName: 'Verduleria' },
  { email: 'rodolfo@pruebas.com', firstName: 'Rodolfo', lastName: 'Pruebas' },
];

function isDashboardModule(module: Module): boolean {
  return (
    module.code.toLowerCase().includes('dashboard') ||
    module.name.toLowerCase().includes('dashboard')
  );
}

async function seed() {
  await AppDataSource.initialize();

  const tenantRepo = AppDataSource.getRepository(RBACTenant);
  const userRepo = AppDataSource.getRepository(User);
  const statusRepo = AppDataSource.getRepository(UserStatus);
  const roleRepo = AppDataSource.getRepository(Role);
  const userRoleRepo = AppDataSource.getRepository(UserRole);
  const moduleRepo = AppDataSource.getRepository(Module);
  const tenantModuleRepo = AppDataSource.getRepository(TenantModule);
  const permissionRepo = AppDataSource.getRepository(Permission);
  const rolePermissionRepo = AppDataSource.getRepository(RolePermission);

  try {
    console.log('🥬 Iniciando seed para Verduleria...\n');

    let tenant = await tenantRepo.findOne({ where: { subdomain: TENANT_SUBDOMAIN } });
    if (tenant) {
      console.log(`⏭️  Tenant ya existe: ${tenant.id}\n`);
    } else {
      console.log(`📍 Creando tenant "${TENANT_NAME}"...`);
      tenant = await tenantRepo.save({
        name: TENANT_NAME,
        subdomain: TENANT_SUBDOMAIN,
        is_active: true,
      });
      console.log(`✅ Tenant creado: ${tenant.id}\n`);
    }

    let activeStatus = await statusRepo.findOne({ where: { code: 'active' } });
    if (!activeStatus) {
      activeStatus = await statusRepo.save({
        code: 'active',
        name: 'Active',
      });
    }

    let adminRole = await roleRepo.findOne({
      where: { name: 'Admin', tenant_id: tenant.id },
    });
    if (!adminRole) {
      console.log('👑 Creando rol Admin...');
      adminRole = await roleRepo.save({
        name: 'Admin',
        description: 'Full access to all entities and actions',
        tenant_id: tenant.id,
        is_system_role: true,
        is_admin: true,
      });
      console.log(`✅ Rol Admin creado\n`);
    }

    for (const adminUserConfig of ADMIN_USERS) {
      let adminUser = await userRepo.findOne({ where: { email: adminUserConfig.email } });
      if (adminUser) {
        console.log(`⏭️  Usuario ya existe: ${adminUser.email}`);
      } else {
        console.log(`🔐 Creando usuario admin: ${adminUserConfig.email}...`);
        const hashedPassword = await bcrypt.hash(USER_PASSWORD, 10);
        adminUser = await userRepo.save({
          email: adminUserConfig.email,
          password: hashedPassword,
          first_name: adminUserConfig.firstName,
          last_name: adminUserConfig.lastName,
          tenant_id: tenant.id,
          status: activeStatus,
          language_code: 'es',
        });
        console.log(`✅ Usuario creado: ${adminUser.email}`);
      }

      const existingUserRole = await userRoleRepo.findOne({
        where: {
          user_id: adminUser.id,
          role_id: adminRole.id,
          tenant_id: tenant.id,
        },
      });
      if (!existingUserRole) {
        await userRoleRepo.save({
          user_id: adminUser.id,
          role_id: adminRole.id,
          tenant_id: tenant.id,
        });
        console.log(`✅ Rol Admin asignado a ${adminUser.email}`);
      }
    }
    console.log('');

    console.log('🔑 Asignando permisos al rol Admin...');
    const allPermissions = await permissionRepo.find();
    let assignedCount = 0;
    for (const permission of allPermissions) {
      const existing = await rolePermissionRepo.findOne({
        where: { role_id: adminRole.id, permission_id: permission.id },
      });
      if (!existing) {
        await rolePermissionRepo.save({
          role_id: adminRole.id,
          permission_id: permission.id,
        });
        assignedCount++;
      }
    }
    console.log(`✅ ${assignedCount} permisos asignados (${allPermissions.length} total)\n`);

    if (assignedCount > 0) {
      await userRepo.increment({ tenant_id: tenant.id }, 'permissions_version', 1);
    }

    const allModules = await moduleRepo.find();
    const modulesToEnable = allModules.filter(m => !isDashboardModule(m));
    const modulesToDisable = allModules.filter(m => isDashboardModule(m));

    console.log(`📦 Módulos a activar (${modulesToEnable.length}):`);
    for (const mod of modulesToEnable) {
      const existing = await tenantModuleRepo.findOne({
        where: { tenant_id: tenant.id, module_id: mod.id },
      });
      if (existing) {
        if (!existing.is_enabled) {
          existing.is_enabled = true;
          await tenantModuleRepo.save(existing);
        }
        console.log(`   ⏭️  ${mod.name} (${mod.code})`);
        continue;
      }
      await tenantModuleRepo.save({
        tenant_id: tenant.id,
        module_id: mod.id,
        is_enabled: true,
      });
      console.log(`   ✅ ${mod.name} (${mod.code})`);
    }

    if (modulesToDisable.length > 0) {
      console.log(`\n❌ Módulos dashboard excluidos (${modulesToDisable.length}):`);
      for (const mod of modulesToDisable) {
        const existing = await tenantModuleRepo.findOne({
          where: { tenant_id: tenant.id, module_id: mod.id },
        });
        if (!existing) {
          await tenantModuleRepo.save({
            tenant_id: tenant.id,
            module_id: mod.id,
            is_enabled: false,
          });
        }
        console.log(`   - ${mod.name} (${mod.code})`);
      }
    }

    console.log('\n✅ Seed completado exitosamente!\n');
    console.log('📋 Resumen:');
    console.log(`   Tenant: ${TENANT_NAME} (${TENANT_SUBDOMAIN})`);
    console.log(`   Tenant ID: ${tenant.id}`);
    console.log(`   Usuarios admin:`);
    for (const adminUserConfig of ADMIN_USERS) {
      console.log(`     - ${adminUserConfig.email} / ${USER_PASSWORD}`);
    }
    console.log(`   Módulos activos: ${modulesToEnable.length}`);
    console.log(`   Módulos dashboard excluidos: ${modulesToDisable.length}`);
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

seed()
  .then(() => {
    console.log('\n🎉 ¡Listo para usar!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed falló:', error);
    process.exit(1);
  });
