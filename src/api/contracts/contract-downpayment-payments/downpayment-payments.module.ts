import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from '../../../entities/contracts/contract.entity';
import { ContractDownpaymentPayment } from '../../../entities/contracts/contract-downpayment-payment.entity';
import { RBACModule } from '../../rbac/rbac.module';
import { DownpaymentPaymentsController } from './downpayment-payments.controller';
import { DownpaymentPaymentsService } from './downpayment-payments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContractDownpaymentPayment, Contract]),
    RBACModule,
  ],
  providers: [DownpaymentPaymentsService],
  controllers: [DownpaymentPaymentsController],
  exports: [DownpaymentPaymentsService],
})
export class DownpaymentPaymentsModule {}
