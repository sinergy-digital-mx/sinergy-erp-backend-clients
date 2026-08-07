import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { InventoryBatch } from '../../entities/purchase-orders/inventory-batch.entity';
import { TenantModule, Module as ModuleEntity } from '../../entities/rbac';
import { AuthModule } from '../auth/auth.module';
import { RBACModule } from '../rbac/rbac.module';
import { TenantModuleValidationGuard } from '../auth/tenant-module-validation.guard';
import { SalesOrderFulfillmentService } from '../sales-orders/services/sales-order-fulfillment.service';
import { WarehouseControlController } from './warehouse-control.controller';
import { WarehouseControlService } from './warehouse-control.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesOrder,
      InventoryBatch,
      TenantModule,
      ModuleEntity,
    ]),
    AuthModule,
    RBACModule,
  ],
  controllers: [WarehouseControlController],
  providers: [
    WarehouseControlService,
    SalesOrderFulfillmentService,
    TenantModuleValidationGuard,
  ],
  exports: [WarehouseControlService],
})
export class WarehouseControlModule {}
