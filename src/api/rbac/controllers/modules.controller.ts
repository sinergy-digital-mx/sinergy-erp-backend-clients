import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { ModuleService } from '../services/module.service';

@ApiTags('Tenant - Modules')
@Controller('tenant/modules')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class ModulesController {
  constructor(private moduleService: ModuleService) {}

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
}
