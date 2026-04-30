import { Body, Controller, Get, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permissions.decorator';
import { ExchangeRateService } from './exchange-rate.service';
import { SetDailyExchangeRateDto } from './dto/set-daily-exchange-rate.dto';
import { QueryExchangeRateDto } from './dto/query-exchange-rate.dto';

@ApiTags('Exchange Rates')
@ApiBearerAuth()
@Controller('tenant/exchange-rates')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ExchangeRateController {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  @Put('daily')
  @RequirePermission('ExchangeRate', 'Update')
  @ApiOperation({ summary: 'Create or update exchange rate for a day' })
  @ApiResponse({ status: 200, description: 'Exchange rate saved successfully' })
  setDailyRate(@Body() dto: SetDailyExchangeRateDto, @Req() req: any) {
    return this.exchangeRateService.setDailyRate(this.getTenantId(req), dto);
  }

  @Get('daily')
  @RequirePermission('ExchangeRate', 'Read')
  @ApiOperation({ summary: 'Get exchange rate for a specific day or today' })
  @ApiQuery({ name: 'date', required: false, type: String, example: '2026-04-28' })
  @ApiResponse({ status: 200, description: 'Exchange rate found or null if not configured for the day' })
  getDailyRate(@Query('date') date: string | undefined, @Req() req: any) {
    return this.exchangeRateService.getDailyRate(this.getTenantId(req), date);
  }

  @Get()
  @RequirePermission('ExchangeRate', 'Read')
  @ApiOperation({ summary: 'List exchange rate history' })
  @ApiResponse({ status: 200, description: 'Exchange rates list' })
  findAll(@Query() query: QueryExchangeRateDto, @Req() req: any) {
    return this.exchangeRateService.findAll(this.getTenantId(req), query);
  }

  private getTenantId(req: any): string {
    return req.user?.tenant_id ?? req.user?.tenantId;
  }
}
