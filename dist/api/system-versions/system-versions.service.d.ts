import { OnModuleInit } from '@nestjs/common';
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
export declare class SystemVersionsService implements OnModuleInit {
    private readonly versions;
    private readonly logger;
    constructor(versions: Repository<SystemVersion>);
    onModuleInit(): Promise<void>;
    findAll(tenantId: string, query: QuerySystemVersionsDto): Promise<PaginatedSystemVersions>;
    findLatest(tenantId: string): Promise<SystemVersionItem | null>;
    private assertModuleEnabled;
    private syncTenant;
    private catalogReleases;
    private insertRelease;
    private copyPeerReleases;
    private toItem;
    private readChanges;
    private isDuplicate;
}
