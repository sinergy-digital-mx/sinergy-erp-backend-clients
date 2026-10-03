import { ServiceSubscriptionBillingService } from './service-subscription-billing.service';
export declare class ServiceSubscriptionScheduler {
    private readonly billing;
    private readonly logger;
    constructor(billing: ServiceSubscriptionBillingService);
    billDueMonths(): Promise<void>;
}
