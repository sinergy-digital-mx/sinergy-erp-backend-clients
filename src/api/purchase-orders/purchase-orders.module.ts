import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrderController } from './purchase-order.controller';
import { LineItemController } from './line-item.controller';
import { PaymentController } from './payment.controller';
import { DocumentController } from './document.controller';
import { PurchaseOrderService } from './purchase-order.service';
import { LineItemService } from './line-item.service';
import { PaymentService } from './payment.service';
import { DocumentService } from './document.service';
import { TaxCalculationService } from './tax-calculation.service';
import { PurchaseOrder } from '../../entities/purchase-orders/purchase-order.entity';
import { LineItem } from '../../entities/purchase-orders/line-item.entity';
import { Payment } from '../../entities/purchase-orders/payment.entity';
import { Document } from '../../entities/purchase-orders/document.entity';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseOrder, LineItem, Payment, Document]),
    RBACModule,
  ],
  providers: [
    PurchaseOrderService,
    LineItemService,
    PaymentService,
    DocumentService,
    TaxCalculationService,
  ],
  controllers: [
    PurchaseOrderController,
    LineItemController,
    PaymentController,
    DocumentController,
  ],
  exports: [
    PurchaseOrderService,
    LineItemService,
    PaymentService,
    DocumentService,
    TaxCalculationService,
  ],
})
export class PurchaseOrdersModule {}
