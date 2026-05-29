import { DataSource } from 'typeorm';
import { Module as ModuleEntity } from '../../entities/rbac/module.entity';
import { Permission } from '../../entities/rbac/permission.entity';
import { TenantModule } from '../../entities/rbac/tenant-module.entity';
import { EntityRegistry } from '../../entities/entity-registry/entity-registry.entity';
import { RBACTenant } from '../../entities/rbac/tenant.entity';
import { Role } from '../../entities/rbac/role.entity';
import { RolePermission } from '../../entities/rbac/role-permission.entity';

export async function seedEmailTemplatesModule(dataSource: DataSource): Promise<void> {
  const moduleRepository = dataSource.getRepository(ModuleEntity);
  const permissionRepository = dataSource.getRepository(Permission);
  const tenantModuleRepository = dataSource.getRepository(TenantModule);
  const entityRegistryRepository = dataSource.getRepository(EntityRegistry);
  const tenantRepository = dataSource.getRepository(RBACTenant);
  const roleRepository = dataSource.getRepository(Role);
  const rolePermissionRepository = dataSource.getRepository(RolePermission);

  let entity = await entityRegistryRepository.findOne({ where: { code: 'email-templates' } });
  if (!entity) {
    entity = await entityRegistryRepository.save(
      entityRegistryRepository.create({
        code: 'email-templates',
        name: 'Email Templates',
      }),
    );
  }

  let module = await moduleRepository.findOne({ where: { code: 'email-templates' } });
  if (!module) {
    module = await moduleRepository.save(
      moduleRepository.create({
        name: 'Email Templates',
        code: 'email-templates',
        description: 'Tenant email template management',
      }),
    );
  }

  const permissions = [
    { action: 'ViewMenu', description: 'Show Email Templates module in sidebar' },
    { action: 'Create', description: 'Create email templates' },
    { action: 'Read', description: 'Read email templates and available variables' },
    { action: 'Update', description: 'Update email templates' },
    { action: 'Delete', description: 'Delete email templates' },
  ];

  const savedPermissions: Permission[] = [];
  for (const item of permissions) {
    let permission = await permissionRepository.findOne({
      where: {
        entity_registry_id: entity.id,
        module_id: module.id,
        action: item.action,
      },
    });

    if (!permission) {
      permission = await permissionRepository.save(
        permissionRepository.create({
          entity_registry_id: entity.id,
          module_id: module.id,
          action: item.action,
          description: item.description,
          is_system_permission: true,
        }),
      );
    }

    savedPermissions.push(permission);
  }

  const tenants = await tenantRepository.find();
  for (const tenant of tenants) {
    const existingTenantModule = await tenantModuleRepository.findOne({
      where: {
        tenant_id: tenant.id,
        module_id: module.id,
      },
    });

    if (!existingTenantModule) {
      await tenantModuleRepository.save(
        tenantModuleRepository.create({
          tenant_id: tenant.id,
          module_id: module.id,
          is_enabled: true,
        }),
      );
    }

    const adminRole = await roleRepository.findOne({
      where: { tenant_id: tenant.id, name: 'Admin' },
    });
    if (!adminRole) {
      continue;
    }

    for (const permission of savedPermissions) {
      const existingRolePermission = await rolePermissionRepository.findOne({
        where: {
          role_id: adminRole.id,
          permission_id: permission.id,
        },
      });

      if (!existingRolePermission) {
        await rolePermissionRepository.save(
          rolePermissionRepository.create({
            role_id: adminRole.id,
            permission_id: permission.id,
          }),
        );
      }
    }
  }
}

export async function runEmailTemplatesModuleSeed(): Promise<void> {
  const { AppDataSource } = await import('../data-source.js');

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    await seedEmailTemplatesModule(AppDataSource);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  runEmailTemplatesModuleSeed()
    .then(() => {
      console.log('Email Templates module seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Email Templates module seed failed:', error);
      process.exit(1);
    });
}
