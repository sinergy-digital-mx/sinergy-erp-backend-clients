import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import {
  CreateGpsTrackingConfigurationDto,
  TestGpsTrackingConfigurationDto,
  UpdateGpsTrackingConfigurationDto,
} from './dto/gps-tracking-configuration.dto';
import { GpsTrackingService } from './services/gps-tracking.service';

@ApiTags('Rastreo GPS')
@ApiBearerAuth()
@Controller('tenant/gps-tracking')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class GpsTrackingController {
  constructor(
    private readonly service: GpsTrackingService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get('positions')
  @RequirePermissions({ entityType: 'gps_tracking', action: 'Read' })
  @ApiOperation({ summary: 'Última posición de las unidades enlazadas' })
  positions(@Query('truck_id') truckId?: string) {
    return this.service.positions(this.tenantId(), truckId || undefined);
  }

  @Get('units')
  @RequirePermissions({ entityType: 'gps_tracking', action: 'Read' })
  @ApiOperation({ summary: 'Catálogo de unidades GPS para enlazar con un camión' })
  units() {
    return this.service.units(this.tenantId());
  }

  @Get('configurations')
  @RequirePermissions({ entityType: 'gps_tracking', action: 'Read' })
  @ApiOperation({ summary: 'Listar configuraciones de rastreo GPS' })
  list() {
    return this.service.list(this.tenantId());
  }

  @Post('configurations')
  @RequirePermissions({ entityType: 'gps_tracking', action: 'Create' })
  @ApiOperation({ summary: 'Crear configuración de 3D Tracking' })
  create(@Body() dto: CreateGpsTrackingConfigurationDto) {
    return this.service.create(this.tenantId(), dto, this.userId());
  }

  @Get('configurations/active')
  @RequirePermissions({ entityType: 'gps_tracking', action: 'Read' })
  @ApiOperation({ summary: 'Configuración de rastreo activa' })
  active() {
    return this.service.findActive(this.tenantId());
  }

  @Post('configurations/test')
  @HttpCode(200)
  @RequirePermissions({ entityType: 'gps_tracking', action: 'Update' })
  @ApiOperation({ summary: 'Probar usuario y contraseña contra 3D Tracking' })
  test(@Body() dto: TestGpsTrackingConfigurationDto) {
    return this.service.test(this.tenantId(), dto);
  }

  @Patch('configurations/:id')
  @RequirePermissions({ entityType: 'gps_tracking', action: 'Update' })
  @ApiOperation({ summary: 'Actualizar configuración de rastreo GPS' })
  update(@Param('id') id: string, @Body() dto: UpdateGpsTrackingConfigurationDto) {
    return this.service.update(id, this.tenantId(), dto, this.userId());
  }

  @Delete('configurations/:id')
  @RequirePermissions({ entityType: 'gps_tracking', action: 'Delete' })
  @ApiOperation({ summary: 'Eliminar configuración de rastreo GPS' })
  remove(@Param('id') id: string) {
    return this.service.remove(id, this.tenantId());
  }

  @Post('configurations/:id/activate')
  @HttpCode(200)
  @RequirePermissions({ entityType: 'gps_tracking', action: 'Update' })
  @ApiOperation({ summary: 'Activar una configuración de rastreo GPS' })
  activate(@Param('id') id: string) {
    return this.service.activate(id, this.tenantId(), this.userId());
  }

  private tenantId(): string {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) throw new Error('Se requiere el contexto de la organización');
    return tenantId;
  }

  private userId(): string {
    const userId = this.tenantContext.getCurrentUserId();
    if (!userId) throw new Error('Se requiere el contexto de la organización');
    return userId;
  }
}
