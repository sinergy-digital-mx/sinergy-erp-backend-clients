import { QueryCrmActivityDto } from '../dto/query-crm-activity.dto';
import { CrmInboxService } from './crm-inbox.service';
export declare class CrmInboxExportService {
    private readonly inboxService;
    private readonly columns;
    constructor(inboxService: CrmInboxService);
    exportExcel(tenantId: string, actorUserId: string, hasAdminRole: boolean, query: QueryCrmActivityDto): Promise<Buffer>;
    getFilename(): string;
    private mapRow;
    private filterSubtitle;
}
