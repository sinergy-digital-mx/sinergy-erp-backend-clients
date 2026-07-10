import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Body,
  Req,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { FinkokProviderConfigurationService } from './services/finkok-provider-configuration.service';
import { UpsertFinkokProviderConfigurationDto } from './dto/upsert-finkok-provider-configuration.dto';
import { SetFinkokStampingEnvironmentDto } from './dto/set-finkok-stamping-environment.dto';
import type { FinkokEnvironment } from '../../entities/electronic-invoicing/finkok-provider-configuration.entity';

@ApiTags('Finkok Configuration')
@Controller('tenant/billing/finkok-configuration')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class FinkokProviderConfigurationController {
  constructor(private readonly service: FinkokProviderConfigurationService) {}

  @Get()
  @RequirePermissions({ entityType: 'FiscalConfiguration', action: 'Read' })
  @ApiOperation({
    summary: 'Obtener credenciales Finkok del cliente (demo y production por separado)',
  })
  get(@Req() req: { user: { tenantId: string } }) {
    return this.service.getAllForTenant(req.user.tenantId);
  }

  @Put()
  @RequirePermissions({ entityType: 'FiscalConfiguration', action: 'Update' })
  @ApiOperation({
    summary: 'Guardar credenciales Finkok para un ambiente (demo o production)',
    description: 'Body.environment es obligatorio. Puede existir un registro por ambiente por cliente.',
  })
  upsert(
    @Body() dto: UpsertFinkokProviderConfigurationDto,
    @Req() req: { user: { tenantId: string; id: string } },
  ) {
    return this.service.upsert(req.user.tenantId, req.user.id, dto);
  }

  @Patch('stamping-environment')
  @RequirePermissions({ entityType: 'FiscalConfiguration', action: 'Update' })
  @ApiOperation({
    summary: 'Definir qué ambiente Finkok usar al timbrar/cancelar por defecto',
  })
  setStampingEnvironment(
    @Body() dto: SetFinkokStampingEnvironmentDto,
    @Req() req: { user: { tenantId: string } },
  ) {
    return this.service.setStampingEnvironment(req.user.tenantId, dto.environment);
  }

  @Post('test-connection')
  @HttpCode(200)
  @RequirePermissions({ entityType: 'FiscalConfiguration', action: 'Update' })
  @ApiOperation({ summary: 'Probar conexión con Finkok' })
  @ApiQuery({ name: 'environment', required: false, enum: ['demo', 'production'] })
  testConnection(
    @Req() req: { user: { tenantId: string } },
    @Query('environment') environment?: FinkokEnvironment,
  ) {
    return this.service.testConnection(req.user.tenantId, environment);
  }
}
