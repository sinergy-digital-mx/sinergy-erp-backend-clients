import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { ModuleService } from '../services/module.service';
import { MenuPermissionService } from '../services/menu-permission.service';

@ApiTags('Tenant - Modules')
@Controller('tenant/modules')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class ModulesController {
  constructor(
    private moduleService: ModuleService,
    private menuPermissionService: MenuPermissionService,
  ) {}

  @Get()
  @RequirePermissions({ entityType: 'Lead', action: 'Read' })
  @ApiOperation({
    summary: 'Get enabled modules for current tenant',
    description: 'Returns all modules enabled for the current tenant with their available permissions',
  })
  @ApiResponse({
    status: 200,
    description: 'List of enabled modules with permissions',
    schema: {
      example: {
        modules: [
          {
            id: 'uuid',
            name: 'Leads',
            code: 'leads',
            description: 'Lead management module',
            is_enabled: true,
            permissions: [
              { id: 'uuid', action: 'Create', description: 'Create new leads' },
              { id: 'uuid', action: 'Read', description: 'View leads' },
              { id: 'uuid', action: 'Update', description: 'Update leads' },
              { id: 'uuid', action: 'Delete', description: 'Delete leads' },
            ],
          },
        ],
      },
    },
  })
  async getEnabledModules() {
    return await this.moduleService.getEnabledModulesForCurrentTenant();
  }

  @Get('visible-menu')
  @ApiOperation({
    summary: 'Obtener items de menú visibles para el usuario actual',
    description: 'Retorna solo los módulos que el usuario actual tiene permiso Ver_Menu. Use este endpoint para construir la navegación del sidebar.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de módulos visibles en el menú para el usuario actual',
    schema: {
      example: {
        modules: [
          {
            code: 'customers',
            name: 'Customers',
            description: 'Customer management module',
            permissions: ['Create', 'Read', 'Update', 'Delete', 'Ver_Menu'],
          },
          {
            code: 'leads',
            name: 'Leads',
            description: 'Lead management module',
            permissions: ['Read', 'Ver_Menu'],
          },
        ],
      },
    },
  })
  async getVisibleMenuItems() {
    return await this.menuPermissionService.getAuthorizedMenuStructure();
  }

  @Get('menu-permissions')
  @ApiOperation({
    summary: 'Obtener permisos de menú detallados para el usuario actual',
    description: 'Retorna todos los módulos habilitados con el estado del permiso Ver_Menu y permisos disponibles',
  })
  @ApiResponse({
    status: 200,
    description: 'Permisos de menú detallados para todos los módulos',
    schema: {
      example: [
        {
          moduleCode: 'customers',
          moduleName: 'Customers',
          hasViewPermission: true,
          permissions: ['Create', 'Read', 'Update', 'Delete', 'Ver_Menu'],
        },
        {
          moduleCode: 'reports',
          moduleName: 'Reports',
          hasViewPermission: false,
          permissions: [],
        },
      ],
    },
  })
  async getMenuPermissions() {
    return await this.menuPermissionService.getVisibleModulesForCurrentUser();
  }
}
