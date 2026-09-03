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
exports.QuotationFolioService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const quotation_entity_1 = require("../../../entities/quotations/quotation.entity");
let QuotationFolioService = class QuotationFolioService {
    quotationRepo;
    constructor(quotationRepo) {
        this.quotationRepo = quotationRepo;
    }
    async generateFolio(tenantId) {
        const result = await this.quotationRepo
            .createQueryBuilder('qt')
            .select("MAX(CAST(SUBSTRING_INDEX(qt.folio, '-', -1) AS UNSIGNED))", 'maxSeq')
            .where('qt.tenant_id = :tenantId', { tenantId })
            .andWhere("qt.folio LIKE 'COT-%'")
            .getRawOne();
        const maxSeq = result?.maxSeq ? Number(result.maxSeq) : 0;
        const next = maxSeq > 0 ? maxSeq + 1 : 1;
        return `COT-${String(next).padStart(6, '0')}`;
    }
};
exports.QuotationFolioService = QuotationFolioService;
exports.QuotationFolioService = QuotationFolioService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(quotation_entity_1.Quotation)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], QuotationFolioService);
//# sourceMappingURL=quotation-folio.service.js.map