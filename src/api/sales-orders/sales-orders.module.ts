import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrder, SalesOrderDetail, SalesOrderBatchAllocation } from '../../entities/sales-orders';
import { InventoryBatch } from '../../entities/purchase-orders/inventory-batch.entity';
import { AuthModule } from '../auth/auth.module';
import { RBACModule } from '../rbac/rbac.module';
import { SalesOrderController } from './controllers/sales-order.controller';
import { SalesOrderService } from './services/sales-order.service';
import { SalesOrderFolioService } from './services/sales-order-folio.service';
import { SalesOrderFulfillmentService } from './services/sales-order-fulfillment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesOrder,
      SalesOrderDetail,
      SalesOrderBatchAllocation,
      InventoryBatch,
    ]),
    AuthModule,
    RBACModule,
  ],
  controllers: [SalesOrderController],
  providers: [
    SalesOrderService,
    SalesOrderFolioService,
    SalesOrderFulfillmentService,
  ],
  exports: [SalesOrderService],
})
export class SalesOrdersModule {}
