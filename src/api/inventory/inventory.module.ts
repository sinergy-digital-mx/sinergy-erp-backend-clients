import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { ValuationService } from './valuation.service';
import { InventoryItem } from '../../entities/inventory/inventory-item.entity';
import { InventoryMovement } from '../../entities/inventory/inventory-movement.entity';
import { StockReservation } from '../../entities/inventory/stock-reservation.entity';
import { Product } from '../../entities/products/product.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { UoM } from '../../entities/products/uom.entity';
import { RBACModule } from '../rbac/rbac.module';
import { ProductsModule } from '../products/products.module';
import { WarehouseModule } from '../warehouse/warehouse.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryItem,
      InventoryMovement,
      StockReservation,
      Product,
      Warehouse,
      UoM,
    ]),
    RBACModule,
    ProductsModule,
    WarehouseModule,
  ],
  providers: [InventoryService, ValuationService],
  controllers: [InventoryController],
  exports: [InventoryService, ValuationService],
})
export class InventoryModule {}
