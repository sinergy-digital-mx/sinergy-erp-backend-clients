import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerDebtLedger } from '../../entities/accounting/customer-debt-ledger.entity';
import { CustomerCreditLedger } from '../../entities/accounting/customer-credit-ledger.entity';
import { CustomerDebtLedgerService } from './services/customer-debt-ledger.service';
import { CustomerDebtFlowService } from './services/customer-debt-flow.service';
import { CustomerCreditLedgerService } from './services/customer-credit-ledger.service';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerDebtLedger, CustomerCreditLedger])],
  providers: [CustomerDebtLedgerService, CustomerDebtFlowService, CustomerCreditLedgerService],
  exports: [
    CustomerDebtLedgerService,
    CustomerDebtFlowService,
    CustomerCreditLedgerService,
    TypeOrmModule,
  ],
})
export class CustomerDebtLedgerModule {}
