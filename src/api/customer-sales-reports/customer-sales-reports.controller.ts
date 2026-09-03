import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permissions.decorator';
import { ENTITY_CODE, DEFAULT_TOP_LIMIT } from './customer-sales-reports.constants';
import {
  CustomerSalesReportPeriod,
  QueryCustomerSalesReportDto,
} from './dto/query-customer-sales-report.dto';
import { CustomerSalesReportsService } from './customer-sales-reports.service';

@ApiTags('Customer Sales Reports')
@ApiBearerAuth()
@Controller('tenant/customer-sales-reports')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CustomerSalesReportsController {
  constructor(private readonly customerSalesReportsService: CustomerSalesReportsService) {}

  @Get()
  @RequirePermission(ENTITY_CODE, 'Read')
  @ApiOperation({
    summary: 'Top de clientes por sucursal / razón social',
    description:
      'Agrupa órdenes surtidas por cliente. Ventas = número de órdenes. Total comprado = suma de totales.',
  })
  @ApiQuery({ name: 'fiscal_configuration_id', required: false, type: String })
  @ApiQuery({ name: 'billing_branch_id', required: false, type: String })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: CustomerSalesReportPeriod,
    example: CustomerSalesReportPeriod.MONTH,
  })
  @ApiQuery({ name: 'date_from', required: false, type: String })
  @ApiQuery({ name: 'date_to', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: DEFAULT_TOP_LIMIT })
  getTopCustomers(@Query() query: QueryCustomerSalesReportDto, @Req() req: any) {
    return this.customerSalesReportsService.getTopCustomersReport(
      req.user.tenant_id,
      query,
      query.limit ?? DEFAULT_TOP_LIMIT,
    );
  }

  @Get('export/excel')
  @RequirePermission(ENTITY_CODE, 'Read')
  @ApiOperation({ summary: 'Excel del top de clientes (mismas columnas que la vista)' })
  async exportTopCustomersExcel(
    @Query() query: QueryCustomerSalesReportDto,
    @Req() req: any,
    @Res() res: any,
  ) {
    const buffer = await this.customerSalesReportsService.exportTopCustomersExcel(
      req.user.tenant_id,
      query,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${this.customerSalesReportsService.getExportFilename()}"`,
    );
    res.send(buffer);
  }
}
