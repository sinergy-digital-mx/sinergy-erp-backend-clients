import { TenantContextService } from '../rbac/services/tenant-context.service';
import { QueryCrmActivityDto } from './dto/query-crm-activity.dto';
import { CrmInboxService } from './services/crm-inbox.service';
export declare class CrmInboxController {
    private readonly crmInboxService;
    private readonly tenantContext;
    constructor(crmInboxService: CrmInboxService, tenantContext: TenantContextService);
    findActivities(query: QueryCrmActivityDto, req: any): Promise<import("./dto/crm-activity-response.dto").CrmActivityListResponseDto>;
    getStats(query: QueryCrmActivityDto, req: any): Promise<import("./dto/crm-activity-response.dto").CrmActivityStatsResponseDto>;
    getAuthors(req: any): Promise<import("./dto/crm-activity-response.dto").CrmActivityAuthorsResponseDto>;
    private requireTenantId;
}
