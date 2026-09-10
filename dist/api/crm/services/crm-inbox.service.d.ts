import { Repository } from 'typeorm';
import { CustomerActivity } from '../../../entities/customers/customer-activity.entity';
import { User } from '../../../entities/users/user.entity';
import { CrmReportPeriod, QueryCrmActivityDto } from '../dto/query-crm-activity.dto';
import { CrmActivityAuthorsResponseDto, CrmActivityListResponseDto, CrmActivityStatsResponseDto } from '../dto/crm-activity-response.dto';
export declare class CrmInboxService {
    private readonly activityRepo;
    private readonly userRepo;
    constructor(activityRepo: Repository<CustomerActivity>, userRepo: Repository<User>);
    list(tenantId: string, actorUserId: string, hasAdminRole: boolean, query: QueryCrmActivityDto): Promise<CrmActivityListResponseDto>;
    stats(tenantId: string, actorUserId: string, hasAdminRole: boolean, query: QueryCrmActivityDto): Promise<CrmActivityStatsResponseDto>;
    authors(tenantId: string, actorUserId: string, hasAdminRole: boolean): Promise<CrmActivityAuthorsResponseDto>;
    private loadAttention;
    private baseQuery;
    private countQuery;
    private applyScope;
    private applyListFilters;
    private applySearchAndType;
    private applyAttention;
    private resolveCrmAdmin;
    private resolveScopeUserId;
    resolveDateRange(period: CrmReportPeriod, dateFrom?: string, dateTo?: string): {
        dateFrom: Date;
        dateTo: Date;
    };
    private mapActivity;
    private mapCustomer;
    private mapUser;
    private displayUserName;
    private toCountMap;
    private periodLabel;
    private parseDateOnly;
    private startOfDay;
    private endOfDay;
    private toDateOnly;
}
