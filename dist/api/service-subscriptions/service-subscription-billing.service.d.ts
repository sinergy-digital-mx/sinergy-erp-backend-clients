import { DataSource, Repository } from 'typeorm';
import { ServiceSubscription } from '../../entities/service-subscriptions/service-subscription.entity';
import { ServiceSubscriptionPeriod } from '../../entities/service-subscriptions/service-subscription-period.entity';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { Product } from '../../entities/products/product.entity';
import { SalesOrderService } from '../sales-orders/services/sales-order.service';
import { ElectronicInvoiceService } from '../electronic-invoicing/services/electronic-invoice.service';
export declare class ServiceSubscriptionBillingService {
    private readonly periodRepo;
    private readonly salesOrderRepo;
    private readonly productRepo;
    private readonly dataSource;
    private readonly salesOrderService;
    private readonly electronicInvoiceService;
    private readonly logger;
    constructor(periodRepo: Repository<ServiceSubscriptionPeriod>, salesOrderRepo: Repository<SalesOrder>, productRepo: Repository<Product>, dataSource: DataSource, salesOrderService: SalesOrderService, electronicInvoiceService: ElectronicInvoiceService);
    billDuePeriods(): Promise<void>;
    generatePeriod(subscription: ServiceSubscription, period: ServiceSubscriptionPeriod, userId: string): Promise<ServiceSubscriptionPeriod>;
    stampPeriod(subscription: ServiceSubscription, period: ServiceSubscriptionPeriod, userId: string): Promise<ServiceSubscriptionPeriod>;
    findVigenteInvoice(tenantId: string, salesOrderId: string): Promise<import("../../entities/electronic-invoicing").ElectronicInvoice>;
    alignOrderDate(orderId: string, tenantId: string, date: string): Promise<void>;
    private stampOrder;
}
