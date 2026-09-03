import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { Module as ModuleEntity } from '../../entities/rbac/module.entity';
import { Permission } from '../../entities/rbac/permission.entity';
import { TenantModule } from '../../entities/rbac/tenant-module.entity';
import { EntityRegistry } from '../../entities/entity-registry/entity-registry.entity';
import { RBACTenant } from '../../entities/rbac/tenant.entity';
import { Role } from '../../entities/rbac/role.entity';
import { RolePermission } from '../../entities/rbac/role-permission.entity';
import { User } from '../../entities/users/user.entity';
import {
  ENTITY_CODE,
  INITIAL_ENABLED_TENANT_ID,
  MODULE_CODE,
  MODULE_NAME,
} from '../../api/customer-sales-reports/customer-sales-reports.constants';

async function seedCustomerSalesReportModule(tenantId = INITIAL_ENABLED_TENANT_ID) {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const moduleRepository = AppDataSource.getRepository(ModuleEntity);
  const permissionRepository = AppDataSource.getRepository(Permission);
  const tenantModuleRepository = AppDataSource.getRepository(TenantModule);
  const entityRegistryRepository = AppDataSource.getRepository(EntityRegistry);
  const tenantRepository = AppDataSource.getRepository(RBACTenant);
  const roleRepository = AppDataSource.getRepository(Role);
  const rolePermissionRepository = AppDataSource.getRepository(RolePermission);
  const userRepository = AppDataSource.getRepository(User);

  const tenant = await tenantRepository.findOne({ where: { id: tenantId } });
  if (!tenant) {
    throw new Error(`Organización no encontrada: ${tenantId}`);
  }

  let entity = await entityRegistryRepository.findOne({ where: { code: ENTITY_CODE } });
  if (!entity) {
    entity = await entityRegistryRepository.save(
      entityRegistryRepository.create({
        code: ENTITY_CODE,
        name: MODULE_NAME,
      }),
    );
  }

  let module = await moduleRepository.findOne({ where: { code: MODULE_CODE } });
  if (!module) {
    module = await moduleRepository.save(
      moduleRepository.create({
        name: MODULE_NAME,
        code: MODULE_CODE,
        description: 'Top de clientes por sucursal / razón social (consumo y total comprado)',
        category: 'sales',
        sort_order: 8,
      }),
    );
  } else {
    module.category = 'sales';
    module.sort_order = module.sort_order || 8;
    module = await moduleRepository.save(module);
  }

  const actions = [
    { action: 'ViewMenu', description: 'Ver Reporte de ventas clientes en menú' },
    { action: 'Read', description: 'Consultar y descargar el reporte de ventas clientes' },
  ];

  const savedPermissions: Permission[] = [];
  for (const item of actions) {
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
        }),
      );
    }
    savedPermissions.push(permission);
  }

  const existingTenantModule = await tenantModuleRepository.findOne({
    where: { tenant_id: tenant.id, module_id: module.id },
  });
  if (!existingTenantModule) {
    await tenantModuleRepository.save(
      tenantModuleRepository.create({
        tenant_id: tenant.id,
        module_id: module.id,
        is_enabled: true,
      }),
    );
  } else if (!existingTenantModule.is_enabled) {
    existingTenantModule.is_enabled = true;
    await tenantModuleRepository.save(existingTenantModule);
  }

  const adminRoles = await roleRepository.find({
    where: [
      { tenant_id: tenant.id, name: 'Admin' },
      { tenant_id: tenant.id, is_admin: true },
    ],
  });
  for (const adminRole of adminRoles) {
    for (const permission of savedPermissions) {
      const existingRolePermission = await rolePermissionRepository.findOne({
        where: { role_id: adminRole.id, permission_id: permission.id },
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

  await userRepository
    .createQueryBuilder()
    .update(User)
    .set({ permissions_version: () => 'permissions_version + 1' })
    .where('tenant_id = :tenantId', { tenantId: tenant.id })
    .execute();

  console.log(`✅ ${MODULE_NAME} habilitado solo para ${tenant.name}`);
}

if (require.main === module) {
  const tenantId = process.argv[2] || INITIAL_ENABLED_TENANT_ID;
  seedCustomerSalesReportModule(tenantId)
    .then(async () => {
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
      }
      process.exit(0);
    })
    .catch(async (error) => {
      console.error(error);
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
      }
      process.exit(1);
    });
}

export { seedCustomerSalesReportModule };
