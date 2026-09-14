import { CustomerActivitiesService } from './customer-activities.service';
import { CreateCustomerActivityDto } from './dto/create-customer-activity.dto';
import { UpdateCustomerActivityDto } from './dto/update-customer-activity.dto';
import { QueryCustomerActivityDto } from './dto/query-customer-activity.dto';
import { TenantContextService } from '../rbac/services/tenant-context.service';
export declare class CustomerActivitiesController {
    private readonly activitiesService;
    private tenantContext;
    constructor(activitiesService: CustomerActivitiesService, tenantContext: TenantContextService);
    create(customerId: number, createActivityDto: CreateCustomerActivityDto, req: any): Promise<import("../../entities/customers/customer-activity.entity").CustomerActivity>;
    findAll(customerId: number, query: QueryCustomerActivityDto, req: any): Promise<{
        activities: import("../../entities/customers/customer-activity.entity").CustomerActivity[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getActivitySummary(customerId: number, req: any): Promise<{
        total_activities: number;
        activities_by_type: Record<string, number>;
        activities_by_status: Record<string, number>;
        last_activity_date: Date | null;
        next_follow_up: Date | null;
    }>;
    findOne(customerId: number, id: string, req: any): Promise<import("../../entities/customers/customer-activity.entity").CustomerActivity>;
    update(customerId: number, id: string, updateActivityDto: UpdateCustomerActivityDto, req: any): Promise<import("../../entities/customers/customer-activity.entity").CustomerActivity>;
}
