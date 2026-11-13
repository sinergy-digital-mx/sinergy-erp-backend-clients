import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permissions.decorator';
import { QueryStockReplenishmentDto } from './dto/query-stock-replenishment.dto';
import { REPORTS_ENTITY_CODE } from './reports.constants';
import { ReportsService } from './reports.service';

@ApiTags('Reporte de requerimiento')
@ApiBearerAuth()
@Controller('tenant/reporte-requerimiento')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('vendors')
  @RequirePermission(REPORTS_ENTITY_CODE, 'Read')
  @ApiOperation({
    summary: 'Proveedores con productos para el reporte de existencias',
  })
  listVendors(@Req() req: { user: { tenant_id: string } }) {
    return this.reportsService.listVendors(req.user.tenant_id);
  }

  @Get()
  @RequirePermission(REPORTS_ENTITY_CODE, 'Read')
  @ApiOperation({
    summary: 'Existencias por proveedor con pronóstico de compra',
    description:
      'Por razón social trae los productos del proveedor, existencia y venta por sucursal, y una cantidad recomendada a comprar.',
  })
  getStockReplenishment(
    @Query() query: QueryStockReplenishmentDto,
    @Req() req: { user: { tenant_id: string } },
  ) {
    return this.reportsService.getStockReplenishment(req.user.tenant_id, query);
  }
}
