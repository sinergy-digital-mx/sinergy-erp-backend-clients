import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { SalesOrderPayment } from '../../entities/sales-orders/sales-order-payment.entity';
import { PosSaleCollection } from '../../entities/pos/pos-sale-collection.entity';
import { PosDailyShift } from '../../entities/pos/pos-daily-shift.entity';
import { PosPartialShift } from '../../entities/pos/pos-partial-shift.entity';
import { ElectronicInvoice } from '../../entities/electronic-invoicing/electronic-invoice.entity';
import { PurchaseOrderBatch } from '../../entities/purchase-orders/purchase-order-batch.entity';
import { Vendor } from '../../entities/vendor/vendor.entity';
import { VendorModule } from '../vendor/vendor.module';
import { User } from '../../entities/users/user.entity';
import { FiscalConfiguration } from '../../entities/billing/fiscal-configuration.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { GlobalInvoice } from '../../entities/accounting/global-invoice.entity';
import { GlobalInvoiceAutoRun } from '../../entities/accounting/global-invoice-auto-run.entity';
import { GlobalInvoiceOrder } from '../../entities/accounting/global-invoice-order.entity';
import { RBACModule } from '../rbac/rbac.module';
import { ElectronicInvoicingModule } from '../electronic-invoicing/electronic-invoicing.module';
import { PosShiftsModule } from '../pos-shifts/pos-shifts.module';
import { ExchangeRateModule } from '../exchange-rate/exchange-rate.module';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { AverageCostReportService } from './services/average-cost-report.service';
import { GlobalInvoiceAutoService } from './services/global-invoice-auto.service';
import { GlobalInvoiceService } from './services/global-invoice.service';
import { CustomerDebtLedgerModule } from './customer-debt-ledger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesOrder,
      SalesOrderPayment,
      PosSaleCollection,
      PosDailyShift,
      PosPartialShift,
      ElectronicInvoice,
      PurchaseOrderBatch,
      Vendor,
      User,
      FiscalConfiguration,
      BillingBranch,
      GlobalInvoice,
      GlobalInvoiceAutoRun,
      GlobalInvoiceOrder,
    ]),
    RBACModule,
    ElectronicInvoicingModule,
    VendorModule,
    PosShiftsModule,
    ExchangeRateModule,
    CustomerDebtLedgerModule,
  ],
  controllers: [AccountingController],
  providers: [
    AccountingService,
    AverageCostReportService,
    GlobalInvoiceService,
    GlobalInvoiceAutoService,
  ],
  exports: [AccountingService],
})
export class AccountingModule {}
