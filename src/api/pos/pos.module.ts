import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { POSController } from './pos.controller';
import { POSService } from './pos.service';
import { CashShiftService } from './cash-shift.service';
import { POSReportService } from './pos-report.service';
import { POSOrder } from '../../entities/pos/pos-order.entity';
import { POSOrderLine } from '../../entities/pos/pos-order-line.entity';
import { POSPayment } from '../../entities/pos/pos-payment.entity';
import { CashShift } from '../../entities/pos/cash-shift.entity';
import { POSTable } from '../../entities/pos/pos-table.entity';
import { Product } from '../../entities/products/product.entity';
import { VendorProductPrice } from '../../entities/products/vendor-product-price.entity';
import { RBACModule } from '../rbac/rbac.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductsModule } from '../products/products.module';
import { WarehouseModule } from '../warehouse/warehouse.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      POSOrder,
      POSOrderLine,
      POSPayment,
      CashShift,
      POSTable,
      Product,
      VendorProductPrice,
    ]),
    RBACModule,
    forwardRef(() => InventoryModule),
    ProductsModule,
    WarehouseModule,
  ],
  providers: [POSService, CashShiftService, POSReportService],
  controllers: [POSController],
  exports: [POSService, CashShiftService, POSReportService],
})
export class POSModule {}
