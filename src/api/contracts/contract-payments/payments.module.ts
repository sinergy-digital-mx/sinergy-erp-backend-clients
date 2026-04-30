import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../../../entities/contracts/payment.entity';
import { Contract } from '../../../entities/contracts/contract.entity';
import { ContractDownpaymentPayment } from '../../../entities/contracts/contract-downpayment-payment.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { RBACModule } from '../../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Contract, ContractDownpaymentPayment]),
    RBACModule,
  ],
  providers: [PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService, TypeOrmModule],
})
export class PaymentsModule {}