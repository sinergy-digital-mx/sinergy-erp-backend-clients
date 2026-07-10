import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FiscalConfigurationController } from './fiscal-configuration.controller';
import { FiscalConfigurationService } from './fiscal-configuration.service';
import { BillingBranchController, BillingBranchAllController } from './billing-branch.controller';
import { BillingBranchService } from './billing-branch.service';
import { FiscalConfiguration } from '../../entities/billing/fiscal-configuration.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { RBACModule } from '../rbac/rbac.module';
import { S3Service } from '../../common/services/s3.service';
import { ElectronicInvoicingModule } from '../electronic-invoicing/electronic-invoicing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FiscalConfiguration, BillingBranch, Warehouse]),
    RBACModule,
    forwardRef(() => ElectronicInvoicingModule),
  ],
  providers: [FiscalConfigurationService, BillingBranchService, S3Service],
  controllers: [FiscalConfigurationController, BillingBranchController, BillingBranchAllController],
  exports: [FiscalConfigurationService, BillingBranchService],
})
export class BillingModule {}
