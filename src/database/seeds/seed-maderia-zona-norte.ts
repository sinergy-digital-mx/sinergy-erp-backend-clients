// src/database/seeds/seed-maderia-zona-norte.ts
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
import * as bcrypt from 'bcrypt';

async function seed() {
  await AppDataSource.initialize();

  const tenantRepo = AppDataSource.getRepository(RBACTenant);
  const userRepo = AppDataSource.getRepository(User);
  const statusRepo = AppDataSource.getRepository(UserStatus);
  const roleRepo = AppDataSource.getRepository(Role);
  const userRoleRepo = AppDataSource.getRepository(UserRole);
  const moduleRepo = AppDataSource.getRepository(Module);
  const tenantModuleRepo = AppDataSource.getRepository(TenantModule);

  try {
    console.log('🌳 Iniciando seed para Maderia Zona Norte...\n');

    // 1. Crear tenant
    console.log('📍 Creando tenant "Maderia Zona Norte"...');
    const tenant = await tenantRepo.save({
      name: 'Maderia Zona Norte',
      subdomain: 'maderia-zona-norte',
      is_active: true,
    });
    console.log(`✅ Tenant creado: ${tenant.id}\n`);

    // 2. Obtener o crear status "active"
    console.log('👤 Configurando status de usuario...');
    let activeStatus = await statusRepo.findOne({ where: { code: 'active' } });
    if (!activeStatus) {
      activeStatus = await statusRepo.save({
        code: 'active',
        name: 'Active',
      });
    }
    console.log(`✅ Status "active" listo\n`);

    // 3. Crear usuario super admin
    console.log('🔐 Creando usuario super admin...');
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const adminUser = await userRepo.save({
      email: 'admin@maderia-zona-norte.com',
      password: hashedPassword,
      first_name: 'Admin',
      last_name: 'Maderia',
      tenant_id: tenant.id,
      status: activeStatus,
      language_code: 'es',
    });
    console.log(`✅ Usuario creado: ${adminUser.email}\n`);

    // 4. Crear o obtener rol Admin
    console.log('👑 Configurando rol Admin...');
    let adminRole = await roleRepo.findOne({
      where: { name: 'Admin', tenant_id: tenant.id },
    });
    if (!adminRole) {
      adminRole = await roleRepo.save({
        name: 'Admin',
        description: 'Full access to all entities and actions',
        tenant_id: tenant.id,
        is_system_role: true,
        is_admin: true,
      });
    }
    console.log(`✅ Rol Admin listo\n`);

    // 5. Asignar rol Admin al usuario
    console.log('🔗 Asignando rol Admin al usuario...');
    await userRoleRepo.save({
      user_id: adminUser.id,
      role_id: adminRole.id,
      tenant_id: tenant.id,
    });
    console.log(`✅ Rol asignado\n`);

    // 6. Obtener todos los módulos
    console.log('📦 Configurando módulos...');
    const allModules = await moduleRepo.find();
    console.log(`📊 Total de módulos disponibles: ${allModules.length}\n`);

    // Módulos a DESACTIVAR
    const modulesToDisable = ['Contracts', 'Lots', 'Leads'];

    // Módulos a ACTIVAR (todos excepto los desactivados)
    const modulesToEnable = allModules.filter(
      m => !modulesToDisable.includes(m.name)
    );

    console.log(`✅ Módulos a ACTIVAR (${modulesToEnable.length}):`);
    for (const mod of modulesToEnable) {
      console.log(`   - ${mod.name} (${mod.code})`);
      await tenantModuleRepo.save({
        tenant_id: tenant.id,
        module_id: mod.id,
        is_enabled: true,
      });
    }

    console.log(`\n❌ Módulos a DESACTIVAR (${modulesToDisable.length}):`);
    for (const modName of modulesToDisable) {
      const mod = allModules.find(m => m.name === modName);
      if (mod) {
        console.log(`   - ${mod.name} (${mod.code})`);
        // Crear registro desactivado
        await tenantModuleRepo.save({
          tenant_id: tenant.id,
          module_id: mod.id,
          is_enabled: false,
        });
      }
    }

    console.log('\n✅ Seed completado exitosamente!\n');
    console.log('📋 Resumen:');
    console.log(`   Tenant: Maderia Zona Norte (${tenant.subdomain})`);
    console.log(`   Usuario Admin: admin@maderia-zona-norte.com`);
    console.log(`   Contraseña: Admin123!`);
    console.log(`   Módulos Activos: ${modulesToEnable.length}`);
    console.log(`   Módulos Inactivos: ${modulesToDisable.length}`);
    console.log('\n🎉 ¡Listo para usar!\n');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

seed()
  .then(() => {
    console.log('✅ Seed completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed falló:', error);
    process.exit(1);
  });
