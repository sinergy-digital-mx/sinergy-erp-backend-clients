import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import { PaymentsService } from './payments.service';
import { RecordPartialPaymentDto } from './dto/record-partial-payment.dto';

@Controller('tenant/contracts/:contractId/payments')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private tenantContext: TenantContextService,
  ) {}

  @Post('generate')
  @RequirePermissions({ entityType: 'Contract', action: 'Create' })
  async generatePayments(@Param('contractId') contractId: string, @Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    return this.paymentsService.generatePaymentsForContract(tenantId, contractId);
  }

  @Get()
  @RequirePermissions({ entityType: 'Contract', action: 'Read' })
  async getPayments(@Param('contractId') contractId: string, @Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    return this.paymentsService.getContractPayments(tenantId, contractId);
  }

  @Get('stats')
  @RequirePermissions({ entityType: 'Contract', action: 'Read' })
  async getStats(@Param('contractId') contractId: string, @Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    return this.paymentsService.getContractPaymentStats(tenantId, contractId);
  }

  @Get(':paymentId')
  @RequirePermissions({ entityType: 'Contract', action: 'Read' })
  async getPayment(
    @Param('contractId') contractId: string,
    @Param('paymentId') paymentId: string,
    @Req() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    return this.paymentsService.getPayment(tenantId, paymentId);
  }

  @Put(':paymentId')
  @RequirePermissions({ entityType: 'Contract', action: 'Update' })
  async updatePayment(
    @Param('contractId') contractId: string,
    @Param('paymentId') paymentId: string,
    @Body() body: { amount?: number; due_date?: Date; notes?: string },
    @Req() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    return this.paymentsService.updatePayment(tenantId, paymentId, body);
  }

  @Post(':paymentId/pay')
  @RequirePermissions({ entityType: 'Contract', action: 'Update' })
  async recordPayment(
    @Param('contractId') contractId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: RecordPartialPaymentDto,
    @Req() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    return this.paymentsService.recordPartialPayment(
      tenantId,
      paymentId,
      dto.amount,
      new Date(dto.payment_date),
      dto.payment_method,
      dto.reference_number,
      dto.notes,
    );
  }

  @Post(':paymentId/cancel')
  @RequirePermissions({ entityType: 'Contract', action: 'Update' })
  async cancelPayment(
    @Param('contractId') contractId: string,
    @Param('paymentId') paymentId: string,
    @Req() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    return this.paymentsService.cancelPayment(tenantId, paymentId);
  }

  @Delete(':paymentId')
  @RequirePermissions({ entityType: 'Contract', action: 'Delete' })
  async deletePayment(
    @Param('contractId') contractId: string,
    @Param('paymentId') paymentId: string,
    @Req() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    await this.paymentsService.deletePayment(tenantId, paymentId);
    return { success: true };
  }
}
