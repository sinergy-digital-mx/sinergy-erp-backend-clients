import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shipping } from '../../entities/logistics/shipping.entity';
import { ShippingStop } from '../../entities/logistics/shipping-stop.entity';
import { Truck } from '../../entities/logistics/truck.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { User } from '../../entities/users/user.entity';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { CustomerAddress } from '../../entities/customers/customer-address.entity';
import { AuthModule } from '../auth/auth.module';
import { RBACModule } from '../rbac/rbac.module';
import { ShippingsController } from './shippings.controller';
import { ShippingsService } from './shippings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Shipping,
      ShippingStop,
      Truck,
      Warehouse,
      User,
      SalesOrder,
      CustomerAddress,
    ]),
    AuthModule,
    RBACModule,
  ],
  controllers: [ShippingsController],
  providers: [ShippingsService],
  exports: [ShippingsService],
})
export class ShippingsModule {}
