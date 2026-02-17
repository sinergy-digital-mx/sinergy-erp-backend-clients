import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../../entities/payments/payment.entity';
import { Contract } from '../../entities/contracts/contract.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Contract]),
    RBACModule,
  ],
  providers: [PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
