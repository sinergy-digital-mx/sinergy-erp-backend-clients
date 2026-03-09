import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrderController } from './sales-order.controller';
import { SalesOrderService } from './sales-order.service';
import { TaxCalculationService } from './tax-calculation.service';
import { SalesOrder, SalesOrderLine } from '../../entities/sales-orders';
import { RBACModule } from '../rbac/rbac.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalesOrder, SalesOrderLine]),
    RBACModule,
    forwardRef(() => InventoryModule),
  ],
  providers: [SalesOrderService, TaxCalculationService],
  controllers: [SalesOrderController],
  exports: [SalesOrderService],
})
export class SalesOrdersModule {}
