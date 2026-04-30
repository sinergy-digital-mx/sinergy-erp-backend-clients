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
import { GenerateHoaPaymentsDto } from './dto/generate-hoa-payments.dto';
import { RecordHoaPaymentDto } from './dto/record-hoa-payment.dto';
import { UpdateHoaPaymentDto } from './dto/update-hoa-payment.dto';
import { HoaPaymentsService } from './hoa-payments.service';

@Controller('tenant/contracts/:contractId/hoa-payments')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class HoaPaymentsController {
  constructor(
    private readonly hoaPaymentsService: HoaPaymentsService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Post('generate')
  @RequirePermissions({ entityType: 'Contract', action: 'Create' })
  async generateHoaPayments(
    @Param('contractId') contractId: string,
    @Body() dto: GenerateHoaPaymentsDto,
  ) {
    const tenantId = this.getTenantIdOrThrow();
    return this.hoaPaymentsService.generateHoaPayments(tenantId, contractId, dto);
  }

  @Get()
  @RequirePermissions({ entityType: 'Contract', action: 'Read' })
  async getHoaPayments(@Param('contractId') contractId: string) {
    const tenantId = this.getTenantIdOrThrow();
    return this.hoaPaymentsService.getContractHoaPayments(tenantId, contractId);
  }

  @Get('stats')
  @RequirePermissions({ entityType: 'Contract', action: 'Read' })
  async getHoaPaymentStats(@Param('contractId') contractId: string) {
    const tenantId = this.getTenantIdOrThrow();
    return this.hoaPaymentsService.getHoaPaymentStats(tenantId, contractId);
  }

  @Get(':paymentId')
  @RequirePermissions({ entityType: 'Contract', action: 'Read' })
  async getHoaPayment(
    @Param('contractId') contractId: string,
    @Param('paymentId') paymentId: string,
  ) {
    const tenantId = this.getTenantIdOrThrow();
    return this.hoaPaymentsService.getHoaPayment(tenantId, contractId, paymentId);
  }

  @Put(':paymentId')
  @RequirePermissions({ entityType: 'Contract', action: 'Update' })
  async updateHoaPayment(
    @Param('contractId') contractId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: UpdateHoaPaymentDto,
  ) {
    const tenantId = this.getTenantIdOrThrow();
    return this.hoaPaymentsService.updateHoaPayment(
      tenantId,
      contractId,
      paymentId,
      dto,
    );
  }

  @Post(':paymentId/pay')
  @RequirePermissions({ entityType: 'Contract', action: 'Update' })
  async recordHoaPayment(
    @Param('contractId') contractId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: RecordHoaPaymentDto,
  ) {
    const tenantId = this.getTenantIdOrThrow();
    return this.hoaPaymentsService.recordHoaPayment(
      tenantId,
      contractId,
      paymentId,
      dto,
    );
  }

  @Post(':paymentId/cancel')
  @RequirePermissions({ entityType: 'Contract', action: 'Update' })
  async cancelHoaPayment(
    @Param('contractId') contractId: string,
    @Param('paymentId') paymentId: string,
  ) {
    const tenantId = this.getTenantIdOrThrow();
    return this.hoaPaymentsService.cancelHoaPayment(tenantId, contractId, paymentId);
  }

  @Post(':paymentId/reset')
  @RequirePermissions({ entityType: 'Contract', action: 'Update' })
  async resetHoaPayment(
    @Param('contractId') contractId: string,
    @Param('paymentId') paymentId: string,
  ) {
    const tenantId = this.getTenantIdOrThrow();
    return this.hoaPaymentsService.resetHoaPayment(tenantId, contractId, paymentId);
  }

  @Delete(':paymentId')
  @RequirePermissions({ entityType: 'Contract', action: 'Delete' })
  async deleteHoaPayment(
    @Param('contractId') contractId: string,
    @Param('paymentId') paymentId: string,
  ) {
    const tenantId = this.getTenantIdOrThrow();
    await this.hoaPaymentsService.deleteHoaPayment(tenantId, contractId, paymentId);
    return { message: 'HOA payment deleted successfully' };
  }

  @Post('mark-overdue')
  @RequirePermissions({ entityType: 'Contract', action: 'Update' })
  async markOverdueHoaPayments(@Param('contractId') contractId: string) {
    const tenantId = this.getTenantIdOrThrow();
    const updatedCount = await this.hoaPaymentsService.markOverdueHoaPayments(
      tenantId,
      contractId,
    );
    return {
      message: `Marked ${updatedCount} HOA payments as overdue`,
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
