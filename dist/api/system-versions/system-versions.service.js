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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemVersionsService = exports.SYSTEM_VERSIONS_MODULE_CODE = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const system_version_entity_1 = require("../../entities/system-versions/system-version.entity");
const release_notes_util_1 = require("./utils/release-notes.util");
exports.SYSTEM_VERSIONS_MODULE_CODE = 'system-versions';
let SystemVersionsService = class SystemVersionsService {
    versions;
    constructor(versions) {
        this.versions = versions;
    }
    async findAll(tenantId, query) {
        await this.assertModuleEnabled(tenantId);
        let page = Number(query?.page) || 1;
        let limit = Number(query?.limit) || 20;
        if (page < 1)
            page = 1;
        if (limit < 1)
            limit = 1;
        if (limit > 50)
            limit = 50;
        const search = query?.search?.trim().toLowerCase() ?? '';
        const [rows, enabledModules] = await Promise.all([
            this.versions.query(`
          SELECT sv.id, sv.version, sv.build_id, sv.channel, sv.title, sv.changes, sv.released_at
          FROM system_versions sv
          WHERE sv.tenant_id = ?
          ORDER BY sv.released_at DESC, sv.created_at DESC
          LIMIT 200
        `, [tenantId]),
            this.enabledModuleCodes(tenantId),
        ]);
        let items = rows
            .map((row) => this.toItem(row))
            .map((item) => ({
            ...item,
            changes: (0, release_notes_util_1.filterChangesForModules)(item.changes, enabledModules),
        }))
            .filter((item) => item.changes.length > 0);
        if (search) {
            items = items.filter((item) => item.version.toLowerCase().includes(search)
                || item.title.toLowerCase().includes(search)
                || item.changes.some((change) => change.message.toLowerCase().includes(search)));
        }
        const total = items.length;
        const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
        const pageItems = items.slice((page - 1) * limit, page * limit);
        return {
            data: pageItems,
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
    async enabledModuleCodes(tenantId) {
        const rows = await this.versions.query(`
        SELECT m.code AS code
        FROM tenant_modules tm
        INNER JOIN modules m ON m.id = tm.module_id
        WHERE tm.tenant_id = ?
          AND tm.is_enabled = 1
      `, [tenantId]);
        return rows.map((row) => row.code);
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
};
exports.SystemVersionsService = SystemVersionsService;
exports.SystemVersionsService = SystemVersionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(system_version_entity_1.SystemVersion)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SystemVersionsService);
//# sourceMappingURL=system-versions.service.js.map