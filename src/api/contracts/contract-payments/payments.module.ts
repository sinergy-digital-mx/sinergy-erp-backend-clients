import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../../../entities/contracts/payment.entity';
import { Contract } from '../../../entities/contracts/contract.entity';
import { ContractDownpaymentPayment } from '../../../entities/contracts/contract-downpayment-payment.entity';
import { EmailTemplate } from '../../../entities/email-templates/email-template.entity';
import { FiscalConfiguration } from '../../../entities/billing/fiscal-configuration.entity';
import { RBACTenant } from '../../../entities/rbac/tenant.entity';
import { PaymentsService } from './payments.service';
import { PaymentReceiptService } from './payment-receipt.service';
import { PaymentsController } from './payments.controller';
import { RBACModule } from '../../rbac/rbac.module';
import { MailerConfigurationModule } from '../../mailer-configuration/mailer-configuration.module';
import { S3Service } from '../../../common/services/s3.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Contract,
      ContractDownpaymentPayment,
      EmailTemplate,
      FiscalConfiguration,
      RBACTenant,
    ]),
    RBACModule,
    MailerConfigurationModule,
  ],
  providers: [PaymentsService, PaymentReceiptService, S3Service],
  controllers: [PaymentsController],
  exports: [PaymentsService, PaymentReceiptService, TypeOrmModule],
})
export class PaymentsModule {}
