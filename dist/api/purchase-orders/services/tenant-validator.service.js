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
exports.TenantValidatorService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const purchase_order_batch_entity_1 = require("../../../entities/purchase-orders/purchase-order-batch.entity");
const inventory_batch_entity_1 = require("../../../entities/purchase-orders/inventory-batch.entity");
let TenantValidatorService = class TenantValidatorService {
    purchaseOrderRepository;
    inventoryBatchRepository;
    constructor(purchaseOrderRepository, inventoryBatchRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.inventoryBatchRepository = inventoryBatchRepository;
    }
    async validatePOBelongsToTenant(purchaseOrderId, tenantId) {
        const purchaseOrder = await this.purchaseOrderRepository.findOne({
            where: {
                id: purchaseOrderId,
                tenant_id: tenantId,
            },
        });
        if (!purchaseOrder) {
            throw new common_1.NotFoundException(`Orden de compra no encontrada: ${purchaseOrderId}`);
        }
    }
    async verifyBatchNumberUniquenessWithinTenant(batchNumber, tenantId) {
        const existingBatch = await this.inventoryBatchRepository.findOne({
            where: {
                batch_number: batchNumber,
                tenant_id: tenantId,
            },
        });
        if (existingBatch) {
            throw new common_1.BadRequestException(`El número de lote ${batchNumber} ya existe`);
        }
    }
};
exports.TenantValidatorService = TenantValidatorService;
exports.TenantValidatorService = TenantValidatorService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(purchase_order_batch_entity_1.PurchaseOrderBatch)),
    __param(1, (0, typeorm_1.InjectRepository)(inventory_batch_entity_1.InventoryBatch)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], TenantValidatorService);
//# sourceMappingURL=tenant-validator.service.js.map