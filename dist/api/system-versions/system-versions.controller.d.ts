import { QuerySystemVersionsDto } from './dto/query-system-versions.dto';
import { SystemVersionsService } from './system-versions.service';
export declare class SystemVersionsController {
    private readonly systemVersionsService;
    constructor(systemVersionsService: SystemVersionsService);
    findLatest(req: any): Promise<import("./utils/tenant-release-list.util").TenantVersionListItem | null>;
    findAll(query: QuerySystemVersionsDto, req: any): Promise<import("./utils/tenant-release-list.util").PaginatedTenantReleases>;
    private getTenantId;
}
