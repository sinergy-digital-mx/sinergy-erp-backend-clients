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

const TENANT_NAME = 'Vexia';
const TENANT_SUBDOMAIN = 'vexia';
const USER_PASSWORD = '123';
const ADMIN_USERS = [
  {
    email: 'rodolfo.rodriguez@vexia.com',
    firstName: 'Rodolfo',
    lastName: 'Rodriguez',
  },
  {
    email: 'carlo.rangel@vexia.com',
    firstName: 'Carlo',
    lastName: 'Rangel',
  },
];

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
    console.log('Iniciando seed para Vexia...\n');

    let tenant = await tenantRepo.findOne({ where: { subdomain: TENANT_SUBDOMAIN } });
    if (tenant) {
      console.log(`Organizacion ya existe: ${tenant.id}\n`);
    } else {
      console.log(`Creando organizacion "${TENANT_NAME}"...`);
      tenant = await tenantRepo.save({
        name: TENANT_NAME,
        subdomain: TENANT_SUBDOMAIN,
        is_active: true,
      });
      console.log(`Organizacion creada: ${tenant.id}\n`);
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
      console.log('Creando rol Admin...');
      adminRole = await roleRepo.save({
        name: 'Admin',
        description: 'Full access to all entities and actions',
        tenant_id: tenant.id,
        is_system_role: true,
        is_admin: true,
      });
      console.log('Rol Admin creado\n');
    }

    for (const adminUserConfig of ADMIN_USERS) {
      let adminUser = await userRepo.findOne({ where: { email: adminUserConfig.email } });
      if (adminUser) {
        if (adminUser.tenant_id !== tenant.id) {
          throw new Error(
            `El correo ${adminUserConfig.email} ya pertenece a otra organizacion (${adminUser.tenant_id})`,
          );
        }
        console.log(`Usuario ya existe: ${adminUser.email}`);
      } else {
        console.log(`Creando usuario admin: ${adminUserConfig.email}...`);
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
        console.log(`Usuario creado: ${adminUser.email}`);
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
        console.log(`Rol Admin asignado a ${adminUser.email}`);
      }
    }
    console.log('');

    console.log('Asignando permisos al rol Admin...');
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
    console.log(`${assignedCount} permisos asignados (${allPermissions.length} total)\n`);

    if (assignedCount > 0) {
      await userRepo.increment({ tenant_id: tenant.id }, 'permissions_version', 1);
    }

    const allModules = await moduleRepo.find();
    console.log(`Activando todos los modulos (${allModules.length}):`);
    let enabledCount = 0;
    for (const mod of allModules) {
      const existing = await tenantModuleRepo.findOne({
        where: { tenant_id: tenant.id, module_id: mod.id },
      });
      if (existing) {
        if (!existing.is_enabled) {
          existing.is_enabled = true;
          await tenantModuleRepo.save(existing);
          enabledCount++;
        }
        console.log(`   ${mod.name} (${mod.code})`);
        continue;
      }
      await tenantModuleRepo.save({
        tenant_id: tenant.id,
        module_id: mod.id,
        is_enabled: true,
      });
      enabledCount++;
      console.log(`   ${mod.name} (${mod.code})`);
    }

    console.log('\nSeed completado.\n');
    console.log('Resumen:');
    console.log(`   Organizacion: ${TENANT_NAME} (${TENANT_SUBDOMAIN})`);
    console.log(`   ID: ${tenant.id}`);
    console.log('   Usuarios admin:');
    for (const adminUserConfig of ADMIN_USERS) {
      console.log(`     - ${adminUserConfig.firstName} ${adminUserConfig.lastName} <${adminUserConfig.email}> / ${USER_PASSWORD}`);
    }
    console.log(`   Modulos activos: ${allModules.length}`);
    console.log(`   Modulos habilitados en esta corrida: ${enabledCount}`);
  } catch (error) {
    console.error('Error durante el seed:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

seed()
  .then(() => {
    console.log('\nListo.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed fallo:', error);
    process.exit(1);
  });
