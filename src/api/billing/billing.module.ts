import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FiscalConfigurationController } from './fiscal-configuration.controller';
import { FiscalConfigurationService } from './fiscal-configuration.service';
import { BillingBranchController, BillingBranchAllController } from './billing-branch.controller';
import { BillingBranchService } from './billing-branch.service';
import { FiscalConfiguration } from '../../entities/billing/fiscal-configuration.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FiscalConfiguration, BillingBranch]),
    RBACModule,
  ],
  providers: [FiscalConfigurationService, BillingBranchService],
  controllers: [FiscalConfigurationController, BillingBranchController, BillingBranchAllController],
  exports: [FiscalConfigurationService, BillingBranchService],
})
export class BillingModule {}
