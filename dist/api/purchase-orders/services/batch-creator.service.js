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
var BatchCreatorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchCreatorService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inventory_batch_entity_1 = require("../../../entities/purchase-orders/inventory-batch.entity");
const inventory_stock_ledger_movement_type_enum_1 = require("../../../entities/inventory/inventory-stock-ledger-movement-type.enum");
const batch_number_generator_service_1 = require("./batch-number-generator.service");
const inventory_measure_util_1 = require("../../inventory/utils/inventory-measure.util");
const inventory_stock_ledger_service_1 = require("../../inventory/services/inventory-stock-ledger.service");
let BatchCreatorService = BatchCreatorService_1 = class BatchCreatorService {
    inventoryBatchRepository;
    batchNumberGeneratorService;
    stockLedger;
    logger = new common_1.Logger(BatchCreatorService_1.name);
    constructor(inventoryBatchRepository, batchNumberGeneratorService, stockLedger) {
        this.inventoryBatchRepository = inventoryBatchRepository;
        this.batchNumberGeneratorService = batchNumberGeneratorService;
        this.stockLedger = stockLedger;
    }
    async createBatchForReceivedItem(receivedItem, purchaseOrder, purchaseOrderDetailId, userId, productUoms, sourceTagIdentifier, manager) {
        try {
            const batchNumber = await this.batchNumberGeneratorService.generateBatchNumber(purchaseOrder.warehouse_id, purchaseOrder.tenant_id, manager);
            const uoms = productUoms || [];
            const baseUom = uoms.find((u) => u.is_base);
            if (!baseUom) {
                throw new common_1.BadRequestException(`Unidad de medida base no encontrada para el producto: ${receivedItem.product_id}`);
            }
            const productUom = uoms.find((u) => u.id === receivedItem.product_uom_id);
            if (!productUom) {
                throw new common_1.BadRequestException(`Unidad de medida no soportada para este producto`);
            }
            const factor = productUom.factor || 1;
            const convertedQuantity = productUom.is_base
                ? receivedItem.quantity
                : receivedItem.quantity * factor;
            const repo = manager
                ? manager.getRepository(inventory_batch_entity_1.InventoryBatch)
                : this.inventoryBatchRepository;
            const measure = (0, inventory_measure_util_1.normalizeMeasure)(receivedItem.measure);
            const batch = repo.create({
                tenant_id: purchaseOrder.tenant_id,
                batch_number: batchNumber,
                source_tag_identifier: sourceTagIdentifier || null,
                measure,
                measure_uom_id: measure ? receivedItem.measure_uom_id || null : null,
                warehouse_id: purchaseOrder.warehouse_id,
                product_id: receivedItem.product_id,
                uom_id: baseUom.uom_catalog_id,
                initial_quantity: convertedQuantity,
                available_quantity: convertedQuantity,
                purchase_order_batch_id: purchaseOrder.id,
                purchase_order_detail_id: purchaseOrderDetailId,
                created_by: userId,
                created_at: new Date(),
            });
            const savedBatch = await repo.save(batch);
            await this.stockLedger.append({
                tenantId: purchaseOrder.tenant_id,
                productId: savedBatch.product_id,
                warehouseId: savedBatch.warehouse_id,
                uomId: savedBatch.uom_id,
                inventoryBatchId: savedBatch.id,
                movementType: inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.PURCHASE_RECEIPT,
                quantityDelta: parseFloat(String(convertedQuantity)),
                occurredAt: savedBatch.created_at ?? new Date(),
                referenceType: inventory_stock_ledger_service_1.STOCK_LEDGER_REFERENCE.PURCHASE_ORDER,
                referenceId: purchaseOrder.id,
                referenceFolio: purchaseOrder.folio ?? null,
                createdBy: userId,
            }, manager);
            this.logger.log(`Batch created: ${batchNumber} for product ${receivedItem.product_id}`);
            return savedBatch;
        }
        catch (error) {
            this.logger.error(`Error creating batch for line item ${purchaseOrderDetailId}: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.BatchCreatorService = BatchCreatorService;
exports.BatchCreatorService = BatchCreatorService = BatchCreatorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_batch_entity_1.InventoryBatch)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        batch_number_generator_service_1.BatchNumberGeneratorService,
        inventory_stock_ledger_service_1.InventoryStockLedgerService])
], BatchCreatorService);
//# sourceMappingURL=batch-creator.service.js.map