import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FiscalConfiguration } from '../../entities/billing/fiscal-configuration.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { Product } from '../../entities/products/product.entity';
import { ProductUoM } from '../../entities/products/product-uom.entity';
import { ProductPrice } from '../../entities/products/product-price.entity';
import { ProductVendorCost } from '../../entities/products/product-vendor-cost.entity';
import { PriceList } from '../../entities/products/price-list.entity';
import { Vendor } from '../../entities/vendor/vendor.entity';
import { UoMCatalog } from '../../entities/uom-catalog/uom-catalog.entity';
import { InventoryBatch } from '../../entities/purchase-orders/inventory-batch.entity';
import { PurchaseOrdersModule } from '../purchase-orders/purchase-orders.module';
import { RBACModule } from '../rbac/rbac.module';
import { MadereriaInventoryImportController } from './madereria-inventory-import.controller';
import { MadereriaInventoryImportService } from './madereria-inventory-import.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FiscalConfiguration,
      BillingBranch,
      Warehouse,
      Product,
      ProductUoM,
      ProductPrice,
      ProductVendorCost,
      PriceList,
      Vendor,
      UoMCatalog,
      InventoryBatch,
    ]),
    PurchaseOrdersModule,
    RBACModule,
  ],
  controllers: [MadereriaInventoryImportController],
  providers: [MadereriaInventoryImportService],
})
export class MadereriaInventoryImportModule {}
