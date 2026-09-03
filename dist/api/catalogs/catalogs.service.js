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
exports.CatalogsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const catalog_entity_1 = require("../../entities/catalog.entity");
let CatalogsService = class CatalogsService {
    catalogRepo;
    constructor(catalogRepo) {
        this.catalogRepo = catalogRepo;
    }
    async findByType(catalogType) {
        return this.catalogRepo.find({
            where: { catalog_type: catalogType, is_active: true },
            order: { sort_order: 'ASC', name: 'ASC' },
        });
    }
    async findByTypeAndCode(catalogType, code) {
        return this.catalogRepo.findOne({
            where: { catalog_type: catalogType, code, is_active: true },
        });
    }
    async search(catalogType, query) {
        return this.catalogRepo
            .createQueryBuilder('c')
            .where('c.catalog_type = :type', { type: catalogType })
            .andWhere('c.is_active = :active', { active: true })
            .andWhere('(LOWER(c.name) LIKE LOWER(:query) OR c.code LIKE :query OR c.value LIKE :query)', { query: `%${query}%` })
            .orderBy('c.sort_order', 'ASC')
            .addOrderBy('c.name', 'ASC')
            .getMany();
    }
    async findAll(catalogType) {
        const query = this.catalogRepo
            .createQueryBuilder('c')
            .where('c.is_active = :active', { active: true });
        if (catalogType) {
            query.andWhere('c.catalog_type = :type', { type: catalogType });
        }
        return query
            .orderBy('c.catalog_type', 'ASC')
            .addOrderBy('c.sort_order', 'ASC')
            .addOrderBy('c.name', 'ASC')
            .getMany();
    }
};
exports.CatalogsService = CatalogsService;
exports.CatalogsService = CatalogsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(catalog_entity_1.Catalog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CatalogsService);
//# sourceMappingURL=catalogs.service.js.map