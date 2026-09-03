import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrderBatch, PurchaseOrderBatchDetail, InventoryBatch, PurchaseOrderDocument, PurchaseOrderDocumentType, PurchaseOrderPayment, PurchaseOrderLandedCostLine, PurchaseOrderActivity } from '../../entities/purchase-orders';
import { InventoryTransferLine } from '../../entities/inventory/inventory-transfer-line.entity';
import { InventoryTransfer } from '../../entities/inventory/inventory-transfer.entity';
import { InventoryAuditLine } from '../../entities/inventory/inventory-audit-line.entity';
import { InventoryAudit } from '../../entities/inventory/inventory-audit.entity';
import { SalesOrderBatchAllocation } from '../../entities/sales-orders/sales-order-batch-allocation.entity';
import { SalesOrderDetail } from '../../entities/sales-orders/sales-order-detail.entity';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { User } from '../../entities/users/user.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { FiscalConfiguration } from '../../entities/billing/fiscal-configuration.entity';
import { Product, ProductUoM, ProductVendorCost } from '../../entities/products';
import { UoMCatalog } from '../../entities/uom-catalog/uom-catalog.entity';
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
  PurchaseOrderLotsService,
  PurchaseOrderActivityService,
  PurchaseOrderMovementsService,
  PurchaseOrderRealCostService,
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
      PurchaseOrderLandedCostLine,
      PurchaseOrderActivity,
      InventoryTransferLine,
      InventoryTransfer,
      InventoryAuditLine,
      InventoryAudit,
      SalesOrderBatchAllocation,
      SalesOrderDetail,
      SalesOrder,
      User,
      Warehouse,
      BillingBranch,
      FiscalConfiguration,
      Product,
      ProductUoM,
      ProductVendorCost,
      UoMCatalog,
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
    PurchaseOrderLotsService,
    PurchaseOrderActivityService,
    PurchaseOrderMovementsService,
    PurchaseOrderRealCostService,
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
    PurchaseOrderLotsService,
    PurchaseOrderActivityService,
    PurchaseOrderMovementsService,
    PurchaseOrderRealCostService,
  ],
})
export class PurchaseOrdersModule {}
