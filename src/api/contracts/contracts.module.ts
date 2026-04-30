import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from '../../entities/contracts/contract.entity';
import { ContractDocument } from '../../entities/contracts/contract-document.entity';
import { Payment } from '../../entities/contracts/payment.entity';
import { PaymentDocument } from '../../entities/contracts/payment-document.entity';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { ContractsExportService } from './contracts-export.service';
import { ContractPdfService } from './contract-pdf.service';
import { ContractDocumentsService } from './contract-documents.service';
import { ContractDocumentsController } from './contract-documents.controller';
import { PaymentDocumentsService } from './payment-documents.service';
import { PaymentDocumentsController } from './payment-documents.controller';
import { ContractsMaintenanceService } from './contracts-maintenance.service';
import { S3Service } from '../../common/services/s3.service';
import { RBACModule } from '../rbac/rbac.module';
import { PaymentsModule } from './contract-payments/payments.module';
import { HoaPaymentsModule } from './contract-hoa-payments/hoa-payments.module';
import { DownpaymentPaymentsModule } from './contract-downpayment-payments/downpayment-payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contract, ContractDocument, Payment, PaymentDocument]),
    RBACModule,
    PaymentsModule,
    HoaPaymentsModule,
    DownpaymentPaymentsModule,
  ],
  providers: [
    ContractsService,
    ContractsExportService,
    ContractPdfService,
    ContractDocumentsService,
    PaymentDocumentsService,
    ContractsMaintenanceService,
    S3Service,
  ],
  controllers: [
    ContractsController,
    ContractDocumentsController,
    PaymentDocumentsController,
  ],
  exports: [ContractsService],
})
export class ContractsModule {}
