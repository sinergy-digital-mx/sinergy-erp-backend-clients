import { QuerySystemVersionsDto } from './dto/query-system-versions.dto';
import { SystemVersionsService } from './system-versions.service';
export declare class SystemVersionsController {
    private readonly systemVersionsService;
    constructor(systemVersionsService: SystemVersionsService);
    findLatest(req: any): Promise<import("./system-versions.service").SystemVersionItem | null>;
    findAll(query: QuerySystemVersionsDto, req: any): Promise<import("./system-versions.service").PaginatedSystemVersions>;
    private getTenantId;
}
