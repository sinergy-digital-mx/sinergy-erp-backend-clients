import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CustomerActivitiesService } from './customer-activities.service';
import { CreateCustomerActivityDto } from './dto/create-customer-activity.dto';
import { UpdateCustomerActivityDto } from './dto/update-customer-activity.dto';
import { QueryCustomerActivityDto } from './dto/query-customer-activity.dto';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantContextService } from '../rbac/services/tenant-context.service';

@Controller('tenant/customers/:customerId/activities')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CustomerActivitiesController {
  constructor(
    private readonly activitiesService: CustomerActivitiesService,
    private tenantContext: TenantContextService,
  ) {}

  @Post()
  @RequirePermissions({ entityType: 'Customer', action: 'Activity:Create' })
  async create(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Body() createActivityDto: CreateCustomerActivityDto,
    @Request() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.activitiesService.create(customerId, createActivityDto, req.user.sub, tenantId);
  }

  @Get()
  @RequirePermissions({ entityType: 'Customer', action: 'Activity:Read' })
  async findAll(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Query() query: QueryCustomerActivityDto,
    @Request() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.activitiesService.findAll(customerId, query, tenantId);
  }

  @Get('summary')
  @RequirePermissions({ entityType: 'Customer', action: 'Activity:Read' })
  async getActivitySummary(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Request() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.activitiesService.getActivitySummary(customerId, tenantId);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'Customer', action: 'Activity:Read' })
  async findOne(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.activitiesService.findOne(customerId, id, tenantId);
  }

  @Patch(':id')
  @RequirePermissions({ entityType: 'Customer', action: 'Activity:Update' })
  async update(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateActivityDto: UpdateCustomerActivityDto,
    @Request() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.activitiesService.update(customerId, id, updateActivityDto, req.user.sub, tenantId);
  }
}
