import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  QuerySalesBySellerOrdersDto,
  QuerySalesBySellerReportDto,
  SalesReportPeriod,
  SalesReportView,
} from './dto/query-sales-by-seller-report.dto';
import { SalesReportsService } from './sales-reports.service';

@ApiTags('Sales Reports')
@ApiBearerAuth()
@Controller('tenant/sales-reports')
@UseGuards(JwtAuthGuard)
export class SalesReportsController {
  constructor(private readonly salesReportsService: SalesReportsService) {}

  @Get('by-seller')
  @ApiOperation({
    summary: 'Reporte de ventas o comisiones',
    description:
      'view=sales agrupa por quien vendió (seller_user_id). view=commissions agrupa por comisionado (assigned_seller_user_id).',
  })
  @ApiQuery({ name: 'view', required: false, enum: SalesReportView })
  @ApiQuery({ name: 'fiscal_configuration_id', required: false, type: String })
  @ApiQuery({ name: 'billing_branch_id', required: false, type: String })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: SalesReportPeriod,
    example: SalesReportPeriod.MONTH,
  })
  @ApiQuery({ name: 'date_from', required: false, type: String, description: 'Required when period=range' })
  @ApiQuery({ name: 'date_to', required: false, type: String, description: 'Required when period=range' })
  getSalesBySellerReport(@Query() query: QuerySalesBySellerReportDto, @Req() req: any) {
    return this.salesReportsService.getSalesBySellerReport(req.user.tenant_id, query);
  }

  @Get('by-seller/export/excel')
  @ApiOperation({ summary: 'Excel del reporte (mismas columnas que la vista activa)' })
  async exportSalesBySellerExcel(
    @Query() query: QuerySalesBySellerReportDto,
    @Req() req: any,
    @Res() res: any,
  ) {
    const buffer = await this.salesReportsService.exportSalesBySellerExcel(
      req.user.tenant_id,
      query,
    );
    const view = query.view === SalesReportView.COMMISSIONS ? 'comisiones' : 'ventas';
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${this.salesReportsService.getExportFilename(view)}"`,
    );
    res.send(buffer);
  }

  @Get('by-seller/orders')
  @ApiOperation({
    summary: 'Órdenes de un vendedor o comisionado (drill-down)',
    description: 'Mismos filtros y `view` del reporte. Click en fila → este endpoint.',
  })
  getSalesBySellerOrders(@Query() query: QuerySalesBySellerOrdersDto, @Req() req: any) {
    return this.salesReportsService.getSalesBySellerOrders(req.user.tenant_id, query);
  }
}
