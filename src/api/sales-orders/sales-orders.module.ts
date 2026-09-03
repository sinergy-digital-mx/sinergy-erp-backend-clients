import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  SalesOrder,
  SalesOrderDetail,
  SalesOrderBatchAllocation,
  SalesOrderDocument,
  SalesOrderDocumentType,
  SalesOrderPayment,
  SalesOrderPaymentDocument,
} from '../../entities/sales-orders';
import { InventoryBatch } from '../../entities/purchase-orders/inventory-batch.entity';
import { AuthModule } from '../auth/auth.module';
import { RBACModule } from '../rbac/rbac.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PosShiftsModule } from '../pos-shifts/pos-shifts.module';
import { ProductsModule } from '../products/products.module';
import { GlobalDiscountsModule } from '../global-discounts/global-discounts.module';
import { S3Service } from '../../common/services/s3.service';
import { SalesOrderController } from './controllers/sales-order.controller';
import { SalesOrderService } from './services/sales-order.service';
import { SalesOrderFolioService } from './services/sales-order-folio.service';
import { SalesOrderFulfillmentService } from './services/sales-order-fulfillment.service';
import { SalesOrderPdfService } from './services/sales-order-pdf.service';
import { SalesOrderDocumentsService } from './services/sales-order-documents.service';
import { SalesOrderPosReceiptService } from './services/sales-order-pos-receipt.service';
import { SalesOrderExportService } from './services/sales-order-export.service';
import { PosSaleCollection } from '../../entities/pos/pos-sale-collection.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { User } from '../../entities/users/user.entity';
import { Customer } from '../../entities/customers/customer.entity';
import { ElectronicInvoicingModule } from '../electronic-invoicing/electronic-invoicing.module';
import { SalesOrderInvoicingService } from './services/sales-order-invoicing.service';
import { ShippingsModule } from '../shippings/shippings.module';
import { WarehouseControlModule } from '../warehouse-control/warehouse-control.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesOrder,
      SalesOrderDetail,
      SalesOrderBatchAllocation,
      SalesOrderDocument,
      SalesOrderDocumentType,
      SalesOrderPayment,
      SalesOrderPaymentDocument,
      InventoryBatch,
      PosSaleCollection,
      BillingBranch,
      Warehouse,
      User,
      Customer,
    ]),
    AuthModule,
    RBACModule,
    InventoryModule,
    ProductsModule,
    GlobalDiscountsModule,
    ElectronicInvoicingModule,
    forwardRef(() => PosShiftsModule),
    ShippingsModule,
    WarehouseControlModule,
  ],
  controllers: [SalesOrderController],
  providers: [
    SalesOrderService,
    SalesOrderFolioService,
    SalesOrderFulfillmentService,
    SalesOrderPdfService,
    SalesOrderDocumentsService,
    SalesOrderPosReceiptService,
    SalesOrderExportService,
    SalesOrderInvoicingService,
    S3Service,
  ],
  exports: [
    SalesOrderService,
    SalesOrderPosReceiptService,
    SalesOrderFulfillmentService,
    SalesOrderPdfService,
  ],
})
export class SalesOrdersModule {}
