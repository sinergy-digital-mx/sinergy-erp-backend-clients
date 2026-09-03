import { Repository } from 'typeorm';
import { CustomerActivity } from '../../entities/customers/customer-activity.entity';
import { Customer } from '../../entities/customers/customer.entity';
import { CreateCustomerActivityDto } from './dto/create-customer-activity.dto';
import { UpdateCustomerActivityDto } from './dto/update-customer-activity.dto';
import { QueryCustomerActivityDto } from './dto/query-customer-activity.dto';
export declare class CustomerActivitiesService {
    private activityRepo;
    private customerRepo;
    constructor(activityRepo: Repository<CustomerActivity>, customerRepo: Repository<Customer>);
    create(customerId: number, dto: CreateCustomerActivityDto, userId: string, tenantId: string): Promise<CustomerActivity>;
    findAll(customerId: number, query: QueryCustomerActivityDto, tenantId: string): Promise<{
        activities: CustomerActivity[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(customerId: number, activityId: string, tenantId: string): Promise<CustomerActivity>;
    update(customerId: number, activityId: string, dto: UpdateCustomerActivityDto, userId: string, tenantId: string): Promise<CustomerActivity>;
    remove(customerId: number, activityId: string, userId: string, tenantId: string): Promise<void>;
    getActivitySummary(customerId: number, tenantId: string): Promise<{
        total_activities: number;
        activities_by_type: Record<string, number>;
        activities_by_status: Record<string, number>;
        last_activity_date: Date | null;
        next_follow_up: Date | null;
    }>;
}
