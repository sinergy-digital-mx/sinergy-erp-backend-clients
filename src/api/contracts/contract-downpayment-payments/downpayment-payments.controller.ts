import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { TenantContextService } from '../../rbac/services/tenant-context.service';
import { RecordPartialPaymentDto } from '../dto/record-partial-payment.dto';
import { CreateManualDownpaymentPaymentDto } from './dto/create-manual-downpayment-payment.dto';
import { GenerateDownpaymentPaymentsDto } from './dto/generate-downpayment-payments.dto';
import { DownpaymentPaymentsService } from './downpayment-payments.service';

@Controller('tenant/contracts/:contractId/downpayment-payments')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class DownpaymentPaymentsController {
  constructor(
    private readonly downpaymentPaymentsService: DownpaymentPaymentsService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Post()
  @RequirePermissions({ entityType: 'Contract', action: 'Create' })
  async createManual(
    @Param('contractId') contractId: string,
    @Body() dto: CreateManualDownpaymentPaymentDto,
  ) {
    return this.downpaymentPaymentsService.createManualDownpaymentPayment(
      this.getTenantIdOrThrow(),
      contractId,
      dto,
    );
  }

  @Post('generate')
  @RequirePermissions({ entityType: 'Contract', action: 'Create' })
  async generate(
    @Param('contractId') contractId: string,
    @Body() dto: GenerateDownpaymentPaymentsDto,
  ) {
    return this.downpaymentPaymentsService.generateDownpaymentPayments(
      this.getTenantIdOrThrow(),
      contractId,
      dto ?? {},
    );
  }

  @Get()
  @RequirePermissions({ entityType: 'Contract', action: 'Read' })
  async list(@Param('contractId') contractId: string) {
    return this.downpaymentPaymentsService.getDownpaymentPayments(
      this.getTenantIdOrThrow(),
      contractId,
    );
  }

  @Get('stats')
  @RequirePermissions({ entityType: 'Contract', action: 'Read' })
  async stats(@Param('contractId') contractId: string) {
    return this.downpaymentPaymentsService.getDownpaymentPaymentStats(
      this.getTenantIdOrThrow(),
      contractId,
    );
  }

  @Post(':paymentId/pay')
  @RequirePermissions({ entityType: 'Contract', action: 'Update' })
  async pay(
    @Param('contractId') contractId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: RecordPartialPaymentDto,
  ) {
    return this.downpaymentPaymentsService.recordDownpaymentPayment(
      this.getTenantIdOrThrow(),
      contractId,
      paymentId,
      dto.amount,
      dto.payment_date,
      dto.payment_method,
      dto.reference_number,
      dto.notes,
    );
  }

  @Put(':paymentId')
  @RequirePermissions({ entityType: 'Contract', action: 'Update' })
  async update(
    @Param('contractId') contractId: string,
    @Param('paymentId') paymentId: string,
    @Body()
    body: {
      amount_paid?: number;
      due_date?: Date;
      paid_date?: Date;
      payment_method?: string;
      notes?: string;
    },
  ) {
    return this.downpaymentPaymentsService.updateDownpaymentPayment(
      this.getTenantIdOrThrow(),
      contractId,
      paymentId,
      body,
    );
  }

  @Post(':paymentId/cancel')
  @RequirePermissions({ entityType: 'Contract', action: 'Update' })
  async cancel(
    @Param('contractId') contractId: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.downpaymentPaymentsService.cancelDownpaymentPayment(
      this.getTenantIdOrThrow(),
      contractId,
      paymentId,
    );
  }

  @Post(':paymentId/reset')
  @RequirePermissions({ entityType: 'Contract', action: 'Update' })
  async reset(
    @Param('contractId') contractId: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.downpaymentPaymentsService.resetDownpaymentPayment(
      this.getTenantIdOrThrow(),
      contractId,
      paymentId,
    );
  }

  @Delete(':paymentId')
  @RequirePermissions({ entityType: 'Contract', action: 'Delete' })
  async delete(
    @Param('contractId') contractId: string,
    @Param('paymentId') paymentId: string,
  ) {
    await this.downpaymentPaymentsService.deleteDownpaymentPayment(
      this.getTenantIdOrThrow(),
      contractId,
      paymentId,
    );
    return { message: 'Down payment deleted successfully' };
  }

  @Post('mark-overdue')
  @RequirePermissions({ entityType: 'Contract', action: 'Update' })
  async markOverdue(@Param('contractId') contractId: string) {
    const updatedCount =
      await this.downpaymentPaymentsService.markOverdueDownpaymentPayments(
        this.getTenantIdOrThrow(),
        contractId,
      );
    return {
      message: `Marked ${updatedCount} downpayment payments as overdue`,
      updated_count: updatedCount,
    };
  }

  private getTenantIdOrThrow(): string {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return tenantId;
  }
}
