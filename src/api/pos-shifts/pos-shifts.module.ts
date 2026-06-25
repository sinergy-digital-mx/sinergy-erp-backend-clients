import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosDailyShift } from '../../entities/pos/pos-daily-shift.entity';
import { PosPartialShift } from '../../entities/pos/pos-partial-shift.entity';
import { PosPartialShiftDenomination } from '../../entities/pos/pos-partial-shift-denomination.entity';
import { User } from '../../entities/users/user.entity';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { PosSaleCollection } from '../../entities/pos/pos-sale-collection.entity';
import { Customer } from '../../entities/customers/customer.entity';
import { RBACModule } from '../rbac/rbac.module';
import { SalesOrdersModule } from '../sales-orders/sales-orders.module';
import { PosShiftsService } from './pos-shifts.service';
import { PosShiftsController } from './pos-shifts.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PosDailyShift,
      PosPartialShift,
      PosPartialShiftDenomination,
      User,
      SalesOrder,
      Customer,
      PosSaleCollection,
    ]),
    RBACModule,
    forwardRef(() => SalesOrdersModule),
  ],  controllers: [PosShiftsController],
  providers: [PosShiftsService],
  exports: [PosShiftsService],
})
export class PosShiftsModule {}
