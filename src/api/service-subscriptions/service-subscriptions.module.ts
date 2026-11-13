import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceSubscription } from '../../entities/service-subscriptions/service-subscription.entity';
import { ServiceSubscriptionPeriod } from '../../entities/service-subscriptions/service-subscription-period.entity';
import { Customer } from '../../entities/customers/customer.entity';
import { Product } from '../../entities/products/product.entity';
import { ProductUoM } from '../../entities/products/product-uom.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { SalesOrdersModule } from '../sales-orders/sales-orders.module';
import { ElectronicInvoicingModule } from '../electronic-invoicing/electronic-invoicing.module';
import { MailerConfigurationModule } from '../mailer-configuration/mailer-configuration.module';
import { RBACModule } from '../rbac/rbac.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { ServiceSubscriptionsController } from './service-subscriptions.controller';
import { ServiceSubscriptionsService } from './service-subscriptions.service';
import { ServiceSubscriptionBillingService } from './service-subscription-billing.service';
import { ServiceSubscriptionScheduler } from './service-subscription-scheduler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceSubscription,
      ServiceSubscriptionPeriod,
      Customer,
      Product,
      ProductUoM,
      BillingBranch,
      SalesOrder,
    ]),
    SalesOrdersModule,
    ElectronicInvoicingModule,
    MailerConfigurationModule,
    RBACModule,
    WhatsappModule,
  ],
  controllers: [ServiceSubscriptionsController],
  providers: [
    ServiceSubscriptionsService,
    ServiceSubscriptionBillingService,
    ServiceSubscriptionScheduler,
  ],
})
export class ServiceSubscriptionsModule {}
