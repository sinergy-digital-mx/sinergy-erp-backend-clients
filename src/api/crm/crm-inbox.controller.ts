import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import {
  resolveHasAdminRole,
  resolveRequestUserId,
} from '../../common/utils/request-user.util';
import { QueryCrmActivityDto } from './dto/query-crm-activity.dto';
import { CrmInboxExportService } from './services/crm-inbox-export.service';
import { CrmInboxService } from './services/crm-inbox.service';

@Controller('tenant/crm')
@ApiTags('CRM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CrmInboxController {
  constructor(
    private readonly crmInboxService: CrmInboxService,
    private readonly crmInboxExportService: CrmInboxExportService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get('activities')
  @RequirePermissions({ entityType: 'customers', action: 'Read' })
  @ApiOperation({
    summary: 'Listado de actividades CRM (propias o de todos si es admin CRM)',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'user_id', required: false })
  @ApiQuery({ name: 'period', required: false })
  @ApiQuery({ name: 'date_from', required: false })
  @ApiQuery({ name: 'date_to', required: false })
  @ApiQuery({ name: 'attention', required: false })
  @ApiResponse({ status: 200, description: 'Actividades paginadas' })
  findActivities(@Query() query: QueryCrmActivityDto, @Req() req: any) {
    return this.crmInboxService.list(
      this.requireTenantId(),
      resolveRequestUserId(req.user),
      resolveHasAdminRole(req.user),
      query,
    );
  }

  @Get('activities/stats')
  @RequirePermissions({ entityType: 'customers', action: 'Read' })
  @ApiOperation({ summary: 'Stats y pendientes del portal CRM' })
  @ApiResponse({ status: 200, description: 'Totales del periodo y pendientes' })
  getStats(@Query() query: QueryCrmActivityDto, @Req() req: any) {
    return this.crmInboxService.stats(
      this.requireTenantId(),
      resolveRequestUserId(req.user),
      resolveHasAdminRole(req.user),
      query,
    );
  }

  @Get('activities/authors')
  @RequirePermissions({ entityType: 'customers', action: 'Read' })
  @ApiOperation({
    summary: 'Vendedores que han creado al menos una actividad',
  })
  @ApiResponse({ status: 200, description: 'Autores con actividades' })
  getAuthors(@Req() req: any) {
    return this.crmInboxService.authors(
      this.requireTenantId(),
      resolveRequestUserId(req.user),
      resolveHasAdminRole(req.user),
    );
  }

  @Get('activities/export/excel')
  @RequirePermissions({ entityType: 'customers', action: 'Read' })
  @ApiOperation({
    summary: 'Descargar Excel de actividades CRM (mismos filtros del inbox)',
  })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'user_id', required: false })
  @ApiQuery({ name: 'period', required: false })
  @ApiQuery({ name: 'date_from', required: false })
  @ApiQuery({ name: 'date_to', required: false })
  @ApiQuery({ name: 'attention', required: false })
  @ApiResponse({ status: 200, description: 'Archivo Excel de actividades' })
  async exportExcel(
    @Query() query: QueryCrmActivityDto,
    @Req() req: any,
    @Res() res: any,
  ): Promise<void> {
    const buffer = await this.crmInboxExportService.exportExcel(
      this.requireTenantId(),
      resolveRequestUserId(req.user),
      resolveHasAdminRole(req.user),
      query,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${this.crmInboxExportService.getFilename()}"`,
    );
    res.send(buffer);
  }

  private requireTenantId(): string {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Se requiere contexto de organización');
    }
    return tenantId;
  }
}
