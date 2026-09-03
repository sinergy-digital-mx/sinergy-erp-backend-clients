import { CustomerActivityType, CustomerActivityStatus } from '../../../entities/customers/customer-activity.entity';
export declare class UpdateCustomerActivityDto {
    type?: CustomerActivityType;
    status?: CustomerActivityStatus;
    title?: string;
    description?: string;
    duration_minutes?: number;
    outcome?: string;
    follow_up_date?: string;
    notes?: string;
    metadata?: Record<string, any>;
}
