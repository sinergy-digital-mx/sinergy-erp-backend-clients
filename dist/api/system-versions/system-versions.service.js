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
const releases_generated_1 = require("./data/releases.generated");
const tenant_release_list_util_1 = require("./utils/tenant-release-list.util");
exports.SYSTEM_VERSIONS_MODULE_CODE = 'system-versions';
const TENANT_RELEASE_CACHE_MS = 60_000;
let SystemVersionsService = class SystemVersionsService {
    versions;
    cache = new Map();
    constructor(versions) {
        this.versions = versions;
    }
    async findAll(tenantId, query) {
        const items = await this.itemsForTenant(tenantId);
        return (0, tenant_release_list_util_1.paginateTenantReleases)(items, query?.page, query?.limit, query?.search);
    }
    async findLatest(tenantId) {
        const items = await this.itemsForTenant(tenantId);
        return items[0] ?? null;
    }
    async itemsForTenant(tenantId) {
        const now = Date.now();
        const cached = this.cache.get(tenantId);
        if (cached && cached.expiresAt > now) {
            return cached.items;
        }
        const codes = await this.enabledModuleCodes(tenantId);
        const enabled = new Set(codes.map((code) => code.toLowerCase()));
        if (!enabled.has(exports.SYSTEM_VERSIONS_MODULE_CODE)) {
            this.cache.delete(tenantId);
            throw new common_1.ForbiddenException('El módulo de versiones no está habilitado para esta organización');
        }
        const items = (0, tenant_release_list_util_1.listReleasesForTenant)(releases_generated_1.SYSTEM_VERSION_RELEASES, codes);
        this.cache.set(tenantId, { expiresAt: now + TENANT_RELEASE_CACHE_MS, items });
        return items;
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
};
exports.SystemVersionsService = SystemVersionsService;
exports.SystemVersionsService = SystemVersionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(system_version_entity_1.SystemVersion)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SystemVersionsService);
//# sourceMappingURL=system-versions.service.js.map