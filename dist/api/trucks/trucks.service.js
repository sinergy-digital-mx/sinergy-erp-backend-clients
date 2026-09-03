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
exports.TrucksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const truck_entity_1 = require("../../entities/logistics/truck.entity");
const s3_service_1 = require("../../common/services/s3.service");
let TrucksService = class TrucksService {
    repo;
    s3Service;
    constructor(repo, s3Service) {
        this.repo = repo;
        this.s3Service = s3Service;
    }
    async create(dto, tenantId) {
        if (dto.placa) {
            await this.assertPlacaUnique(tenantId, dto.placa);
        }
        const truck = this.repo.create({
            ...dto,
            tenant_id: tenantId,
            status: dto.status || 'active',
        });
        const saved = await this.repo.save(truck);
        return this.toResponseWithPhotoUrl(saved);
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
        const qb = this.repo
            .createQueryBuilder('truck')
            .where('truck.tenant_id = :tenantId', { tenantId });
        if (query?.search) {
            qb.andWhere('(LOWER(truck.name) LIKE LOWER(:search) OR LOWER(truck.placa) LIKE LOWER(:search) OR LOWER(truck.code) LIKE LOWER(:search) OR LOWER(truck.serial_number) LIKE LOWER(:search))', { search: `%${query.search}%` });
        }
        if (query?.status) {
            qb.andWhere('truck.status = :status', { status: query.status });
        }
        qb.orderBy('truck.created_at', 'DESC');
        const total = await qb.getCount();
        const rows = await qb
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();
        const data = await Promise.all(rows.map((truck) => this.toResponseWithPhotoUrl(truck)));
        const totalPages = Math.ceil(total / limit) || 1;
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
        const truck = await this.getByIdOrFail(id, tenantId);
        return this.toResponseWithPhotoUrl(truck);
    }
    async update(id, dto, tenantId) {
        const truck = await this.getByIdOrFail(id, tenantId);
        if (dto.placa && dto.placa !== truck.placa) {
            await this.assertPlacaUnique(tenantId, dto.placa, id);
        }
        Object.assign(truck, dto);
        const saved = await this.repo.save(truck);
        return this.toResponseWithPhotoUrl(saved);
    }
    async deactivate(id, tenantId) {
        const truck = await this.getByIdOrFail(id, tenantId);
        truck.status = 'inactive';
        const saved = await this.repo.save(truck);
        return this.toResponseWithPhotoUrl(saved);
    }
    async uploadPhoto(id, tenantId, file) {
        const truck = await this.getByIdOrFail(id, tenantId);
        if (truck.photo) {
            await this.s3Service.deleteFile(truck.photo).catch(() => undefined);
        }
        const s3Key = await this.s3Service.uploadEntityFile(tenantId, 'trucks', id, 'photo', file.buffer, file.originalname, file.mimetype);
        truck.photo = s3Key;
        const saved = await this.repo.save(truck);
        return this.toResponseWithPhotoUrl(saved);
    }
    async getByIdOrFail(id, tenantId) {
        const truck = await this.repo.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!truck) {
            throw new common_1.NotFoundException('Camión no encontrado');
        }
        return truck;
    }
    async toResponseWithPhotoUrl(truck) {
        if (!truck.photo) {
            return truck;
        }
        const photoUrl = await this.s3Service
            .getSignedUrl(truck.photo, 900)
            .catch(() => truck.photo);
        return {
            ...truck,
            photo: photoUrl,
        };
    }
    async assertPlacaUnique(tenantId, placa, excludeId) {
        const qb = this.repo
            .createQueryBuilder('truck')
            .where('truck.tenant_id = :tenantId', { tenantId })
            .andWhere('truck.placa = :placa', { placa });
        if (excludeId) {
            qb.andWhere('truck.id != :excludeId', { excludeId });
        }
        const existing = await qb.getOne();
        if (existing) {
            throw new common_1.ConflictException('Ya existe un camión con esa placa en esta organización');
        }
    }
};
exports.TrucksService = TrucksService;
exports.TrucksService = TrucksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(truck_entity_1.Truck)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        s3_service_1.S3Service])
], TrucksService);
//# sourceMappingURL=trucks.service.js.map