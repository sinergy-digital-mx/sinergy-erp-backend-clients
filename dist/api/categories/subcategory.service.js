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
exports.SubcategoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const subcategory_entity_1 = require("../../entities/categories/subcategory.entity");
let SubcategoryService = class SubcategoryService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async create(dto, tenantId) {
        const subcategory = this.repo.create({
            ...dto,
            tenant_id: tenantId,
            status: dto.status || 'active',
        });
        const saved = await this.repo.save(subcategory);
        return Array.isArray(saved) ? saved[0] : saved;
    }
    async findAll(tenantId, query) {
        let page = Number(query?.page) || 1;
        let limit = Number(query?.limit) || 20;
        if (page < 1)
            page = 1;
        if (limit < 1)
            limit = 1;
        if (limit > 100)
            limit = 100;
        const skip = (page - 1) * limit;
        const queryBuilder = this.repo
            .createQueryBuilder('subcategory')
            .where('subcategory.tenant_id = :tenantId', { tenantId });
        if (query?.search) {
            queryBuilder.andWhere('LOWER(subcategory.name) LIKE LOWER(:search)', { search: `%${query.search}%` });
        }
        if (query?.status) {
            queryBuilder.andWhere('subcategory.status = :status', { status: query.status });
        }
        if (query?.category_id) {
            queryBuilder.andWhere('subcategory.category_id = :category_id', {
                category_id: query.category_id,
            });
        }
        queryBuilder.orderBy('subcategory.display_order', 'ASC');
        queryBuilder.addOrderBy('subcategory.created_at', 'DESC');
        const total = await queryBuilder.getCount();
        const data = await queryBuilder.skip(skip).take(limit).getMany();
        const totalPages = Math.ceil(total / limit);
        return {
            data,
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };
    }
    async findOne(id, tenantId) {
        const subcategory = await this.repo.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!subcategory) {
            throw new common_1.NotFoundException(`Subcategory with ID ${id} not found`);
        }
        return subcategory;
    }
    async update(id, dto, tenantId) {
        const subcategory = await this.findOne(id, tenantId);
        Object.assign(subcategory, dto);
        return this.repo.save(subcategory);
    }
    async remove(id, tenantId) {
        const subcategory = await this.findOne(id, tenantId);
        await this.repo.remove(subcategory);
    }
};
exports.SubcategoryService = SubcategoryService;
exports.SubcategoryService = SubcategoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(subcategory_entity_1.Subcategory)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SubcategoryService);
//# sourceMappingURL=subcategory.service.js.map