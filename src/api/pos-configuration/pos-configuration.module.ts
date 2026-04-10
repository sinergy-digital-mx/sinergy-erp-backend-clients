import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosConfiguration } from '../../entities/billing/pos-configuration.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { PosConfigurationController } from './pos-configuration.controller';
import { PosConfigurationService } from './pos-configuration.service';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PosConfiguration, BillingBranch]),
    RBACModule,
  ],
  controllers: [PosConfigurationController],
  providers: [PosConfigurationService],
  exports: [PosConfigurationService],
})
export class PosConfigurationModule {}
