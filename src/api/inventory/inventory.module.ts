import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryBatch } from '../../entities/purchase-orders/inventory-batch.entity';
import { ProductPrice } from '../../entities/products/product-price.entity';
import { PosSession } from '../../entities/pos/pos-session.entity';
import { PosConfiguration } from '../../entities/billing/pos-configuration.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { S3Service } from '../../common/services/s3.service';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InventoryBatch, ProductPrice, PosSession, PosConfiguration, Warehouse]),
    RBACModule,
  ],
  providers: [InventoryService, S3Service],
  controllers: [InventoryController],
  exports: [InventoryService],
})
export class InventoryModule {}
