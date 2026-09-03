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
exports.PriceListService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const price_list_entity_1 = require("../../entities/products/price-list.entity");
let PriceListService = class PriceListService {
    priceListRepository;
    constructor(priceListRepository) {
        this.priceListRepository = priceListRepository;
    }
    async create(dto, tenantId) {
        const existing = await this.priceListRepository.findOne({
            where: { tenant_id: tenantId, name: dto.name },
        });
        if (existing) {
            throw new common_1.ConflictException(`Lista de precios "${dto.name}" ya existe`);
        }
        const priceList = this.priceListRepository.create({
            ...dto,
            tenant_id: tenantId,
            is_active: true,
        });
        return await this.priceListRepository.save(priceList);
    }
    async findAll(tenantId) {
        return await this.priceListRepository.find({
            where: { tenant_id: tenantId },
            order: { name: 'ASC' },
        });
    }
    async findOne(id, tenantId) {
        const priceList = await this.priceListRepository.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!priceList) {
            throw new common_1.NotFoundException(`Lista de precios con ID ${id} no encontrada`);
        }
        return priceList;
    }
    async update(id, dto, tenantId) {
        const priceList = await this.findOne(id, tenantId);
        if (dto.name && dto.name !== priceList.name) {
            const existing = await this.priceListRepository.findOne({
                where: { tenant_id: tenantId, name: dto.name },
            });
            if (existing) {
                throw new common_1.ConflictException(`Lista de precios "${dto.name}" ya existe`);
            }
        }
        Object.assign(priceList, dto);
        return await this.priceListRepository.save(priceList);
    }
    async remove(id, tenantId) {
        const priceList = await this.findOne(id, tenantId);
        await this.priceListRepository.remove(priceList);
    }
};
exports.PriceListService = PriceListService;
exports.PriceListService = PriceListService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(price_list_entity_1.PriceList)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PriceListService);
//# sourceMappingURL=price-list.service.js.map