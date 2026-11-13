import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { TenantContextService } from '../../rbac/services/tenant-context.service';
import { PaymentsService } from './payments.service';
import { PaymentReceiptService } from './payment-receipt.service';
import { RecordPartialPaymentDto } from '../dto/record-partial-payment.dto';
import { GenerateContractPaymentsDto } from './dto/generate-contract-payments.dto';
import { UpdateLateInterestDto } from './dto/update-late-interest.dto';

@Controller('tenant/contracts/:contractId/payments')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private paymentReceiptService: PaymentReceiptService,
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

  @Get('receipt-template')
  @RequirePermissions({ entityType: 'Contract', action: 'Read' })
  getReceiptTemplate(@Param('contractId') contractId: string) {
    const organizationId = this.requireOrganizationId();
    return this.paymentReceiptService.getTemplate(organizationId, contractId);
  }

  @Patch('receipt-template')
  @RequirePermissions({ entityType: 'Contract', action: 'Update' })
  updateReceiptTemplate(
    @Body()
    body: {
      subject?: string;
      body_html?: string;
      reset_default?: boolean;
      fiscal_configuration_id?: string | null;
    },
  ) {
    const organizationId = this.requireOrganizationId();
    return this.paymentReceiptService.updateTemplate(organizationId, body);
  }

  @Post('receipt-template/logo')
  @RequirePermissions({ entityType: 'Contract', action: 'Update' })
  @UseInterceptors(FileInterceptor('file'))
  uploadReceiptLogo(
    @UploadedFile() file: Express.Multer.File,
    @Body('fiscal_configuration_id') fiscalConfigurationId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se envió ningún archivo');
    }
    const organizationId = this.requireOrganizationId();
    return this.paymentReceiptService.uploadLogo(
      organizationId,
      fiscalConfigurationId || '',
      file,
    );
  }

  @Get(':paymentId/receipt.pdf')
  @RequirePermissions({ entityType: 'Contract', action: 'Read' })
  async downloadReceipt(
    @Param('contractId') contractId: string,
    @Param('paymentId') paymentId: string,
    @Res() res: any,
  ) {
    const organizationId = this.requireOrganizationId();
    const { buffer, filename } = await this.paymentReceiptService.pdf(
      organizationId,
      contractId,
      paymentId,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get(':paymentId/receipt/compose')
  @RequirePermissions({ entityType: 'Contract', action: 'Read' })
  composeReceipt(
    @Param('contractId') contractId: string,
    @Param('paymentId') paymentId: string,
  ) {
    const organizationId = this.requireOrganizationId();
    return this.paymentReceiptService.compose(organizationId, contractId, paymentId);
  }

  @Post(':paymentId/receipt/send')
  @RequirePermissions({ entityType: 'Contract', action: 'Update' })
  sendReceipt(
    @Param('contractId') contractId: string,
    @Param('paymentId') paymentId: string,
    @Body() body: { to_email?: string; cc?: string[]; extra_message?: string },
  ) {
    const organizationId = this.requireOrganizationId();
    return this.paymentReceiptService.send(organizationId, contractId, paymentId, body);
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

  @Patch(':paymentId/late-interest')
  @RequirePermissions({ entityType: 'Contract', action: 'Update' })
  async updateLateInterest(
    @Param('contractId') contractId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: UpdateLateInterestDto,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    return this.paymentsService.updateLateInterest(tenantId, paymentId, dto);
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

  private requireOrganizationId(): string {
    const organizationId = this.tenantContext.getCurrentTenantId();
    if (!organizationId) {
      throw new Error('Tenant context is required');
    }
    return organizationId;
  }
}
