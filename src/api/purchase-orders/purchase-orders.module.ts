import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrderBatch, PurchaseOrderBatchDetail, InventoryBatch, PurchaseOrderDocument, PurchaseOrderDocumentType, PurchaseOrderPayment } from '../../entities/purchase-orders';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { FiscalConfiguration } from '../../entities/billing/fiscal-configuration.entity';
import { Product, ProductUoM, ProductVendorCost } from '../../entities/products';
import { Vendor } from '../../entities/vendor/vendor.entity';
import { TenantModule, Module as ModuleEntity } from '../../entities/rbac';
import { AuthModule } from '../auth/auth.module';
import { S3Service } from '../../common/services/s3.service';
import { PurchaseOrderController, VendorProductsController, PurchaseOrderDocumentsController, ReceiptController, InventoryBatchController } from './controllers';
import {
  PurchaseOrderService,
  VendorProductsService,
  BatchNumberGeneratorService,
  UnitConversionService,
  FolioGeneratorService,
  PurchaseOrderDocumentsService,
  PurchaseOrderPdfService,
  ReceiptService,
  ReceiptValidatorService,
  LineItemUpdaterService,
  BatchCreatorService,
  TotalCalculatorService,
  POStatusUpdaterService,
  TenantValidatorService,
  InventoryBatchService,
  PurchaseOrderExportService,
} from './services';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseOrderBatch,
      PurchaseOrderBatchDetail,
      InventoryBatch,
      PurchaseOrderDocument,
      PurchaseOrderDocumentType,
      PurchaseOrderPayment,
      Warehouse,
      BillingBranch,
      FiscalConfiguration,
      Product,
      ProductUoM,
      ProductVendorCost,
      Vendor,
      TenantModule,
      ModuleEntity,
    ]),
    AuthModule,
  ],
  controllers: [PurchaseOrderController, VendorProductsController, PurchaseOrderDocumentsController, ReceiptController, InventoryBatchController],
  providers: [
    PurchaseOrderService,
    VendorProductsService,
    BatchNumberGeneratorService,
    UnitConversionService,
    FolioGeneratorService,
    PurchaseOrderDocumentsService,
    PurchaseOrderPdfService,
    ReceiptService,
    ReceiptValidatorService,
    LineItemUpdaterService,
    BatchCreatorService,
    TotalCalculatorService,
    POStatusUpdaterService,
    TenantValidatorService,
    InventoryBatchService,
    PurchaseOrderExportService,
    S3Service,
  ],
  exports: [
    PurchaseOrderService,
    VendorProductsService,
    BatchNumberGeneratorService,
    UnitConversionService,
    FolioGeneratorService,
    PurchaseOrderDocumentsService,
    PurchaseOrderPdfService,
    ReceiptService,
    ReceiptValidatorService,
    LineItemUpdaterService,
    BatchCreatorService,
    TotalCalculatorService,
    POStatusUpdaterService,
    TenantValidatorService,
    InventoryBatchService,
  ],
})
export class PurchaseOrdersModule {}
