import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrderBatch, PurchaseOrderBatchDetail, InventoryBatch, PurchaseOrderDocument, PurchaseOrderDocumentType, PurchaseOrderPayment } from '../../entities/purchase-orders';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { Product, ProductUoM, ProductVendorCost } from '../../entities/products';
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
      Product,
      ProductUoM,
      ProductVendorCost,
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
