import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosDailyShift } from '../../entities/pos/pos-daily-shift.entity';
import { PosPartialShift } from '../../entities/pos/pos-partial-shift.entity';
import { PosPartialShiftDenomination } from '../../entities/pos/pos-partial-shift-denomination.entity';
import { User } from '../../entities/users/user.entity';
import { UserBillingBranch } from '../../entities/users/user-billing-branch.entity';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { Quotation } from '../../entities/quotations/quotation.entity';
import { PosSaleCollection } from '../../entities/pos/pos-sale-collection.entity';
import { AdvanceShiftPayment } from '../../entities/pos/advance-shift-payment.entity';
import { SalesOrderPayment } from '../../entities/sales-orders/sales-order-payment.entity';
import { AdvanceShiftPaymentService } from './services/advance-shift-payment.service';
import { ExchangeRateModule } from '../exchange-rate/exchange-rate.module';
import { Customer } from '../../entities/customers/customer.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { RBACModule } from '../rbac/rbac.module';
import { SalesOrdersModule } from '../sales-orders/sales-orders.module';
import { QuotationsModule } from '../quotations/quotations.module';
import { CustomersModule } from '../customers/customers.module';
import { ElectronicInvoicingModule } from '../electronic-invoicing/electronic-invoicing.module';
import { PosShiftsService } from './pos-shifts.service';
import { PosShiftsController } from './pos-shifts.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PosDailyShift,
      PosPartialShift,
      PosPartialShiftDenomination,
      User,
      UserBillingBranch,
      SalesOrder,
      Quotation,
      Customer,
      PosSaleCollection,
      AdvanceShiftPayment,
      SalesOrderPayment,
      Warehouse,
    ]),
    RBACModule,
    forwardRef(() => SalesOrdersModule),
    forwardRef(() => QuotationsModule),
    CustomersModule,
    ExchangeRateModule,
    ElectronicInvoicingModule,
  ],
  controllers: [PosShiftsController],
  providers: [PosShiftsService, AdvanceShiftPaymentService],
  exports: [PosShiftsService, AdvanceShiftPaymentService],
})
export class PosShiftsModule {}
