import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from '../../entities/contracts/contract.entity';
import { ContractDocument } from '../../entities/contracts/contract-document.entity';
import { Payment } from '../../entities/contracts/payment.entity';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { ContractDocumentsService } from './contract-documents.service';
import { ContractDocumentsController } from './contract-documents.controller';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { S3Service } from '../../common/services/s3.service';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contract, ContractDocument, Payment]),
    RBACModule,
  ],
  providers: [ContractsService, ContractDocumentsService, PaymentsService, S3Service],
  controllers: [ContractsController, ContractDocumentsController, PaymentsController],
  exports: [ContractsService, PaymentsService],
})
export class ContractsModule {}
