import { CustomerActivityType, CustomerActivityStatus } from '../../../entities/customers/customer-activity.entity';
export declare class QueryCustomerActivityDto {
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
    type?: CustomerActivityType;
    status?: CustomerActivityStatus;
    user_id?: string;
    outcome?: string;
    from_date?: string;
    to_date?: string;
}
