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
exports.ExchangeRateService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const exchange_rate_entity_1 = require("../../entities/billing/exchange-rate.entity");
let ExchangeRateService = class ExchangeRateService {
    exchangeRateRepository;
    constructor(exchangeRateRepository) {
        this.exchangeRateRepository = exchangeRateRepository;
    }
    async setDailyRate(tenantId, dto) {
        const rateDate = this.normalizeDate(dto.rate_date);
        const row = this.exchangeRateRepository.create({
            tenant_id: tenantId,
            rate_date: rateDate,
            exchange_rate: dto.exchange_rate,
            notes: dto.notes,
        });
        return this.exchangeRateRepository.save(row);
    }
    async getDailyRate(tenantId, date) {
        const rateDate = this.normalizeDate(date);
        return this.exchangeRateRepository
            .createQueryBuilder('rate')
            .where('rate.tenant_id = :tenantId', { tenantId })
            .andWhere('rate.rate_date = :rateDate', { rateDate })
            .orderBy('rate.created_at', 'DESC')
            .addOrderBy('rate.id', 'DESC')
            .getOne();
    }
    async findAll(tenantId, query) {
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
    normalizeDate(date) {
        if (date && Number.isNaN(Date.parse(date))) {
            throw new common_1.BadRequestException('Invalid date format, expected YYYY-MM-DD');
        }
        if (date) {
            return new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10);
        }
        return new Date().toISOString().slice(0, 10);
    }
};
exports.ExchangeRateService = ExchangeRateService;
exports.ExchangeRateService = ExchangeRateService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(exchange_rate_entity_1.ExchangeRate)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ExchangeRateService);
//# sourceMappingURL=exchange-rate.service.js.map