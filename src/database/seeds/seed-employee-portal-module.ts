import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { seedModulePermissions } from './seed-module-permissions';
import {
  EMPLOYEE_PORTAL_ACTIONS,
  EMPLOYEE_PORTAL_ENTITY_CODE,
  EMPLOYEE_PORTAL_MODULE_CODE,
} from '../../api/employee-portal/employee-portal.constants';

async function seedEmployeePortalModule() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    await seedModulePermissions(AppDataSource, {
      moduleName: 'Portal de empleado',
      moduleCode: EMPLOYEE_PORTAL_MODULE_CODE,
      entityCode: EMPLOYEE_PORTAL_ENTITY_CODE,
      description:
        'Autoservicio del empleado: perfil, foto, contraseña y solicitudes de vacaciones',
      actions: EMPLOYEE_PORTAL_ACTIONS,
    });
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  seedEmployeePortalModule()
    .then(() => {
      console.log('✅ Employee Portal module seeded');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { seedEmployeePortalModule };
