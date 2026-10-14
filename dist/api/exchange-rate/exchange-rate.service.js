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
var ExchangeRateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeRateService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const exchange_rate_entity_1 = require("../../entities/billing/exchange-rate.entity");
const unclosed_shift_alert_1 = require("../pos-shifts/utils/unclosed-shift-alert");
const exchange_rate_carry_util_1 = require("./exchange-rate-carry.util");
let ExchangeRateService = ExchangeRateService_1 = class ExchangeRateService {
    exchangeRateRepository;
    logger = new common_1.Logger(ExchangeRateService_1.name);
    constructor(exchangeRateRepository) {
        this.exchangeRateRepository = exchangeRateRepository;
    }
    async carryForwardOpenDays() {
        const today = (0, unclosed_shift_alert_1.getTodayDateString)();
        const tenants = await this.exchangeRateRepository
            .createQueryBuilder('rate')
            .select('rate.tenant_id', 'tenant_id')
            .groupBy('rate.tenant_id')
            .getRawMany();
        for (const tenant of tenants) {
            const tenantId = tenant.tenant_id;
            if (!tenantId) {
                continue;
            }
            try {
                await this.carryForwardUntil(tenantId, today);
            }
            catch (error) {
                this.logger.error(`No se pudo arrastrar el tipo de cambio de ${tenantId}`, error);
            }
        }
    }
    async setDailyRate(tenantId, dto) {
        const rateDate = this.normalizeDate(dto.rate_date);
        const notes = dto.notes?.trim() || null;
        const existing = await this.findRowForDate(tenantId, rateDate);
        if (existing) {
            existing.exchange_rate = dto.exchange_rate;
            existing.notes = notes;
            return this.exchangeRateRepository.save(existing);
        }
        const row = this.exchangeRateRepository.create({
            tenant_id: tenantId,
            rate_date: rateDate,
            exchange_rate: dto.exchange_rate,
            notes,
        });
        return this.exchangeRateRepository.save(row);
    }
    async getDailyRate(tenantId, date) {
        const requested = this.normalizeDate(date);
        const today = (0, unclosed_shift_alert_1.getTodayDateString)();
        const rateDate = requested > today ? today : requested;
        await this.carryForwardUntil(tenantId, rateDate);
        return this.findRowForDate(tenantId, rateDate);
    }
    async findAll(tenantId, query) {
        await this.carryForwardUntil(tenantId, (0, unclosed_shift_alert_1.getTodayDateString)());
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const safePage = page < 1 ? 1 : page;
        const safeLimit = limit < 1 ? 1 : Math.min(limit, 100);
        const qb = this.exchangeRateRepository
            .createQueryBuilder('rate')
            .where('rate.tenant_id = :tenantId', { tenantId });
        if (query.from_date) {
            qb.andWhere('rate.rate_date >= :fromDate', { fromDate: query.from_date });
        }
        if (query.to_date) {
            qb.andWhere('rate.rate_date <= :toDate', { toDate: query.to_date });
        }
        qb.orderBy('rate.rate_date', 'DESC').addOrderBy('rate.created_at', 'DESC');
        const total = await qb.getCount();
        const data = await qb.skip((safePage - 1) * safeLimit).take(safeLimit).getMany();
        const totalPages = Math.ceil(total / safeLimit);
        return {
            data,
            total,
            page: safePage,
            limit: safeLimit,
            totalPages,
            hasNext: safePage < totalPages,
            hasPrev: safePage > 1,
        };
    }
    async carryForwardUntil(tenantId, untilDate) {
        const rows = await this.exchangeRateRepository
            .createQueryBuilder('rate')
            .where('rate.tenant_id = :tenantId', { tenantId })
            .andWhere('rate.rate_date <= :untilDate', { untilDate })
            .orderBy('rate.rate_date', 'ASC')
            .addOrderBy('rate.created_at', 'DESC')
            .addOrderBy('rate.id', 'DESC')
            .getMany();
        const missing = (0, exchange_rate_carry_util_1.buildMissingDailyRates)(rows, untilDate);
        if (missing.length === 0) {
            return;
        }
        await this.exchangeRateRepository.save(missing.map((day) => this.exchangeRateRepository.create({
            tenant_id: tenantId,
            rate_date: day.rate_date,
            exchange_rate: day.exchange_rate,
            notes: null,
        })));
    }
    findRowForDate(tenantId, rateDate) {
        return this.exchangeRateRepository
            .createQueryBuilder('rate')
            .where('rate.tenant_id = :tenantId', { tenantId })
            .andWhere('rate.rate_date = :rateDate', { rateDate })
            .orderBy('rate.created_at', 'DESC')
            .addOrderBy('rate.id', 'DESC')
            .getOne();
    }
    normalizeDate(date) {
        if (date && Number.isNaN(Date.parse(date))) {
            throw new common_1.BadRequestException('Invalid date format, expected YYYY-MM-DD');
        }
        if (date) {
            return date.slice(0, 10);
        }
        return (0, unclosed_shift_alert_1.getTodayDateString)();
    }
};
exports.ExchangeRateService = ExchangeRateService;
__decorate([
    (0, schedule_1.Cron)('15 8 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExchangeRateService.prototype, "carryForwardOpenDays", null);
exports.ExchangeRateService = ExchangeRateService = ExchangeRateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(exchange_rate_entity_1.ExchangeRate)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ExchangeRateService);
//# sourceMappingURL=exchange-rate.service.js.map