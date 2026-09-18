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
var QuotationExpirationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationExpirationService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("typeorm");
let QuotationExpirationService = QuotationExpirationService_1 = class QuotationExpirationService {
    dataSource;
    logger = new common_1.Logger(QuotationExpirationService_1.name);
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async handleDailyExpiration() {
        const cancelled = await this.cancelExpiredQuotations();
        this.logger.log(`Cotizaciones vencidas canceladas: ${cancelled}`);
    }
    async cancelExpiredQuotations() {
        const result = await this.dataSource.query(`UPDATE inv_s_quotations q
       INNER JOIN fiscal_configurations f ON f.id = q.fiscal_configuration_id
       SET q.general_status = 'Cancelada',
           q.updated_at = NOW()
       WHERE q.general_status = 'Creada'
         AND f.quotation_expiration_days IS NOT NULL
         AND f.quotation_expiration_days > 0
         AND DATE_ADD(DATE(q.created_at), INTERVAL f.quotation_expiration_days DAY) <= CURDATE()`);
        return Number(result?.affectedRows ?? 0);
    }
};
exports.QuotationExpirationService = QuotationExpirationService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_1AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], QuotationExpirationService.prototype, "handleDailyExpiration", null);
exports.QuotationExpirationService = QuotationExpirationService = QuotationExpirationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], QuotationExpirationService);
//# sourceMappingURL=quotation-expiration.service.js.map