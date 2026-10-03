import { ServiceSubscription } from './service-subscription.entity';
import { ServiceSubscriptionPeriodStatus } from './service-subscription-period-status.enum';
import { SalesOrder } from '../sales-orders/sales-order.entity';
export declare class ServiceSubscriptionPeriod {
    id: string;
    tenant_id: string;
    subscription: ServiceSubscription;
    subscription_id: string;
    period_month: string;
    amount: number;
    status: ServiceSubscriptionPeriodStatus;
    sales_order: SalesOrder | null;
    sales_order_id: string | null;
    electronic_invoice_id: string | null;
    linked_manually: boolean;
    invoice_error: string | null;
    generated_at: Date | null;
    created_at: Date;
    updated_at: Date;
}
