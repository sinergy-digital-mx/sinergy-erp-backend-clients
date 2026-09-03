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
exports.WarehouseService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const warehouse_entity_1 = require("../../entities/warehouse/warehouse.entity");
const document_prefix_util_1 = require("../../common/utils/document-prefix.util");
const crypto_1 = require("crypto");
let WarehouseService = class WarehouseService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async create(dto, tenantId) {
        const prefix = (0, document_prefix_util_1.normalizeDocumentPrefix)(dto.prefix);
        const warehouse = this.repo.create({
            ...dto,
            prefix,
            tenant_id: tenantId,
            status: dto.status || 'active',
        });
        warehouse.code = dto.code?.trim() || warehouse.id || (0, crypto_1.randomUUID)();
        return this.repo.save(warehouse);
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
            .createQueryBuilder('warehouse')
            .where('warehouse.tenant_id = :tenantId', { tenantId });
        if (query?.search) {
            queryBuilder.andWhere('(LOWER(warehouse.name) LIKE LOWER(:search) OR LOWER(warehouse.code) LIKE LOWER(:search))', { search: `%${query.search}%` });
        }
        if (query?.status) {
            queryBuilder.andWhere('warehouse.status = :status', { status: query.status });
        }
        if (query?.state) {
            queryBuilder.andWhere('warehouse.state = :state', { state: query.state });
        }
        if (query?.country) {
            queryBuilder.andWhere('warehouse.country = :country', { country: query.country });
        }
        if (query?.billing_branch_id) {
            queryBuilder.andWhere('warehouse.billing_branch_id = :billing_branch_id', {
                billing_branch_id: query.billing_branch_id,
            });
        }
        if (query?.code) {
            queryBuilder.andWhere('warehouse.code = :code', { code: query.code });
        }
        queryBuilder.orderBy('warehouse.created_at', 'DESC');
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
        const warehouse = await this.repo.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!warehouse) {
            throw new common_1.NotFoundException(`Almacén con ID ${id} no encontrado`);
        }
        return warehouse;
    }
    async update(id, dto, tenantId) {
        const warehouse = await this.findOne(id, tenantId);
        const prefix = dto.prefix !== undefined ? (0, document_prefix_util_1.normalizeDocumentPrefix)(dto.prefix) : warehouse.prefix;
        Object.assign(warehouse, dto, { prefix });
        return this.repo.save(warehouse);
    }
    async remove(id, tenantId) {
        const warehouse = await this.findOne(id, tenantId);
        await this.repo.remove(warehouse);
    }
};
exports.WarehouseService = WarehouseService;
exports.WarehouseService = WarehouseService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(warehouse_entity_1.Warehouse)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], WarehouseService);
//# sourceMappingURL=warehouse.service.js.map