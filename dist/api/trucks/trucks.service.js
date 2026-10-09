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
const shipping_entity_1 = require("../../entities/logistics/shipping.entity");
const s3_service_1 = require("../../common/services/s3.service");
const carta_porte_util_1 = require("../shippings/utils/carta-porte.util");
let TrucksService = class TrucksService {
    repo;
    shippingRepo;
    s3Service;
    constructor(repo, shippingRepo, s3Service) {
        this.repo = repo;
        this.shippingRepo = shippingRepo;
        this.s3Service = s3Service;
    }
    async create(dto, tenantId) {
        if (dto.placa) {
            await this.assertPlacaUnique(tenantId, dto.placa);
        }
        this.sanitizeGps(dto);
        await this.assertGpsUnitUnique(tenantId, dto.gps_unit_uid);
        const truck = this.repo.create({
            ...dto,
            gps_unit_uid: dto.gps_unit_uid ?? null,
            gps_unit_name: dto.gps_unit_name ?? null,
            tenant_id: tenantId,
            status: dto.status || 'active',
        });
        const saved = await this.repo.save(truck);
        return this.present(saved, tenantId);
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
        const data = await this.presentMany(rows, tenantId);
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
        return this.present(truck, tenantId);
    }
    async update(id, dto, tenantId) {
        const truck = await this.getByIdOrFail(id, tenantId);
        if (dto.placa && dto.placa !== truck.placa) {
            await this.assertPlacaUnique(tenantId, dto.placa, id);
        }
        this.sanitizeGps(dto);
        if (dto.gps_unit_uid !== undefined) {
            await this.assertGpsUnitUnique(tenantId, dto.gps_unit_uid, id);
        }
        Object.assign(truck, dto);
        const saved = await this.repo.save(truck);
        return this.present(saved, tenantId);
    }
    async deactivate(id, tenantId) {
        const truck = await this.getByIdOrFail(id, tenantId);
        truck.status = 'inactive';
        const saved = await this.repo.save(truck);
        return this.present(saved, tenantId);
    }
    async uploadPhoto(id, tenantId, file) {
        const truck = await this.getByIdOrFail(id, tenantId);
        if (truck.photo) {
            await this.s3Service.deleteFile(truck.photo).catch(() => undefined);
        }
        const s3Key = await this.s3Service.uploadEntityFile(tenantId, 'trucks', id, 'photo', file.buffer, file.originalname, file.mimetype);
        truck.photo = s3Key;
        const saved = await this.repo.save(truck);
        return this.present(saved, tenantId);
    }
    sanitizeGps(dto) {
        if (dto.gps_unit_uid === undefined && dto.gps_unit_name === undefined)
            return;
        const uid = dto.gps_unit_uid?.trim() || null;
        dto.gps_unit_uid = uid;
        dto.gps_unit_name = uid ? dto.gps_unit_name?.trim() || null : null;
    }
    async assertGpsUnitUnique(tenantId, gpsUnitUid, excludeId) {
        if (!gpsUnitUid)
            return;
        const qb = this.repo
            .createQueryBuilder('truck')
            .where('truck.tenant_id = :tenantId', { tenantId })
            .andWhere('truck.gps_unit_uid = :gpsUnitUid', { gpsUnitUid });
        if (excludeId)
            qb.andWhere('truck.id != :excludeId', { excludeId });
        const existing = await qb.getOne();
        if (existing) {
            throw new common_1.ConflictException('Esa unidad GPS ya está enlazada a otro camión.');
        }
    }
    async present(truck, tenantId) {
        const [presented] = await this.presentMany([truck], tenantId);
        return presented;
    }
    async presentMany(trucks, tenantId) {
        const withPhoto = await Promise.all(trucks.map((truck) => this.toResponseWithPhotoUrl(truck)));
        if (!withPhoto.length)
            return withPhoto;
        const active = await this.shippingRepo.find({
            where: {
                tenant_id: tenantId,
                truck_id: (0, typeorm_2.In)(withPhoto.map((truck) => truck.id)),
                status: (0, typeorm_2.In)([...shipping_entity_1.ACTIVE_SHIPPING_STATUSES]),
            },
            select: ['id', 'truck_id', 'status'],
        });
        const busy = new Map(active.map((row) => [row.truck_id, row]));
        return withPhoto.map((truck) => {
            const shipping = busy.get(truck.id);
            return Object.assign(truck, {
                active_shipping_id: shipping?.id ?? null,
                active_shipping_status: shipping?.status ?? null,
            });
        });
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
        const check = (0, carta_porte_util_1.assessTruck)(truck);
        const photo = truck.photo
            ? await this.s3Service.getSignedUrl(truck.photo, 900).catch(() => truck.photo)
            : truck.photo;
        return {
            ...truck,
            photo,
            carta_porte_ready: check.ready,
            carta_porte_missing: check.missing,
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
    __param(1, (0, typeorm_1.InjectRepository)(shipping_entity_1.Shipping)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        s3_service_1.S3Service])
], TrucksService);
//# sourceMappingURL=trucks.service.js.map