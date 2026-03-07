import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FiscalConfigurationController } from './fiscal-configuration.controller';
import { FiscalConfigurationService } from './fiscal-configuration.service';
import { FiscalConfiguration } from '../../entities/billing/fiscal-configuration.entity';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FiscalConfiguration]),
    RBACModule,
  ],
  providers: [FiscalConfigurationService],
  controllers: [FiscalConfigurationController],
  exports: [FiscalConfigurationService],
})
export class BillingModule {}
