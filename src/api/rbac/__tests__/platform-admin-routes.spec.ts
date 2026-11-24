/**
 * La consola de escritorio administra organizaciones.
 * Estas rutas ya no se publican en el API de los clientes.
 */
import { MODULE_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { UsersModule } from '../../users/users.module';
import { AdminTenantModulesController } from '../controllers/admin-tenant-modules.controller';
import { ModulesController } from '../controllers/modules.controller';
import { RolesController } from '../controllers/roles.controller';
import { TenantController } from '../controllers/tenant.controller';
import { UsersRolesController } from '../controllers/users-roles.controller';
import { RBACModule } from '../rbac.module';
import { ModuleService } from '../services/module.service';
import { TenantService } from '../services/tenant.service';

describe('rutas de administración de organizaciones', () => {
  const controllers = Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, RBACModule) as unknown[];
  const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, RBACModule) as unknown[];
  const userControllers = Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, UsersModule) as unknown[];

  it('no publica el alta de organizaciones ni el catálogo de módulos', () => {
    expect(controllers).not.toContain(TenantController);
    expect(controllers).not.toContain(AdminTenantModulesController);
  });

  it('sigue registrando módulos y usuarios de cada empresa', () => {
    expect(controllers).toContain(ModulesController);
    expect(controllers).toContain(RolesController);
    expect(Reflect.getMetadata(PATH_METADATA, ModulesController)).toBe('tenant/modules');
    expect(Reflect.getMetadata(PATH_METADATA, UsersRolesController)).toBe('tenant/users');
    expect(userControllers).toContain(UsersRolesController);
  });

  it('conserva los servicios que usa el resto del ERP', () => {
    expect(providers).toContain(TenantService);
    expect(providers).toContain(ModuleService);
  });
});
