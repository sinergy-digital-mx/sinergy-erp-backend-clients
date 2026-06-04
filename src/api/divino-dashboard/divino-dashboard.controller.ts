import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permissions.decorator';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import { DivinoDashboardService } from './divino-dashboard.service';
import {
  QueryDivinoDashboardDto,
  QueryRevenueSeriesDto,
} from './dto/query-divino-dashboard.dto';

@Controller('tenant/divino-dashboard')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class DivinoDashboardController {
  constructor(
    private readonly divinoDashboardService: DivinoDashboardService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get('summary')
  @RequirePermission('DivinoDashboard', 'Read')
  getSummary(@Query() query: QueryDivinoDashboardDto) {
    return this.divinoDashboardService.getSummary(this.getTenantId(), query);
  }

  @Get('sellers')
  @RequirePermission('DivinoDashboard', 'Read')
  getSellers(@Query() query: QueryDivinoDashboardDto) {
    return this.divinoDashboardService.getSellers(this.getTenantId(), query);
  }

  @Get('lead-origins')
  @RequirePermission('DivinoDashboard', 'Read')
  getLeadOrigins(@Query() query: QueryDivinoDashboardDto) {
    return this.divinoDashboardService.getLeadOrigins(this.getTenantId(), query);
  }

  @Get('revenue-series')
  @RequirePermission('DivinoDashboard', 'Read')
  getRevenueSeries(@Query() query: QueryRevenueSeriesDto) {
    return this.divinoDashboardService.getRevenueSeries(
      this.getTenantId(),
      query,
    );
  }

  private getTenantId(): string {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return tenantId;
  }
}
