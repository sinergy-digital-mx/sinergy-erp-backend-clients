import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  SalesOrder,
  SalesOrderDetail,
  SalesOrderBatchAllocation,
  SalesOrderDocument,
  SalesOrderDocumentType,
} from '../../entities/sales-orders';
import { InventoryBatch } from '../../entities/purchase-orders/inventory-batch.entity';
import { AuthModule } from '../auth/auth.module';
import { RBACModule } from '../rbac/rbac.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PosShiftsModule } from '../pos-shifts/pos-shifts.module';
import { ProductsModule } from '../products/products.module';
import { S3Service } from '../../common/services/s3.service';
import { SalesOrderController } from './controllers/sales-order.controller';
import { SalesOrderService } from './services/sales-order.service';
import { SalesOrderFolioService } from './services/sales-order-folio.service';
import { SalesOrderFulfillmentService } from './services/sales-order-fulfillment.service';
import { SalesOrderPdfService } from './services/sales-order-pdf.service';
import { SalesOrderDocumentsService } from './services/sales-order-documents.service';
import { SalesOrderPosReceiptService } from './services/sales-order-pos-receipt.service';
import { PosSaleCollection } from '../../entities/pos/pos-sale-collection.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesOrder,
      SalesOrderDetail,
      SalesOrderBatchAllocation,
      SalesOrderDocument,
      SalesOrderDocumentType,
      InventoryBatch,
      PosSaleCollection,
      BillingBranch,
    ]),
    AuthModule,
    RBACModule,
    InventoryModule,
    ProductsModule,
    forwardRef(() => PosShiftsModule),
  ],
  controllers: [SalesOrderController],
  providers: [
    SalesOrderService,
    SalesOrderFolioService,
    SalesOrderFulfillmentService,
    SalesOrderPdfService,
    SalesOrderDocumentsService,
    SalesOrderPosReceiptService,
    S3Service,
  ],
  exports: [SalesOrderService, SalesOrderPosReceiptService],
})
export class SalesOrdersModule {}
