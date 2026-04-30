import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from '../../../entities/contracts/contract.entity';
import { ContractHoaPayment } from '../../../entities/contracts/contract-hoa-payment.entity';
import { RBACModule } from '../../rbac/rbac.module';
import { HoaPaymentsController } from './hoa-payments.controller';
import { HoaPaymentsService } from './hoa-payments.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContractHoaPayment, Contract]), RBACModule],
  providers: [HoaPaymentsService],
  controllers: [HoaPaymentsController],
  exports: [HoaPaymentsService],
})
export class HoaPaymentsModule {}
