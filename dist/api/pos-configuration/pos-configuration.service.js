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
exports.PosConfigurationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pos_configuration_entity_1 = require("../../entities/billing/pos-configuration.entity");
const billing_branch_entity_1 = require("../../entities/billing/billing-branch.entity");
let PosConfigurationService = class PosConfigurationService {
    repo;
    branchRepo;
    constructor(repo, branchRepo) {
        this.repo = repo;
        this.branchRepo = branchRepo;
    }
    async create(dto, tenantId) {
        await this.validateBranch(dto.sucursal, tenantId);
        const config = this.repo.create({
            ...dto,
            tenant_id: tenantId,
            status: dto.status ?? 1,
        });
        const saved = await this.repo.save(config);
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
            .createQueryBuilder('config')
            .leftJoinAndSelect('config.branch', 'branch')
            .where('config.tenant_id = :tenantId', { tenantId });
        if (query?.search) {
            queryBuilder.andWhere('LOWER(config.code) LIKE LOWER(:search)', { search: `%${query.search}%` });
        }
        if (query?.status !== undefined) {
            queryBuilder.andWhere('config.status = :status', { status: query.status });
        }
        if (query?.sucursal) {
            queryBuilder.andWhere('config.sucursal = :sucursal', { sucursal: query.sucursal });
        }
        if (query?.type) {
            queryBuilder.andWhere('config.type = :type', { type: query.type });
        }
        queryBuilder.orderBy('config.created_at', 'DESC');
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
        const config = await this.repo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['branch'],
        });
        if (!config) {
            throw new common_1.NotFoundException(`POS Configuration with ID "${id}" not found or does not belong to your organization`);
        }
        return config;
    }
    async update(id, dto, tenantId) {
        const config = await this.findOne(id, tenantId);
        if (dto.sucursal && dto.sucursal !== config.sucursal) {
            await this.validateBranch(dto.sucursal, tenantId);
        }
        Object.assign(config, dto);
        return this.repo.save(config);
    }
    async remove(id, tenantId) {
        const config = await this.findOne(id, tenantId);
        try {
            await this.repo.remove(config);
        }
        catch (error) {
            if (error?.code === 'ER_ROW_IS_REFERENCED_2' || error?.code === '23503') {
                throw new common_1.ConflictException(`POS Configuration with ID "${id}" cannot be deleted because it is referenced by active POS operations`);
            }
            throw error;
        }
    }
    async validateBranch(sucursal, tenantId) {
        const branch = await this.branchRepo.findOne({
            where: {
                id: sucursal,
            },
            relations: ['fiscal_configuration'],
        });
        if (!branch) {
            throw new common_1.BadRequestException(`Invalid branch reference: branch with ID "${sucursal}" does not exist`);
        }
        if (branch.fiscal_configuration?.tenant_id !== tenantId) {
            throw new common_1.BadRequestException(`Invalid branch reference: branch with ID "${sucursal}" does not belong to your organization`);
        }
    }
};
exports.PosConfigurationService = PosConfigurationService;
exports.PosConfigurationService = PosConfigurationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(pos_configuration_entity_1.PosConfiguration)),
    __param(1, (0, typeorm_1.InjectRepository)(billing_branch_entity_1.BillingBranch)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], PosConfigurationService);
//# sourceMappingURL=pos-configuration.service.js.map