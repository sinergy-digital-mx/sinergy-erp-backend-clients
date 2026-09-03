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
exports.InventoryAuditFolioService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inventory_audit_entity_1 = require("../../../entities/inventory/inventory-audit.entity");
let InventoryAuditFolioService = class InventoryAuditFolioService {
    auditRepo;
    constructor(auditRepo) {
        this.auditRepo = auditRepo;
    }
    async generateFolio(tenantId) {
        const result = await this.auditRepo
            .createQueryBuilder('audit')
            .select("MAX(CAST(SUBSTRING_INDEX(audit.folio, '-', -1) AS UNSIGNED))", 'maxSeq')
            .where('audit.tenant_id = :tenantId', { tenantId })
            .andWhere("audit.folio LIKE 'AUD-%'")
            .getRawOne();
        const maxSeq = result?.maxSeq ? Number(result.maxSeq) : 0;
        const next = maxSeq > 0 ? maxSeq + 1 : 1;
        return `AUD-${String(next).padStart(6, '0')}`;
    }
};
exports.InventoryAuditFolioService = InventoryAuditFolioService;
exports.InventoryAuditFolioService = InventoryAuditFolioService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_audit_entity_1.InventoryAudit)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], InventoryAuditFolioService);
//# sourceMappingURL=inventory-audit-folio.service.js.map