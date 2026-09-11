import { Repository } from 'typeorm';
import { CustomerActivity } from '../../entities/customers/customer-activity.entity';
import { Customer } from '../../entities/customers/customer.entity';
import { CreateCustomerActivityDto } from './dto/create-customer-activity.dto';
import { UpdateCustomerActivityDto } from './dto/update-customer-activity.dto';
import { QueryCustomerActivityDto } from './dto/query-customer-activity.dto';
type ActivityUserDto = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    display_name: string;
};
type ActivityResponse = Omit<CustomerActivity, 'user'> & {
    user: ActivityUserDto | null;
};
export declare class CustomerActivitiesService {
    private activityRepo;
    private customerRepo;
    constructor(activityRepo: Repository<CustomerActivity>, customerRepo: Repository<Customer>);
    create(customerId: number, dto: CreateCustomerActivityDto, userId: string, tenantId: string): Promise<ActivityResponse>;
    findAll(customerId: number, query: QueryCustomerActivityDto, tenantId: string): Promise<{
        activities: ActivityResponse[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(customerId: number, activityId: string, tenantId: string): Promise<ActivityResponse>;
    update(customerId: number, activityId: string, dto: UpdateCustomerActivityDto, userId: string, tenantId: string): Promise<ActivityResponse>;
    remove(customerId: number, activityId: string, userId: string, tenantId: string): Promise<void>;
    getActivitySummary(customerId: number, tenantId: string): Promise<{
        total_activities: number;
        activities_by_type: Record<string, number>;
        activities_by_status: Record<string, number>;
        last_activity_date: Date | null;
        next_follow_up: Date | null;
    }>;
    private mapActivity;
    private mapUser;
}
export {};
