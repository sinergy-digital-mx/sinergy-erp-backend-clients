import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { seedModulePermissions } from './seed-module-permissions';
import { Permission } from '../../entities/rbac/permission.entity';
import { EntityRegistry } from '../../entities/entity-registry/entity-registry.entity';
import {
  EMPLOYEES_ACTION_DESCRIPTIONS,
  EMPLOYEES_ACTIONS,
  EMPLOYEES_ENTITY_CODE,
  EMPLOYEES_MODULE_CODE,
} from '../../api/employees/employees.constants';

async function seedEmployeesModule() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    await seedModulePermissions(AppDataSource, {
      moduleName: 'Empleados',
      moduleCode: EMPLOYEES_MODULE_CODE,
      entityCode: EMPLOYEES_ENTITY_CODE,
      description:
        'Gestión de empleados: datos de RH/nómina, vacaciones y solicitudes',
      actions: EMPLOYEES_ACTIONS,
    });

    const entity = await AppDataSource.getRepository(EntityRegistry).findOne({
      where: { code: EMPLOYEES_ENTITY_CODE },
    });
    if (entity) {
      const permissions = await AppDataSource.getRepository(Permission).find({
        where: { entity_registry_id: entity.id },
      });
      for (const permission of permissions) {
        const description = EMPLOYEES_ACTION_DESCRIPTIONS[permission.action];
        if (description && permission.description !== description) {
          permission.description = description;
          await AppDataSource.getRepository(Permission).save(permission);
        }
      }
    }
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  seedEmployeesModule()
    .then(() => {
      console.log('✅ Employees module seeded');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { seedEmployeesModule };
