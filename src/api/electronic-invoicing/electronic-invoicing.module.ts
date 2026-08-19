import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  FinkokProviderConfiguration,
  ElectronicInvoice,
  ElectronicInvoiceSyncLog,
} from '../../entities/electronic-invoicing';
import { FiscalConfiguration } from '../../entities/billing/fiscal-configuration.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { Customer } from '../../entities/customers/customer.entity';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { RBACModule } from '../rbac/rbac.module';
import { S3Service } from '../../common/services/s3.service';
import { FinkokProviderConfigurationController } from './finkok-provider-configuration.controller';
import { ElectronicInvoiceController } from './electronic-invoice.controller';
import { FinkokProviderConfigurationService } from './services/finkok-provider-configuration.service';
import { FinkokEncryptionService } from './services/finkok-encryption.service';
import { FinkokSoapClient } from './services/finkok-soap.client';
import { ElectronicInvoiceService } from './services/electronic-invoice.service';
import { ElectronicInvoicePdfService } from './services/electronic-invoice-pdf.service';
import { ElectronicInvoiceSatSyncService } from './services/electronic-invoice-sat-sync.service';
import { FiscalConfigurationFinkokService } from './services/fiscal-configuration-finkok.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinkokProviderConfiguration,
      ElectronicInvoice,
      ElectronicInvoiceSyncLog,
      FiscalConfiguration,
      BillingBranch,
      Customer,
      SalesOrder,
    ]),
    RBACModule,
  ],
  controllers: [
    FinkokProviderConfigurationController,
    ElectronicInvoiceController,
  ],
  providers: [
    FinkokEncryptionService,
    FinkokSoapClient,
    FinkokProviderConfigurationService,
    ElectronicInvoiceService,
    ElectronicInvoicePdfService,
    ElectronicInvoiceSatSyncService,
    FiscalConfigurationFinkokService,
    S3Service,
  ],
  exports: [
    ElectronicInvoiceService,
    ElectronicInvoicePdfService,
    FinkokProviderConfigurationService,
    FiscalConfigurationFinkokService,
    ElectronicInvoiceSatSyncService,
  ],
})
export class ElectronicInvoicingModule {}
