import { Repository } from 'typeorm';
import { SystemVersion } from '../../entities/system-versions/system-version.entity';
import { QuerySystemVersionsDto } from './dto/query-system-versions.dto';
import { ReleaseChange } from './utils/release-notes.util';
export declare const SYSTEM_VERSIONS_MODULE_CODE = "system-versions";
export interface SystemVersionItem {
    id: string;
    version: string;
    build_id: string | null;
    channel: 'frontend' | 'backend' | 'full';
    title: string;
    changes: ReleaseChange[];
    released_at: string;
}
export interface PaginatedSystemVersions {
    data: SystemVersionItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export declare class SystemVersionsService {
    private readonly versions;
    private readonly syncedTenants;
    constructor(versions: Repository<SystemVersion>);
    findAll(tenantId: string, query: QuerySystemVersionsDto): Promise<PaginatedSystemVersions>;
    findLatest(tenantId: string): Promise<SystemVersionItem | null>;
    private assertModuleEnabled;
    private ensureCatalogOnce;
    private catalogReleases;
    private insertRelease;
    private toItem;
    private readChanges;
    private isDuplicate;
}
