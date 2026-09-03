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
exports.UoMCatalogService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uom_catalog_entity_1 = require("../../entities/uom-catalog/uom-catalog.entity");
let UoMCatalogService = class UoMCatalogService {
    uomCatalogRepository;
    constructor(uomCatalogRepository) {
        this.uomCatalogRepository = uomCatalogRepository;
    }
    async create(dto, tenantId) {
        const existing = await this.uomCatalogRepository.findOne({
            where: { tenant_id: tenantId, name: dto.name },
        });
        if (existing) {
            throw new common_1.ConflictException(`UoM con nombre "${dto.name}" ya existe para este tenant`);
        }
        const uom = this.uomCatalogRepository.create({
            ...dto,
            tenant_id: tenantId,
        });
        return await this.uomCatalogRepository.save(uom);
    }
    async findAll(query, tenantId) {
        const { page = 1, limit = 10, name } = query;
        const skip = (page - 1) * limit;
        const where = { tenant_id: tenantId };
        if (name) {
            where.name = (0, typeorm_2.Like)(`%${name}%`);
        }
        const [data, total] = await this.uomCatalogRepository.findAndCount({
            where,
            skip,
            take: limit,
            order: { name: 'ASC' },
        });
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id, tenantId) {
        const uom = await this.uomCatalogRepository.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!uom) {
            throw new common_1.NotFoundException(`UoM con ID ${id} no encontrada`);
        }
        return uom;
    }
    async update(id, dto, tenantId) {
        const uom = await this.findOne(id, tenantId);
        if (dto.name && dto.name !== uom.name) {
            const existing = await this.uomCatalogRepository.findOne({
                where: { tenant_id: tenantId, name: dto.name },
            });
            if (existing) {
                throw new common_1.ConflictException(`UoM con nombre "${dto.name}" ya existe para este tenant`);
            }
        }
        Object.assign(uom, dto);
        return await this.uomCatalogRepository.save(uom);
    }
    async remove(id, tenantId) {
        const uom = await this.findOne(id, tenantId);
        await this.uomCatalogRepository.remove(uom);
    }
};
exports.UoMCatalogService = UoMCatalogService;
exports.UoMCatalogService = UoMCatalogService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(uom_catalog_entity_1.UoMCatalog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UoMCatalogService);
//# sourceMappingURL=uom-catalog.service.js.map