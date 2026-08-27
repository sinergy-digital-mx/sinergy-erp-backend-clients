import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { Customer } from '../../entities/customers/customer.entity';
import { CustomerStatus } from '../../entities/customers/customer-status.entity';
import { ElectronicInvoicingModule } from '../electronic-invoicing/electronic-invoicing.module';
import { SelfInvoiceController } from './self-invoice.controller';
import { SelfInvoiceService } from './self-invoice.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalesOrder, Customer, CustomerStatus]),
    ElectronicInvoicingModule,
  ],
  controllers: [SelfInvoiceController],
  providers: [SelfInvoiceService],
  exports: [SelfInvoiceService],
})
export class SelfInvoiceModule {}
