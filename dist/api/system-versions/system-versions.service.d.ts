import { Repository } from 'typeorm';
import { SystemVersion } from '../../entities/system-versions/system-version.entity';
import { QuerySystemVersionsDto } from './dto/query-system-versions.dto';
import { PaginatedTenantReleases, TenantVersionListItem } from './utils/tenant-release-list.util';
export declare const SYSTEM_VERSIONS_MODULE_CODE = "system-versions";
export type SystemVersionItem = TenantVersionListItem;
export type PaginatedSystemVersions = PaginatedTenantReleases;
export declare class SystemVersionsService {
    private readonly versions;
    private readonly cache;
    constructor(versions: Repository<SystemVersion>);
    findAll(tenantId: string, query: QuerySystemVersionsDto): Promise<PaginatedSystemVersions>;
    findLatest(tenantId: string): Promise<SystemVersionItem | null>;
    private itemsForTenant;
    private enabledModuleCodes;
}
