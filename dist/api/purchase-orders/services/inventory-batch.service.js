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
exports.InventoryBatchService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inventory_batch_entity_1 = require("../../../entities/purchase-orders/inventory-batch.entity");
const s3_service_1 = require("../../../common/services/s3.service");
let InventoryBatchService = class InventoryBatchService {
    inventoryBatchRepository;
    s3Service;
    constructor(inventoryBatchRepository, s3Service) {
        this.inventoryBatchRepository = inventoryBatchRepository;
        this.s3Service = s3Service;
    }
    async queryBatches(tenantId, query) {
        const { batch_number, product_id, warehouse_id, purchase_order_batch_id, created_from, created_to, page = 1, limit = 20, sort_by = 'created_at', sort_order = 'DESC', } = query;
        let qb = this.inventoryBatchRepository
            .createQueryBuilder('batch')
            .leftJoinAndSelect('batch.product', 'product')
            .leftJoinAndSelect('batch.warehouse', 'warehouse')
            .leftJoinAndSelect('batch.uom', 'uom')
            .leftJoinAndSelect('batch.purchase_order', 'purchase_order')
            .where('batch.tenant_id = :tenantId', { tenantId });
        if (batch_number) {
            qb = qb.andWhere('batch.batch_number ILIKE :batch_number', {
                batch_number: `%${batch_number}%`,
            });
        }
        if (product_id) {
            qb = qb.andWhere('batch.product_id = :product_id', { product_id });
        }
        if (warehouse_id) {
            qb = qb.andWhere('batch.warehouse_id = :warehouse_id', { warehouse_id });
        }
        if (purchase_order_batch_id) {
            qb = qb.andWhere('batch.purchase_order_batch_id = :purchase_order_batch_id', {
                purchase_order_batch_id,
            });
        }
        if (created_from) {
            qb = qb.andWhere('batch.created_at >= :created_from', {
                created_from: new Date(created_from),
            });
        }
        if (created_to) {
            qb = qb.andWhere('batch.created_at <= :created_to', {
                created_to: new Date(created_to),
            });
        }
        const sortColumn = `batch.${sort_by}`;
        qb = qb.orderBy(sortColumn, sort_order);
        const skip = (page - 1) * limit;
        qb = qb.skip(skip).take(limit);
        const [data, total] = await qb.getManyAndCount();
        const dataWithPhotoUrls = await Promise.all(data.map((batch) => this.toResponseWithPhotoUrl(batch)));
        return {
            data: dataWithPhotoUrls,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getWarehouseStats(tenantId, warehouseId) {
        const stats = await this.inventoryBatchRepository
            .createQueryBuilder('batch')
            .select('COUNT(DISTINCT batch.id)', 'total_batches')
            .addSelect('COUNT(DISTINCT batch.product_id)', 'unique_products')
            .addSelect('SUM(batch.available_quantity)', 'total_quantity')
            .where('batch.tenant_id = :tenantId', { tenantId })
            .andWhere('batch.warehouse_id = :warehouseId', { warehouseId })
            .getRawOne();
        return {
            total_batches: parseInt(stats.total_batches || 0),
            unique_products: parseInt(stats.unique_products || 0),
            total_quantity: parseFloat(stats.total_quantity || 0),
        };
    }
    async uploadPhoto(id, tenantId, file) {
        const batch = await this.getByIdOrFail(id, tenantId);
        if (batch.photo) {
            await this.s3Service.deleteFile(batch.photo).catch(() => undefined);
        }
        const s3Key = await this.s3Service.uploadEntityFile(tenantId, 'inventory_batches', id, 'photo', file.buffer, file.originalname, file.mimetype);
        batch.photo = s3Key;
        const saved = await this.inventoryBatchRepository.save(batch);
        return this.toResponseWithPhotoUrl(saved);
    }
    async getByIdOrFail(id, tenantId) {
        const batch = await this.inventoryBatchRepository.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!batch) {
            throw new common_1.NotFoundException(`Lote de inventario con ID ${id} no encontrado`);
        }
        return batch;
    }
    async toResponseWithPhotoUrl(batch) {
        if (!batch.photo) {
            return batch;
        }
        const photoUrl = await this.s3Service
            .getSignedUrl(batch.photo, 900)
            .catch(() => batch.photo);
        return {
            ...batch,
            photo: photoUrl,
        };
    }
};
exports.InventoryBatchService = InventoryBatchService;
exports.InventoryBatchService = InventoryBatchService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_batch_entity_1.InventoryBatch)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        s3_service_1.S3Service])
], InventoryBatchService);
//# sourceMappingURL=inventory-batch.service.js.map