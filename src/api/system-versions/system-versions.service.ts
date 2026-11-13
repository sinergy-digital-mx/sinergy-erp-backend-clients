import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemVersion } from '../../entities/system-versions/system-version.entity';
import { SYSTEM_VERSION_RELEASES } from './data/releases.generated';
import { QuerySystemVersionsDto } from './dto/query-system-versions.dto';
import {
  listReleasesForTenant,
  PaginatedTenantReleases,
  paginateTenantReleases,
  TenantVersionListItem,
} from './utils/tenant-release-list.util';

export const SYSTEM_VERSIONS_MODULE_CODE = 'system-versions';
const TENANT_RELEASE_CACHE_MS = 60_000;

export type SystemVersionItem = TenantVersionListItem;
export type PaginatedSystemVersions = PaginatedTenantReleases;

@Injectable()
export class SystemVersionsService {
  private readonly cache = new Map<string, { expiresAt: number; items: SystemVersionItem[] }>();

  constructor(
    @InjectRepository(SystemVersion)
    private readonly versions: Repository<SystemVersion>,
  ) {}

  async findAll(tenantId: string, query: QuerySystemVersionsDto): Promise<PaginatedSystemVersions> {
    const items = await this.itemsForTenant(tenantId);
    return paginateTenantReleases(items, query?.page, query?.limit, query?.search);
  }

  async findLatest(tenantId: string): Promise<SystemVersionItem | null> {
    const items = await this.itemsForTenant(tenantId);
    return items[0] ?? null;
  }

  private async itemsForTenant(tenantId: string): Promise<SystemVersionItem[]> {
    const now = Date.now();
    const cached = this.cache.get(tenantId);
    if (cached && cached.expiresAt > now) {
      return cached.items;
    }

    const codes = await this.enabledModuleCodes(tenantId);
    const enabled = new Set(codes.map((code) => code.toLowerCase()));
    if (!enabled.has(SYSTEM_VERSIONS_MODULE_CODE)) {
      this.cache.delete(tenantId);
      throw new ForbiddenException('El módulo de versiones no está habilitado para esta organización');
    }

    const items = listReleasesForTenant(SYSTEM_VERSION_RELEASES, codes);
    this.cache.set(tenantId, { expiresAt: now + TENANT_RELEASE_CACHE_MS, items });
    return items;
  }

  private async enabledModuleCodes(tenantId: string): Promise<string[]> {
    const rows: Array<{ code: string }> = await this.versions.query(
      `
        SELECT m.code AS code
        FROM tenant_modules tm
        INNER JOIN modules m ON m.id = tm.module_id
        WHERE tm.tenant_id = ?
          AND tm.is_enabled = 1
      `,
      [tenantId],
    );
    return rows.map((row) => row.code);
  }
}
