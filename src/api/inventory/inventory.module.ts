import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryBatch } from '../../entities/purchase-orders/inventory-batch.entity';
import { InventoryTransfer } from '../../entities/inventory/inventory-transfer.entity';
import { InventoryTransferLine } from '../../entities/inventory/inventory-transfer-line.entity';
import { ProductPrice } from '../../entities/products/product-price.entity';
import { User } from '../../entities/users/user.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { S3Service } from '../../common/services/s3.service';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryTransferController } from './inventory-transfer.controller';
import { InventoryTransferService } from './services/inventory-transfer.service';
import { InventoryTransferFolioService } from './services/inventory-transfer-folio.service';
import { RBACModule } from '../rbac/rbac.module';
import { PurchaseOrdersModule } from '../purchase-orders/purchase-orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryBatch,
      InventoryTransfer,
      InventoryTransferLine,
      ProductPrice,
      User,
      Warehouse,
    ]),
    RBACModule,
    PurchaseOrdersModule,
  ],
  providers: [
    InventoryService,
    InventoryTransferService,
    InventoryTransferFolioService,
    S3Service,
  ],
  controllers: [InventoryController, InventoryTransferController],
  exports: [InventoryService, InventoryTransferService],
})
export class InventoryModule {}
