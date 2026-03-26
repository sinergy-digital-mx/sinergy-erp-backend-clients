import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from '../../entities/contracts/contract.entity';
import { ContractDocument } from '../../entities/contracts/contract-document.entity';
import { Payment } from '../../entities/payments/payment.entity';
import { PaymentDocument } from '../../entities/contracts/payment-document.entity';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { ContractDocumentsService } from './contract-documents.service';
import { ContractDocumentsController } from './contract-documents.controller';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentDocumentsService } from './payment-documents.service';
import { PaymentDocumentsController } from './payment-documents.controller';
import { ContractsMaintenanceService } from './contracts-maintenance.service';
import { S3Service } from '../../common/services/s3.service';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contract, ContractDocument, Payment, PaymentDocument]),
    RBACModule,
  ],
  providers: [
    ContractsService,
    ContractDocumentsService,
    PaymentsService,
    PaymentDocumentsService,
    ContractsMaintenanceService,
    S3Service,
  ],
  controllers: [
    ContractsController,
    ContractDocumentsController,
    PaymentsController,
    PaymentDocumentsController,
  ],
  exports: [ContractsService, PaymentsService],
})
export class ContractsModule {}
