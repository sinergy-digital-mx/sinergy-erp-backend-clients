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
  @ApiOperation({ summary: 'Crea o sobrescribe el tipo de cambio de un día' })
  @ApiResponse({ status: 200, description: 'Exchange rate saved successfully' })
  setDailyRate(@Body() dto: SetDailyExchangeRateDto, @Req() req: any) {
    return this.exchangeRateService.setDailyRate(this.getTenantId(req), dto);
  }

  @Get('daily')
  @RequirePermission('ExchangeRate', 'Read')
  @ApiOperation({
    summary: 'Tipo de cambio del día. Si no hay captura, deja en el historial el del día anterior',
  })
  @ApiQuery({ name: 'date', required: false, type: String, example: '2026-04-28' })
  @ApiResponse({
    status: 200,
    description: 'Registro de esa fecha. Si faltaba, se creó copiando la tasa del día previo.',
  })
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
