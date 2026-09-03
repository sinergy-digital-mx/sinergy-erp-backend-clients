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
exports.CategoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const category_entity_1 = require("../../entities/categories/category.entity");
let CategoryService = class CategoryService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async create(dto, tenantId) {
        const category = this.repo.create({
            ...dto,
            tenant_id: tenantId,
            status: dto.status || 'active',
        });
        const saved = await this.repo.save(category);
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
            .createQueryBuilder('category')
            .where('category.tenant_id = :tenantId', { tenantId });
        if (query?.search) {
            queryBuilder.andWhere('LOWER(category.name) LIKE LOWER(:search)', { search: `%${query.search}%` });
        }
        if (query?.status) {
            queryBuilder.andWhere('category.status = :status', { status: query.status });
        }
        queryBuilder.orderBy('category.display_order', 'ASC');
        queryBuilder.addOrderBy('category.created_at', 'DESC');
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
        const category = await this.repo.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!category) {
            throw new common_1.NotFoundException(`Category with ID ${id} not found`);
        }
        return category;
    }
    async update(id, dto, tenantId) {
        const category = await this.findOne(id, tenantId);
        Object.assign(category, dto);
        return this.repo.save(category);
    }
    async remove(id, tenantId) {
        const category = await this.findOne(id, tenantId);
        await this.repo.remove(category);
    }
};
exports.CategoryService = CategoryService;
exports.CategoryService = CategoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CategoryService);
//# sourceMappingURL=category.service.js.map