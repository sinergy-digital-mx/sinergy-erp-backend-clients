import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { SalesOrderDetail } from '../../entities/sales-orders/sales-order-detail.entity';
import { SalesOrderBatchAllocation } from '../../entities/sales-orders/sales-order-batch-allocation.entity';
import { InventoryBatch } from '../../entities/purchase-orders/inventory-batch.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { TenantModule, Module as ModuleEntity } from '../../entities/rbac';
import {
  ControlDeskJob,
  ControlDeskPickTask,
  ControlDeskPickLine,
  ControlDeskPosition,
  UserWarehouseAssignment,
} from '../../entities/control-desk';
import { AuthModule } from '../auth/auth.module';
import { RBACModule } from '../rbac/rbac.module';
import { TenantModuleValidationGuard } from '../auth/tenant-module-validation.guard';
import { SalesOrderFulfillmentService } from '../sales-orders/services/sales-order-fulfillment.service';
import { WarehouseControlController } from './warehouse-control.controller';
import { WarehouseControlService } from './warehouse-control.service';
import { ControlDeskLifecycleService } from './control-desk-lifecycle.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesOrder,
      SalesOrderDetail,
      SalesOrderBatchAllocation,
      InventoryBatch,
      BillingBranch,
      Warehouse,
      ControlDeskJob,
      ControlDeskPickTask,
      ControlDeskPickLine,
      ControlDeskPosition,
      UserWarehouseAssignment,
      TenantModule,
      ModuleEntity,
    ]),
    AuthModule,
    RBACModule,
  ],
  controllers: [WarehouseControlController],
  providers: [
    WarehouseControlService,
    ControlDeskLifecycleService,
    SalesOrderFulfillmentService,
    TenantModuleValidationGuard,
  ],
  exports: [WarehouseControlService, ControlDeskLifecycleService],
})
export class WarehouseControlModule {}
