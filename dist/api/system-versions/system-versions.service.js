"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SystemVersionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemVersionsService = exports.SYSTEM_VERSIONS_MODULE_CODE = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const system_version_entity_1 = require("../../entities/system-versions/system-version.entity");
const releases_generated_1 = require("./data/releases.generated");
const release_notes_util_1 = require("./utils/release-notes.util");
exports.SYSTEM_VERSIONS_MODULE_CODE = 'system-versions';
let SystemVersionsService = SystemVersionsService_1 = class SystemVersionsService {
    versions;
    logger = new common_1.Logger(SystemVersionsService_1.name);
    constructor(versions) {
        this.versions = versions;
    }
    async onModuleInit() {
        try {
            const tenants = await this.versions.query(`
          SELECT tm.tenant_id AS tenant_id
          FROM tenant_modules tm
          INNER JOIN modules m ON m.id = tm.module_id
          WHERE m.code = ? AND tm.is_enabled = 1
        `, [exports.SYSTEM_VERSIONS_MODULE_CODE]);
            for (const tenant of tenants) {
                await this.syncTenant(tenant.tenant_id);
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'error desconocido';
            this.logger.warn(`No se sincronizaron las versiones: ${message}`);
        }
    }
    async findAll(tenantId, query) {
        await this.assertModuleEnabled(tenantId);
        await this.syncTenant(tenantId);
        let page = Number(query?.page) || 1;
        let limit = Number(query?.limit) || 20;
        if (page < 1)
            page = 1;
        if (limit < 1)
            limit = 1;
        if (limit > 50)
            limit = 50;
        const qb = this.versions
            .createQueryBuilder('sv')
            .where('sv.tenant_id = :tenantId', { tenantId });
        const search = query?.search?.trim();
        if (search) {
            qb.andWhere(`(sv.version LIKE :search OR sv.title LIKE :search OR CAST(sv.changes AS CHAR) LIKE :search)`, { search: `%${search}%` });
        }
        qb.orderBy('sv.released_at', 'DESC').addOrderBy('sv.created_at', 'DESC');
        const total = await qb.getCount();
        const rows = await qb
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();
        const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
        return {
            data: rows.map((row) => this.toItem(row)),
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1 && totalPages > 0,
        };
    }
    async findLatest(tenantId) {
        const page = await this.findAll(tenantId, { page: 1, limit: 1 });
        return page.data[0] ?? null;
    }
    async assertModuleEnabled(tenantId) {
        const rows = await this.versions.query(`
        SELECT 1 AS ok
        FROM tenant_modules tm
        INNER JOIN modules m ON m.id = tm.module_id
        WHERE tm.tenant_id = ?
          AND m.code = ?
          AND tm.is_enabled = 1
        LIMIT 1
      `, [tenantId, exports.SYSTEM_VERSIONS_MODULE_CODE]);
        if (!rows.length) {
            throw new common_1.ForbiddenException('El módulo de versiones no está habilitado para esta organización');
        }
    }
    async syncTenant(tenantId) {
        for (const release of this.catalogReleases()) {
            await this.insertRelease(tenantId, release);
        }
        await this.copyPeerReleases(tenantId);
    }
    catalogReleases() {
        return releases_generated_1.SYSTEM_VERSION_RELEASES.map((release) => ({
            releaseKey: release.releaseKey,
            version: release.version,
            buildId: release.buildId,
            channel: release.channel,
            title: release.title,
            changes: (0, release_notes_util_1.sanitizeReleaseChanges)(release.changes),
            releasedAt: release.releasedAt,
        }));
    }
    async insertRelease(tenantId, release) {
        const changes = (0, release_notes_util_1.sanitizeReleaseChanges)(release.changes);
        try {
            await this.versions.query(`
          INSERT INTO system_versions (
            id, tenant_id, release_key, version, build_id, channel, title, changes, released_at, created_at, updated_at
          )
          SELECT UUID(), ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
          FROM DUAL
          WHERE NOT EXISTS (
            SELECT 1 FROM system_versions
            WHERE tenant_id = ? AND release_key = ?
          )
        `, [
                tenantId,
                release.releaseKey,
                release.version,
                release.buildId,
                release.channel,
                release.title.slice(0, 180),
                JSON.stringify(changes),
                (0, release_notes_util_1.toSqlDateTime)(release.releasedAt),
                tenantId,
                release.releaseKey,
            ]);
        }
        catch (error) {
            if (!this.isDuplicate(error)) {
                throw error;
            }
        }
    }
    async copyPeerReleases(tenantId) {
        try {
            await this.versions.query(`
          INSERT INTO system_versions (
            id, tenant_id, release_key, version, build_id, channel, title, changes, released_at, created_at, updated_at
          )
          SELECT
            UUID(), ?, src.release_key, src.version, src.build_id, src.channel,
            src.title, src.changes, src.released_at, NOW(), NOW()
          FROM system_versions src
          INNER JOIN (
            SELECT release_key, MIN(id) AS id
            FROM system_versions
            GROUP BY release_key
          ) picked ON picked.id = src.id
          WHERE NOT EXISTS (
            SELECT 1 FROM system_versions existing
            WHERE existing.tenant_id = ? AND existing.release_key = src.release_key
          )
        `, [tenantId, tenantId]);
        }
        catch (error) {
            if (!this.isDuplicate(error)) {
                throw error;
            }
        }
    }
    toItem(row) {
        const released = row.released_at instanceof Date
            ? row.released_at.toISOString()
            : String(row.released_at);
        return {
            id: row.id,
            version: row.version,
            build_id: row.build_id,
            channel: row.channel,
            title: row.title,
            changes: this.readChanges(row.changes),
            released_at: released,
        };
    }
    readChanges(value) {
        if (typeof value === 'string') {
            try {
                return (0, release_notes_util_1.sanitizeReleaseChanges)(JSON.parse(value));
            }
            catch {
                return [];
            }
        }
        return (0, release_notes_util_1.sanitizeReleaseChanges)(value);
    }
    isDuplicate(error) {
        const dbError = error;
        return dbError?.code === 'ER_DUP_ENTRY' || dbError?.errno === 1062;
    }
};
exports.SystemVersionsService = SystemVersionsService;
exports.SystemVersionsService = SystemVersionsService = SystemVersionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(system_version_entity_1.SystemVersion)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SystemVersionsService);
//# sourceMappingURL=system-versions.service.js.map