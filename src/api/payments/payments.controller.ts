import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Controller('tenant/payments')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private tenantContext: TenantContextService,
  ) {}

  @Post()
  @RequirePermissions({ entityType: 'Payment', action: 'Create' })
  async create(@Req() req: any, @Body() dto: CreatePaymentDto) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.paymentsService.create(tenantId, dto);
  }

  @Get()
  @RequirePermissions({ entityType: 'Payment', action: 'Read' })
  async findAll(
    @Req() req: any,
    @Query('contractId') contractId?: string,
    @Query('status') status?: string,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.paymentsService.findAll(tenantId, contractId, status);
  }

  @Get('stats')
  @RequirePermissions({ entityType: 'Payment', action: 'Read' })
  async getStats(@Req() req: any, @Query('contractId') contractId?: string) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.paymentsService.getPaymentStats(tenantId, contractId);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'Payment', action: 'Read' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.paymentsService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequirePermissions({ entityType: 'Payment', action: 'Update' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentDto,
    @Req() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.paymentsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ entityType: 'Payment', action: 'Delete' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    await this.paymentsService.remove(tenantId, id);
    return { success: true };
  }
}
