import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { AccountingService } from './accounting.service';
import {
  QueryAccountingBaseDto,
  QueryAccountsPayableDto,
  QueryAccountsReceivableDto,
  QueryPosCollectionsDto,
  QueryPosTerminalSalesDto,
} from './dto/query-accounting-base.dto';

@ApiTags('Accounting')
@Controller('tenant/accounting')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('pos-summary')
  @RequirePermissions({ entityType: 'Accounting', action: 'Read' })
  @ApiOperation({
    summary: 'Resumen POS por sucursal',
    description:
      'Ventas por terminal VENTAS y métricas de cobranza (órdenes cobradas, mostrador vs facturadas).',
  })
  getPosSummary(@Query() query: QueryAccountingBaseDto, @Req() req: any) {
    return this.accountingService.getPosSummary(req.user.tenant_id, query);
  }

  @Get('pos-terminals/:terminalUserId/sales')
  @RequirePermissions({ entityType: 'Accounting', action: 'Read' })
  @ApiParam({ name: 'terminalUserId', description: 'UUID del usuario terminal POS' })
  @ApiOperation({ summary: 'Detalle de ventas de una terminal POS' })
  getPosTerminalSales(
    @Param('terminalUserId') terminalUserId: string,
    @Query() query: QueryPosTerminalSalesDto,
    @Req() req: any,
  ) {
    return this.accountingService.getPosTerminalSales(
      req.user.tenant_id,
      terminalUserId,
      query,
    );
  }

  @Get('pos-collections')
  @RequirePermissions({ entityType: 'Accounting', action: 'Read' })
  @ApiOperation({
    summary: 'Detalle de órdenes cobradas (terminal de cobranza)',
    description:
      'Lista cobros del periodo/sucursal. Filtro customer_type: all | walk_in | invoiced.',
  })
  getPosCollections(@Query() query: QueryPosCollectionsDto, @Req() req: any) {
    return this.accountingService.getPosCollections(req.user.tenant_id, query);
  }

  @Get('accounts-payable')
  @RequirePermissions({ entityType: 'Accounting', action: 'Read' })
  @ApiOperation({ summary: 'Cuentas por pagar agrupadas por proveedor' })
  getAccountsPayable(@Query() query: QueryAccountsPayableDto, @Req() req: any) {
    return this.accountingService.getAccountsPayable(req.user.tenant_id, query);
  }

  @Get('accounts-payable/vendors/:vendorId')
  @RequirePermissions({ entityType: 'Accounting', action: 'Read' })
  @ApiParam({ name: 'vendorId', description: 'UUID del proveedor' })
  @ApiOperation({ summary: 'Detalle de órdenes de compra pendientes de un proveedor' })
  getAccountsPayableDetail(@Param('vendorId') vendorId: string, @Req() req: any) {
    return this.accountingService.getAccountsPayableDetail(req.user.tenant_id, vendorId);
  }

  @Get('accounts-receivable')
  @RequirePermissions({ entityType: 'Accounting', action: 'Read' })
  @ApiOperation({ summary: 'Cuentas por cobrar agrupadas por razón social' })
  getAccountsReceivable(@Query() query: QueryAccountsReceivableDto, @Req() req: any) {
    return this.accountingService.getAccountsReceivable(req.user.tenant_id, query);
  }

  @Get('accounts-receivable/by-razon-social/:razonSocial/orders')
  @RequirePermissions({ entityType: 'Accounting', action: 'Read' })
  @ApiParam({
    name: 'razonSocial',
    description: 'Razón social codificada (encodeURIComponent)',
  })
  @ApiOperation({ summary: 'Detalle de órdenes pendientes por razón social' })
  getAccountsReceivableDetail(
    @Param('razonSocial') razonSocial: string,
    @Query('billing_branch_id') billingBranchId: string | undefined,
    @Req() req: any,
  ) {
    return this.accountingService.getAccountsReceivableDetail(
      req.user.tenant_id,
      razonSocial,
      billingBranchId,
    );
  }
}
