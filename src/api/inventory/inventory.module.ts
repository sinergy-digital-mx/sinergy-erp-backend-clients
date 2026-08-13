import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryBatch } from '../../entities/purchase-orders/inventory-batch.entity';
import { InventoryTransfer } from '../../entities/inventory/inventory-transfer.entity';
import { InventoryTransferLine } from '../../entities/inventory/inventory-transfer-line.entity';
import { ProductPrice } from '../../entities/products/product-price.entity';
import { ProductDiscount } from '../../entities/products/product-discount.entity';
import { ProductUoM } from '../../entities/products/product-uom.entity';
import { ProductVendorCost } from '../../entities/products/product-vendor-cost.entity';
import { User } from '../../entities/users/user.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { FiscalConfiguration } from '../../entities/billing/fiscal-configuration.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { S3Service } from '../../common/services/s3.service';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryTransferController } from './inventory-transfer.controller';
import { InventoryTransferService } from './services/inventory-transfer.service';
import { InventoryTransferFolioService } from './services/inventory-transfer-folio.service';
import { InventoryTransferPdfService } from './services/inventory-transfer-pdf.service';
import { InventoryExportService } from './services/inventory-export.service';
import { RBACModule } from '../rbac/rbac.module';
import { PurchaseOrdersModule } from '../purchase-orders/purchase-orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryBatch,
      InventoryTransfer,
      InventoryTransferLine,
      ProductPrice,
      ProductDiscount,
      ProductUoM,
      ProductVendorCost,
      User,
      Warehouse,
      FiscalConfiguration,
      BillingBranch,
    ]),
    RBACModule,
    PurchaseOrdersModule,
  ],
  providers: [
    InventoryService,
    InventoryTransferService,
    InventoryTransferFolioService,
    InventoryTransferPdfService,
    InventoryExportService,
    S3Service,
  ],
  controllers: [InventoryController, InventoryTransferController],
  exports: [InventoryService, InventoryTransferService],
})
export class InventoryModule {}
