import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryBatch } from '../../entities/purchase-orders/inventory-batch.entity';
import { Product } from '../../entities/products/product.entity';
import { InventoryTransfer } from '../../entities/inventory/inventory-transfer.entity';
import { InventoryTransferLine } from '../../entities/inventory/inventory-transfer-line.entity';
import { InventoryAudit } from '../../entities/inventory/inventory-audit.entity';
import { InventoryAuditLine } from '../../entities/inventory/inventory-audit-line.entity';
import { SalesOrderBatchAllocation } from '../../entities/sales-orders/sales-order-batch-allocation.entity';
import { ProductPrice } from '../../entities/products/product-price.entity';
import { ProductDiscount } from '../../entities/products/product-discount.entity';
import { ProductUoM } from '../../entities/products/product-uom.entity';
import { ProductVendorCost } from '../../entities/products/product-vendor-cost.entity';
import { User } from '../../entities/users/user.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { FiscalConfiguration } from '../../entities/billing/fiscal-configuration.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { UoMCatalog } from '../../entities/uom-catalog/uom-catalog.entity';
import { S3Service } from '../../common/services/s3.service';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryTransferController } from './inventory-transfer.controller';
import { InventoryAuditController } from './inventory-audit.controller';
import { InventoryTransferService } from './services/inventory-transfer.service';
import { InventoryTransferFolioService } from './services/inventory-transfer-folio.service';
import { InventoryTransferPdfService } from './services/inventory-transfer-pdf.service';
import { InventoryExportService } from './services/inventory-export.service';
import { InventoryAuditFolioService } from './services/inventory-audit-folio.service';
import { InventoryAuditService } from './services/inventory-audit.service';
import { InventoryBatchMovementsService } from './services/inventory-batch-movements.service';
import { RBACModule } from '../rbac/rbac.module';
import { PurchaseOrdersModule } from '../purchase-orders/purchase-orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryBatch,
      Product,
      InventoryTransfer,
      InventoryTransferLine,
      InventoryAudit,
      InventoryAuditLine,
      SalesOrderBatchAllocation,
      ProductPrice,
      ProductDiscount,
      ProductUoM,
      ProductVendorCost,
      User,
      Warehouse,
      FiscalConfiguration,
      BillingBranch,
      UoMCatalog,
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
    InventoryAuditFolioService,
    InventoryAuditService,
    InventoryBatchMovementsService,
    S3Service,
  ],
  controllers: [InventoryController, InventoryTransferController, InventoryAuditController],
  exports: [InventoryService, InventoryTransferService, InventoryAuditService],
})
export class InventoryModule {}
