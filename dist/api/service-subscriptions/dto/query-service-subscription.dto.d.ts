import { ServiceSubscriptionStatus } from '../../../entities/service-subscriptions/service-subscription-status.enum';
export declare class QueryServiceSubscriptionDto {
    search?: string;
    status?: ServiceSubscriptionStatus;
    page?: number;
    limit?: number;
}
