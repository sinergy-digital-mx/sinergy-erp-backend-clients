import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { seedModulePermissions } from './seed-module-permissions';
import {
  DIVINO_RESERVATION_ALLOWED_TENANT_ID,
  DIVINO_RESERVATION_ENTITY_CODE,
  DIVINO_RESERVATION_MODULE_CODE,
} from '../../api/divino-reservation-formats/divino-reservation-formats.constants';

async function seedDivinoReservationFormatsModule() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    await seedModulePermissions(AppDataSource, {
      moduleName: 'Divino Formatos de Reservación',
      moduleCode: DIVINO_RESERVATION_MODULE_CODE,
      entityCode: DIVINO_RESERVATION_ENTITY_CODE,
      description:
        'Cotizaciones/apartados de lotes mediante formato de reservación Divino',
      actions: ['ViewMenu', 'Create', 'Read', 'Update', 'Delete', 'Send'],
      tenantId: DIVINO_RESERVATION_ALLOWED_TENANT_ID,
    });
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  seedDivinoReservationFormatsModule()
    .then(() => {
      console.log('✅ Divino Reservation Formats module seeded');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { seedDivinoReservationFormatsModule };
