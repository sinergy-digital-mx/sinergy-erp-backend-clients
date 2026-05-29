import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QuerySalesBySellerReportDto, SalesReportPeriod } from './dto/query-sales-by-seller-report.dto';
import { SalesReportsService } from './sales-reports.service';

@ApiTags('Sales Reports (preview)')
@ApiBearerAuth()
@Controller('tenant/sales-reports')
@UseGuards(JwtAuthGuard)
export class SalesReportsController {
  constructor(private readonly salesReportsService: SalesReportsService) {}

  @Get('by-seller')
  @ApiOperation({
    summary: 'Sales report grouped by branch and seller (preview, no RBAC)',
    description:
      'Aggregates fulfilled sales orders. Filter by fiscal configuration (razón social padre), branch, and date period.',
  })
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
  @ApiQuery({
    name: 'commission_rate',
    required: false,
    type: Number,
    description: 'Demo commission % applied to all rows until per-seller rates exist',
  })
  getSalesBySellerReport(@Query() query: QuerySalesBySellerReportDto, @Req() req: any) {
    return this.salesReportsService.getSalesBySellerReport(req.user.tenant_id, query);
  }
}
