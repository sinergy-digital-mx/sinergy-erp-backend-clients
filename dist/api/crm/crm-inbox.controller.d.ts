import { TenantContextService } from '../rbac/services/tenant-context.service';
import { QueryCrmActivityDto } from './dto/query-crm-activity.dto';
import { CrmInboxExportService } from './services/crm-inbox-export.service';
import { CrmInboxService } from './services/crm-inbox.service';
export declare class CrmInboxController {
    private readonly crmInboxService;
    private readonly crmInboxExportService;
    private readonly tenantContext;
    constructor(crmInboxService: CrmInboxService, crmInboxExportService: CrmInboxExportService, tenantContext: TenantContextService);
    findActivities(query: QueryCrmActivityDto, req: any): Promise<import("./dto/crm-activity-response.dto").CrmActivityListResponseDto>;
    getStats(query: QueryCrmActivityDto, req: any): Promise<import("./dto/crm-activity-response.dto").CrmActivityStatsResponseDto>;
    getAuthors(req: any): Promise<import("./dto/crm-activity-response.dto").CrmActivityAuthorsResponseDto>;
    exportExcel(query: QueryCrmActivityDto, req: any, res: any): Promise<void>;
    private requireTenantId;
}
