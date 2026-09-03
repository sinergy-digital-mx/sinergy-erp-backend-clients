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
exports.BatchNumberGeneratorService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const warehouse_entity_1 = require("../../../entities/warehouse/warehouse.entity");
const inventory_batch_entity_1 = require("../../../entities/purchase-orders/inventory-batch.entity");
const SEQUENCE_PAD = 5;
const SEGMENT_PATTERN = /^[A-Z0-9]{1,10}$/;
let BatchNumberGeneratorService = class BatchNumberGeneratorService {
    warehouseRepository;
    inventoryBatchRepository;
    constructor(warehouseRepository, inventoryBatchRepository) {
        this.warehouseRepository = warehouseRepository;
        this.inventoryBatchRepository = inventoryBatchRepository;
    }
    async resolveLotSeries(warehouseId, organizationId, manager) {
        const warehouseRepo = manager
            ? manager.getRepository(warehouse_entity_1.Warehouse)
            : this.warehouseRepository;
        const warehouse = await warehouseRepo.findOne({
            where: { id: warehouseId, tenant_id: organizationId },
            relations: ['billing_branch', 'billing_branch.fiscal_configuration'],
        });
        if (!warehouse) {
            throw new common_1.NotFoundException(`Almacén no encontrado: ${warehouseId}`);
        }
        const branch = warehouse.billing_branch;
        if (!branch) {
            throw new common_1.BadRequestException(`El almacén "${warehouse.name}" no está vinculado a una sucursal. Asigna sucursal y prefijos para recibir mercancía.`);
        }
        const fiscal = branch.fiscal_configuration;
        const fiscalPrefix = this.asLotSegment(fiscal?.prefix);
        if (!fiscalPrefix) {
            throw new common_1.BadRequestException('La razón social no tiene prefijo. Configúralo en Configuración fiscal (ej. MZN).');
        }
        const branchPrefix = this.asLotSegment(branch.prefix);
        if (!branchPrefix) {
            throw new common_1.BadRequestException(`La sucursal "${branch.code}" no tiene prefijo. Configúralo en la sucursal (ej. SBA).`);
        }
        const warehousePrefix = this.asLotSegment(warehouse.prefix);
        if (!warehousePrefix) {
            throw new common_1.BadRequestException(`El almacén "${warehouse.name}" no tiene prefijo. Configúralo en el almacén (ej. BDGA).`);
        }
        return {
            fiscalPrefix,
            branchPrefix,
            warehousePrefix,
            series: `${fiscalPrefix}-${branchPrefix}-${warehousePrefix}`,
        };
    }
    async getNextSequentialNumber(warehouseId, tenantId, manager) {
        const { series } = await this.resolveLotSeries(warehouseId, tenantId, manager);
        const pattern = `${series}-%`;
        const batchRepo = manager
            ? manager.getRepository(inventory_batch_entity_1.InventoryBatch)
            : this.inventoryBatchRepository;
        const result = await batchRepo
            .createQueryBuilder('batch')
            .select("MAX(CAST(SUBSTRING_INDEX(batch.batch_number, '-', -1) AS UNSIGNED))", 'maxSeq')
            .where('batch.tenant_id = :tenantId', { tenantId })
            .andWhere('batch.batch_number LIKE :pattern', { pattern })
            .getRawOne();
        const maxSeq = result?.maxSeq ? Number(result.maxSeq) : 0;
        return maxSeq > 0 ? maxSeq + 1 : 1;
    }
    async generateBatchNumber(warehouseId, tenantId, manager) {
        const { series } = await this.resolveLotSeries(warehouseId, tenantId, manager);
        let sequenceNumber = await this.getNextSequentialNumber(warehouseId, tenantId, manager);
        const batchRepo = manager
            ? manager.getRepository(inventory_batch_entity_1.InventoryBatch)
            : this.inventoryBatchRepository;
        for (let attempt = 0; attempt < 20; attempt++) {
            const paddedNumber = String(sequenceNumber).padStart(SEQUENCE_PAD, '0');
            const batchNumber = `${series}-${paddedNumber}`;
            const existingBatch = await batchRepo.findOne({
                where: {
                    tenant_id: tenantId,
                    batch_number: batchNumber,
                },
            });
            if (!existingBatch) {
                return batchNumber;
            }
            sequenceNumber++;
        }
        throw new common_1.BadRequestException(`No se pudo generar un número de lote único para el almacén ${warehouseId}`);
    }
    asLotSegment(value) {
        if (!value) {
            return null;
        }
        const normalized = String(value).trim().toUpperCase();
        return SEGMENT_PATTERN.test(normalized) ? normalized : null;
    }
};
exports.BatchNumberGeneratorService = BatchNumberGeneratorService;
exports.BatchNumberGeneratorService = BatchNumberGeneratorService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(warehouse_entity_1.Warehouse)),
    __param(1, (0, typeorm_1.InjectRepository)(inventory_batch_entity_1.InventoryBatch)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], BatchNumberGeneratorService);
//# sourceMappingURL=batch-number-generator.service.js.map