import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { AccountingService } from './accounting.service';
import { AverageCostReportService } from './services/average-cost-report.service';
import { CustomerDebtFlowService } from './services/customer-debt-flow.service';
import { DebtFlowView, QueryDebtFlowDto } from './dto/query-debt-flow.dto';
import {
  QueryAccountingBaseDto,
  QueryAccountsPayableDto,
  QueryAccountsReceivableDto,
  QueryPosCollectionsDto,
  QueryPosTerminalSalesDto,
} from './dto/query-accounting-base.dto';
import { QueryAverageCostReportDto } from './dto/query-average-cost-report.dto';
import { CreateGlobalInvoiceDto, QueryGlobalInvoiceDto } from './dto/query-global-invoice.dto';
import { GlobalInvoiceService } from './services/global-invoice.service';

@ApiTags('Accounting')
@Controller('tenant/accounting')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class AccountingController {
  constructor(
    private readonly accountingService: AccountingService,
    private readonly debtFlowService: CustomerDebtFlowService,
    private readonly averageCostReportService: AverageCostReportService,
    private readonly globalInvoiceService: GlobalInvoiceService,
  ) {}

  @Get('pos-summary')
  @RequirePermissions({ entityType: 'Accounting', action: 'Read' })
  @ApiOperation({
    summary: 'Resumen POS por sucursal',
    description:
      'Ventas por terminal VENTAS y métricas de cobranza. Si hay un corte abierto de un día anterior, incluye unclosed_shift_alert en la raíz.',
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
    summary: 'Detalle de órdenes cobradas (terminal de caja)',
    description:
      'Lista cobros del periodo/sucursal. customer_type: all | walk_in | invoiced. payment_method: cash | transfer | card | check | credit. credit_only=true deja solo órdenes a crédito de clientes con crédito habilitado. credit_scope=paid lista todas las ventas cobradas y, de crédito, solo los abonos. date_basis=shift usa la fecha del corte; date_basis=collected usa el día de cobro (America/Tijuana).',
  })
  getPosCollections(@Query() query: QueryPosCollectionsDto, @Req() req: any) {
    return this.accountingService.getPosCollections(req.user.tenant_id, query);
  }

  @Get('pos-collections/export/excel')
  @RequirePermissions({ entityType: 'Accounting', action: 'Read' })
  @ApiOperation({
    summary: 'Descargar Excel de órdenes cobradas en POS',
    description: 'Mismos filtros que pos-collections, sin paginación.',
  })
  async exportPosCollectionsExcel(
    @Query() query: QueryPosCollectionsDto,
    @Req() req: any,
    @Res() res: any,
  ): Promise<void> {
    const { buffer, filename } = await this.accountingService.exportPosCollectionsExcel(
      req.user.tenant_id,
      query,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('pos-daily-shifts')
  @RequirePermissions({ entityType: 'Accounting', action: 'Read' })
  @ApiOperation({
    summary: 'Cortes globales y parciales de la sucursal',
    description: 'Lista cortes del periodo para consultar en Cobranza / Contabilidad.',
  })
  getPosDailyShifts(@Query() query: QueryAccountingBaseDto, @Req() req: any) {
    return this.accountingService.getPosDailyShifts(req.user.tenant_id, query);
  }

  @Get('pos-daily-shifts/:id')
  @RequirePermissions({ entityType: 'Accounting', action: 'Read' })
  @ApiParam({ name: 'id', description: 'UUID del corte global' })
  @ApiOperation({ summary: 'Detalle de un corte global (consulta)' })
  async getPosDailyShiftDetail(@Param('id') id: string, @Req() req: any) {
    return {
      daily_shift: await this.accountingService.getPosDailyShiftDetail(
        req.user.tenant_id,
        id,
      ),
    };
  }

  @Get('accounts-payable')
  @RequirePermissions({ entityType: 'Accounting', action: 'Read' })
  @ApiOperation({
    summary: 'Cuentas por pagar agrupadas por proveedor',
    description:
      'currency=all muestra pesos y dólares. currency=mxn o usd deja solo esa moneda. period=month o range filtra por la fecha de la orden.',
  })
  getAccountsPayable(@Query() query: QueryAccountsPayableDto, @Req() req: any) {
    return this.accountingService.getAccountsPayable(req.user.tenant_id, query);
  }

  @Get('accounts-payable/export/excel')
  @RequirePermissions({ entityType: 'Accounting', action: 'Read' })
  @ApiOperation({
    summary: 'Excel de cuentas por pagar',
    description:
      'currency=all abre en Ambos, sigue con Ambos detallado (razón social, fecha, folio, factura, tipo de pago y moneda) y después pesos y dólares. mxn o usd descarga una sola lista.',
  })
  async exportAccountsPayableExcel(
    @Query() query: QueryAccountsPayableDto,
    @Req() req: any,
    @Res() res: any,
  ): Promise<void> {
    const { buffer, filename } = await this.accountingService.exportAccountsPayableExcel(
      req.user.tenant_id,
      query,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('accounts-payable/vendors/:vendorId')
  @RequirePermissions({ entityType: 'Accounting', action: 'Read' })
  @ApiParam({ name: 'vendorId', description: 'UUID del proveedor' })
  @ApiOperation({ summary: 'Detalle de órdenes de compra pendientes de un proveedor' })
  getAccountsPayableDetail(
    @Param('vendorId') vendorId: string,
    @Query() query: QueryAccountsPayableDto,
    @Req() req: any,
  ) {
    return this.accountingService.getAccountsPayableDetail(
      req.user.tenant_id,
      vendorId,
      query,
    );
  }

  @Get('accounts-receivable')
  @RequirePermissions({ entityType: 'Accounting', action: 'Read' })
  @ApiOperation({
    summary: 'Cuentas por cobrar agrupadas por razón social',
    description:
      'currency=all muestra pesos y dólares. currency=mxn o usd deja solo esa moneda. El total en pesos usa el tipo de cambio del sistema.',
  })
  getAccountsReceivable(@Query() query: QueryAccountsReceivableDto, @Req() req: any) {
    return this.accountingService.getAccountsReceivable(req.user.tenant_id, query);
  }

  @Get('accounts-receivable/export/excel')
  @RequirePermissions({ entityType: 'Accounting', action: 'Read' })
  @ApiOperation({
    summary: 'Excel de cuentas por cobrar',
    description:
      'currency=all abre en Ambos, sigue con Ambos detallado (razón social, fecha, folio, factura, tipo de pago y moneda) y después pesos y dólares. Arriba va el tipo de cambio del sistema.',
  })
  async exportAccountsReceivableExcel(
    @Query() query: QueryAccountsReceivableDto,
    @Req() req: any,
    @Res() res: any,
  ): Promise<void> {
    const { buffer, filename } = await this.accountingService.exportAccountsReceivableExcel(
      req.user.tenant_id,
      query,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
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
    @Query('fiscal_configuration_id') fiscalConfigurationId: string | undefined,
    @Req() req: any,
  ) {
    return this.accountingService.getAccountsReceivableDetail(
      req.user.tenant_id,
      razonSocial,
      fiscalConfigurationId,
    );
  }

  @Get('average-cost-report')
  @RequirePermissions({ entityType: 'Accounting', action: 'Read' })
  @ApiOperation({
    summary: 'Reporte de ventas a costo promedio',
    description:
      'Documentos de venta de la sucursal y el periodo: cliente, documento, fecha, tipo, estatus, importe, descuento, impuesto, total de venta y costo del kardex. Una cancelación suma un renglón que resta impuesto, total y costo.',
  })
  getAverageCostReport(@Query() query: QueryAverageCostReportDto, @Req() req: any) {
    return this.averageCostReportService.getReport(req.user.tenant_id, query);
  }

  @Get('average-cost-report/export/excel')
  @RequirePermissions({ entityType: 'Accounting', action: 'Read' })
  @ApiOperation({ summary: 'Excel de ventas a costo promedio' })
  async exportAverageCostReportExcel(
    @Query() query: QueryAverageCostReportDto,
    @Req() req: any,
    @Res() res: any,
  ): Promise<void> {
    const { buffer, filename } = await this.averageCostReportService.exportExcel(
      req.user.tenant_id,
      query,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('debt-flow')
  @RequirePermissions({ entityType: 'Accounting', action: 'Read' })
  @ApiOperation({
    summary: 'Antigüedad de saldos o flujo de deuda del cliente',
    description:
      'Solo órdenes a crédito. view=aging corta los saldos abiertos al fin del periodo. view=ledger lista cargos, abonos y el saldo de cada OV. El histórico queda congelado al capturarse.',
  })
  getDebtFlow(@Query() query: QueryDebtFlowDto, @Req() req: any) {
    return this.debtFlowService.getReport(req.user.tenant_id, query);
  }

  @Get('debt-flow/export/excel')
  @RequirePermissions({ entityType: 'Accounting', action: 'Read' })
  @ApiOperation({ summary: 'Excel de antigüedad de saldos o flujo de deuda' })
  async exportDebtFlowExcel(
    @Query() query: QueryDebtFlowDto,
    @Req() req: any,
    @Res() res: any,
  ): Promise<void> {
    const buffer = await this.debtFlowService.exportExcel(req.user.tenant_id, query);
    const filename = this.debtFlowService.getFilename(query.view ?? DebtFlowView.AGING);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('global-invoices')
  @RequirePermissions({ entityType: 'Accounting', action: 'Read' })
  @ApiOperation({
    summary: 'Factura a público en general del mes',
    description:
      'Órdenes de clientes sin factura de ingreso vigente en el mes, o la factura a público en general ya timbrada. Una vigente por sucursal y mes. El mes es el calendario de la zona horaria de la razón social.',
  })
  getGlobalInvoices(@Query() query: QueryGlobalInvoiceDto, @Req() req: any) {
    return this.globalInvoiceService.get(
      req.user.tenant_id,
      query.month,
      query.billing_branch_id,
    );
  }

  @Post('global-invoices')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(
    { entityType: 'Accounting', action: 'Read' },
    { entityType: 'electronic_invoices', action: 'Stamp' },
  )
  @ApiOperation({
    summary: 'Timbrar la factura a público en general del mes',
    description:
      'Un CFDI a público en general con todas las órdenes sin facturar de esa sucursal y mes. order_ids tiene que ser exactamente esa lista.',
  })
  createGlobalInvoice(@Body() dto: CreateGlobalInvoiceDto, @Req() req: any) {
    return this.globalInvoiceService.generate(req.user.tenant_id, req.user.id, dto);
  }

  @Post('global-invoices/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(
    { entityType: 'Accounting', action: 'Read' },
    { entityType: 'electronic_invoices', action: 'Cancel' },
  )
  @ApiOperation({
    summary: 'Cancelar la factura a público en general',
    description:
      'Cancela el CFDI con motivo 02. Si el SAT la deja cancelada, las órdenes vuelven a poder facturarse.',
  })
  cancelGlobalInvoice(@Param('id') id: string, @Req() req: any) {
    return this.globalInvoiceService.cancel(id, req.user.tenant_id, req.user.id);
  }
}
