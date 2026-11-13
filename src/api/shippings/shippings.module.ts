import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shipping } from '../../entities/logistics/shipping.entity';
import { ShippingStop } from '../../entities/logistics/shipping-stop.entity';
import { Truck } from '../../entities/logistics/truck.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { User } from '../../entities/users/user.entity';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { SalesOrderDetail } from '../../entities/sales-orders/sales-order-detail.entity';
import { ElectronicInvoicingModule } from '../electronic-invoicing/electronic-invoicing.module';
import { CartaPorteService } from './services/carta-porte.service';
import { CartaPortePdfService } from './services/carta-porte-pdf.service';
import { CustomerAddress } from '../../entities/customers/customer-address.entity';
import { AuthModule } from '../auth/auth.module';
import { RBACModule } from '../rbac/rbac.module';
import { ShippingsController } from './shippings.controller';
import { ShippingsService } from './shippings.service';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Shipping,
      ShippingStop,
      Truck,
      Warehouse,
      BillingBranch,
      User,
      SalesOrder,
      SalesOrderDetail,
      CustomerAddress,
    ]),
    AuthModule,
    RBACModule,
    ElectronicInvoicingModule,
    InventoryModule,
  ],
  controllers: [ShippingsController],
  providers: [ShippingsService, CartaPorteService, CartaPortePdfService],
  exports: [ShippingsService],
})
export class ShippingsModule {}
