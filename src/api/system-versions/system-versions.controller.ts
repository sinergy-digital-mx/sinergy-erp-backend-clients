import { Controller, ForbiddenException, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequireAnyPermissions } from '../rbac/decorators/require-permissions.decorator';
import { QuerySystemVersionsDto } from './dto/query-system-versions.dto';
import { SystemVersionsService } from './system-versions.service';

@ApiTags('Versiones')
@ApiBearerAuth()
@Controller('tenant/system-versions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class SystemVersionsController {
  constructor(private readonly systemVersionsService: SystemVersionsService) {}

  @Get('latest')
  @RequireAnyPermissions(
    { entityType: 'system-versions', action: 'Read' },
    { entityType: 'system-versions', action: 'ViewMenu' },
  )
  @ApiOperation({ summary: 'Última versión publicada para la organización actual' })
  @ApiResponse({ status: 200, description: 'Última versión, o null si todavía no hay' })
  @ApiResponse({ status: 403, description: 'El módulo no está habilitado para la organización' })
  findLatest(@Req() req: any) {
    return this.systemVersionsService.findLatest(this.getTenantId(req));
  }

  @Get()
  @RequireAnyPermissions(
    { entityType: 'system-versions', action: 'Read' },
    { entityType: 'system-versions', action: 'ViewMenu' },
  )
  @ApiOperation({ summary: 'Historial de versiones de la organización actual, filtrado por sus módulos activos' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Listado paginado de versiones de la organización' })
  @ApiResponse({ status: 403, description: 'El módulo no está habilitado para la organización' })
  findAll(@Query() query: QuerySystemVersionsDto, @Req() req: any) {
    return this.systemVersionsService.findAll(this.getTenantId(req), query);
  }

  private getTenantId(req: any): string {
    const tenantId = req.user?.tenant_id ?? req.user?.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('No se encontró la organización en la sesión');
    }
    return tenantId;
  }
}
