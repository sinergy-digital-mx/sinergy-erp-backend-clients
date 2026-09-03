import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Quotation,
  QuotationDetail,
  QuotationDocument,
  QuotationDocumentType,
  QuotationEmail,
} from '../../entities/quotations';
import { AuthModule } from '../auth/auth.module';
import { RBACModule } from '../rbac/rbac.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductsModule } from '../products/products.module';
import { GlobalDiscountsModule } from '../global-discounts/global-discounts.module';
import { PosShiftsModule } from '../pos-shifts/pos-shifts.module';
import { SalesOrdersModule } from '../sales-orders/sales-orders.module';
import { MailerConfigurationModule } from '../mailer-configuration/mailer-configuration.module';
import { S3Service } from '../../common/services/s3.service';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { User } from '../../entities/users/user.entity';
import { Customer } from '../../entities/customers/customer.entity';
import { QuotationController } from './controllers/quotation.controller';
import { QuotationService } from './services/quotation.service';
import { QuotationFolioService } from './services/quotation-folio.service';
import { QuotationPdfService } from './services/quotation-pdf.service';
import { QuotationDocumentsService } from './services/quotation-documents.service';
import { QuotationEmailService } from './services/quotation-email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quotation,
      QuotationDetail,
      QuotationDocument,
      QuotationDocumentType,
      QuotationEmail,
      BillingBranch,
      Warehouse,
      User,
      Customer,
    ]),
    AuthModule,
    RBACModule,
    InventoryModule,
    ProductsModule,
    GlobalDiscountsModule,
    forwardRef(() => PosShiftsModule),
    forwardRef(() => SalesOrdersModule),
    MailerConfigurationModule,
  ],
  controllers: [QuotationController],
  providers: [
    QuotationService,
    QuotationFolioService,
    QuotationPdfService,
    QuotationDocumentsService,
    QuotationEmailService,
    S3Service,
  ],
  exports: [QuotationService],
})
export class QuotationsModule {}
