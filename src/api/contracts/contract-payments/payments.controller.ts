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
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { TenantContextService } from '../../rbac/services/tenant-context.service';
import { PaymentsService } from './payments.service';
import { RecordPartialPaymentDto } from '../dto/record-partial-payment.dto';
import { GenerateContractPaymentsDto } from './dto/generate-contract-payments.dto';

@Controller('tenant/contracts/:contractId/payments')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private tenantContext: TenantContextService,
  ) {}

  @Post('generate')
  @RequirePermissions({ entityType: 'Contract', action: 'Create' })
  async generatePayments(
    @Param('contractId') contractId: string,
    @Body() dto: GenerateContractPaymentsDto = {},
    @Req() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    return this.paymentsService.generatePaymentsForContract(
      tenantId,
      contractId,
      dto ?? {},
    );
  }

  @Post('regenerate')
  @RequirePermissions({ entityType: 'Contract', action: 'Create' })
  async regeneratePayments(
    @Param('contractId') contractId: string,
    @Body() dto: GenerateContractPaymentsDto = {},
    @Req() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    return this.paymentsService.regeneratePaymentsForContract(
      tenantId,
      contractId,
      dto ?? {},
    );
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

  @Get('schedule-preview')
  @RequirePermissions({ entityType: 'Contract', action: 'Read' })
  async previewSchedule(
    @Param('contractId') contractId: string,
    @Query('start_date') startDate: string | undefined,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    return this.paymentsService.previewPaymentSchedule(tenantId, contractId, startDate);
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
    @Body() body: { 
      amount_paid?: number;
      due_date?: Date; 
      paid_date?: Date;
      payment_method?: string;
      reference_number?: string;
      notes?: string;
    },
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

    return this.paymentsService.recordPayment(
      tenantId,
      paymentId,
      dto.amount,
      dto.payment_date,
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

  @Post(':paymentId/reset')
  @RequirePermissions({ entityType: 'Contract', action: 'Update' })
  async resetPayment(
    @Param('contractId') contractId: string,
    @Param('paymentId') paymentId: string,
    @Req() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    return this.paymentsService.resetPayment(tenantId, paymentId);
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
    return { message: 'Payment deleted successfully' };
  }

  @Post('mark-overdue')
  @RequirePermissions({ entityType: 'Contract', action: 'Update' })
  async markOverduePayments(
    @Param('contractId') contractId: string,
    @Req() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    const updatedCount = await this.paymentsService.markOverduePayments(tenantId);
    return {
      message: `Marked ${updatedCount} payments as overdue`,
      updated_count: updatedCount,
    };
  }
}
