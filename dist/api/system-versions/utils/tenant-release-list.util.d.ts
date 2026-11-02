import { ReleaseChange, ReleaseChannel, ReleasePayload } from './release-notes.util';
export interface TenantVersionListItem {
    id: string;
    version: string;
    build_id: string | null;
    channel: ReleaseChannel;
    title: string;
    changes: ReleaseChange[];
    released_at: string;
}
export interface PaginatedTenantReleases {
    data: TenantVersionListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export declare function listReleasesForTenant(releases: ReleasePayload[], enabledModuleCodes: Iterable<string>): TenantVersionListItem[];
export declare function paginateTenantReleases(items: TenantVersionListItem[], pageInput?: number, limitInput?: number, search?: string): PaginatedTenantReleases;
