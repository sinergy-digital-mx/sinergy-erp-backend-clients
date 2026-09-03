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
var ReceiptService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const purchase_order_batch_entity_1 = require("../../../entities/purchase-orders/purchase-order-batch.entity");
const purchase_order_batch_detail_entity_1 = require("../../../entities/purchase-orders/purchase-order-batch-detail.entity");
const inventory_batch_entity_1 = require("../../../entities/purchase-orders/inventory-batch.entity");
const uom_catalog_entity_1 = require("../../../entities/uom-catalog/uom-catalog.entity");
const receive_purchase_order_dto_1 = require("../dto/receive-purchase-order.dto");
const receipt_validator_service_1 = require("./receipt-validator.service");
const batch_creator_service_1 = require("./batch-creator.service");
const total_calculator_service_1 = require("./total-calculator.service");
const tenant_validator_service_1 = require("./tenant-validator.service");
const purchase_order_activity_service_1 = require("./purchase-order-activity.service");
const purchase_order_real_cost_service_1 = require("./purchase-order-real-cost.service");
const purchase_order_line_breakdown_util_1 = require("../utils/purchase-order-line-breakdown.util");
const purchase_order_activity_change_util_1 = require("../utils/purchase-order-activity-change.util");
const purchase_order_movements_1 = require("../constants/purchase-order-movements");
let ReceiptService = ReceiptService_1 = class ReceiptService {
    purchaseOrderRepository;
    lineItemRepository;
    inventoryBatchRepository;
    uomCatalogRepository;
    receiptValidatorService;
    batchCreatorService;
    totalCalculatorService;
    tenantValidatorService;
    activityService;
    realCostService;
    dataSource;
    logger = new common_1.Logger(ReceiptService_1.name);
    constructor(purchaseOrderRepository, lineItemRepository, inventoryBatchRepository, uomCatalogRepository, receiptValidatorService, batchCreatorService, totalCalculatorService, tenantValidatorService, activityService, realCostService, dataSource) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.lineItemRepository = lineItemRepository;
        this.inventoryBatchRepository = inventoryBatchRepository;
        this.uomCatalogRepository = uomCatalogRepository;
        this.receiptValidatorService = receiptValidatorService;
        this.batchCreatorService = batchCreatorService;
        this.totalCalculatorService = totalCalculatorService;
        this.tenantValidatorService = tenantValidatorService;
        this.activityService = activityService;
        this.realCostService = realCostService;
        this.dataSource = dataSource;
    }
    async receive(id, dto, tenantId, userId) {
        try {
            await this.tenantValidatorService.validatePOBelongsToTenant(id, tenantId);
            const purchaseOrder = await this.purchaseOrderRepository.findOne({
                where: { id, tenant_id: tenantId },
                relations: ['line_items'],
            });
            if (!purchaseOrder) {
                throw new common_1.NotFoundException(`Orden de compra no encontrada: ${id}`);
            }
            const existingBatchesCount = await this.inventoryBatchRepository.count({
                where: {
                    purchase_order_batch_id: id,
                    tenant_id: tenantId,
                },
            });
            if (existingBatchesCount > 0 && purchaseOrder.general_status === 'Creada') {
                this.logger.warn(`PO ${id} tiene lotes pero sigue en Creada; se completa el estado a Recibida`);
                await this.finalizeReceivedStatus(id, tenantId, userId, dto, purchaseOrder);
                await this.realCostService.recalculateIfEnabled(tenantId, id);
                await this.recordReceivedStatus(id, tenantId, userId, dto.received_items.length);
                return this.loadReceivedPurchaseOrder(id);
            }
            if (purchaseOrder.general_status !== 'Creada') {
                throw new common_1.BadRequestException(`No se puede recibir la orden de compra. Estado actual: ${purchaseOrder.general_status}`);
            }
            if (existingBatchesCount > 0) {
                throw new common_1.BadRequestException('La orden de compra ya tiene lotes de inventario. Si una recepción falló antes, contacta a soporte antes de reintentar.');
            }
            await this.receiptValidatorService.validateReceivedItems(dto.received_items);
            await this.assertMeasureUomsExist(dto.received_items, tenantId);
            const productIds = [...new Set(dto.received_items.map((item) => item.product_id))];
            const productUomsMap = new Map();
            for (const productId of productIds) {
                const productUoms = await this.lineItemRepository.query(`SELECT * FROM product_uoms WHERE product_id = ?`, [productId]);
                productUomsMap.set(productId, productUoms);
            }
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            try {
                for (const receivedItem of dto.received_items) {
                    const hasLots = Array.isArray(receivedItem.lots) && receivedItem.lots.length > 0;
                    const lots = receivedItem.lots || [];
                    const lotMode = receivedItem.lot_mode ||
                        (hasLots ? receive_purchase_order_dto_1.ReceiptLotMode.MULTIPLE : receive_purchase_order_dto_1.ReceiptLotMode.SINGLE);
                    const totalQuantityInLineUom = lotMode === receive_purchase_order_dto_1.ReceiptLotMode.MULTIPLE
                        ? lots.reduce((acc, lot) => acc + Number(lot.quantity || 0), 0)
                        : Number(receivedItem.quantity || 0);
                    if (totalQuantityInLineUom > 0) {
                        const productUoms = productUomsMap.get(receivedItem.product_id) || [];
                        const productUom = productUoms.find((p) => p.id === receivedItem.product_uom_id);
                        if (!productUom) {
                            throw new common_1.BadRequestException(`Unidad de medida no soportada para este producto`);
                        }
                        const baseUom = productUoms.find((p) => p.is_base);
                        if (!baseUom) {
                            throw new common_1.BadRequestException(`Unidad de medida base no encontrada para el producto: ${receivedItem.product_id}`);
                        }
                        const factor = productUom.factor || 1;
                        const convertedQuantity = productUom.is_base
                            ? totalQuantityInLineUom
                            : totalQuantityInLineUom * factor;
                        await queryRunner.manager.update(purchase_order_batch_detail_entity_1.PurchaseOrderBatchDetail, { id: receivedItem.line_item_id }, {
                            received_original_product_id: receivedItem.product_id,
                            received_original_uom_id: productUom.uom_catalog_id,
                            product_uom_id: productUom.id,
                            received_original_quantity: totalQuantityInLineUom,
                            received_original_unit_total: (0, purchase_order_line_breakdown_util_1.roundPoUnitCost)(receivedItem.unit_total),
                            received_original_iva_percentage: receivedItem.iva_percentage,
                            received_original_iva_unit: receivedItem.iva_unit,
                            received_original_ieps_percentage: receivedItem.ieps_percentage,
                            received_original_ieps_unit: receivedItem.ieps_unit,
                            ...(0, purchase_order_line_breakdown_util_1.computeReceivedLineBreakdown)(Number(totalQuantityInLineUom), Number(receivedItem.unit_total), Number(receivedItem.iva_percentage || 0), Number(receivedItem.ieps_percentage || 0)),
                            received_converted_quantity: convertedQuantity,
                            received_converted_uom_id: baseUom.uom_catalog_id,
                            updated_by: userId,
                        });
                    }
                }
                for (const receivedItem of dto.received_items) {
                    const hasLots = Array.isArray(receivedItem.lots) && receivedItem.lots.length > 0;
                    const lots = receivedItem.lots || [];
                    const lotMode = receivedItem.lot_mode ||
                        (hasLots ? receive_purchase_order_dto_1.ReceiptLotMode.MULTIPLE : receive_purchase_order_dto_1.ReceiptLotMode.SINGLE);
                    const productUoms = productUomsMap.get(receivedItem.product_id) || [];
                    if (lotMode === receive_purchase_order_dto_1.ReceiptLotMode.MULTIPLE && hasLots) {
                        for (const lot of lots) {
                            const lotReceivedItem = {
                                ...receivedItem,
                                quantity: Number(lot.quantity || 0),
                                product_uom_id: lot.product_uom_id,
                                measure: lot.measure ?? receivedItem.measure,
                                measure_uom_id: lot.measure_uom_id ?? receivedItem.measure_uom_id,
                            };
                            await this.batchCreatorService.createBatchForReceivedItem(lotReceivedItem, purchaseOrder, receivedItem.line_item_id, userId, productUoms, lot.tag_identifier, queryRunner.manager);
                        }
                    }
                    else if (Number(receivedItem.quantity || 0) > 0) {
                        await this.batchCreatorService.createBatchForReceivedItem(receivedItem, purchaseOrder, receivedItem.line_item_id, userId, productUoms, undefined, queryRunner.manager);
                    }
                }
                await this.applyReceivedTotals(queryRunner.manager.getRepository(purchase_order_batch_entity_1.PurchaseOrderBatch), id, tenantId, userId, dto);
                await queryRunner.commitTransaction();
            }
            catch (txError) {
                await queryRunner.rollbackTransaction();
                throw txError;
            }
            finally {
                await queryRunner.release();
            }
            this.logger.log(`Recepción procesada para OC ${id} por usuario ${userId}`);
            await this.realCostService.recalculateIfEnabled(tenantId, id);
            await this.recordReceivedStatus(id, tenantId, userId, dto.received_items.length);
            return this.loadReceivedPurchaseOrder(id);
        }
        catch (error) {
            const errorContext = {
                poId: id,
                tenantId,
                userId,
                errorType: error.constructor.name,
                errorMessage: error.message,
                timestamp: new Date().toISOString(),
            };
            this.logger.error(`Error al procesar recepción. Context: ${JSON.stringify(errorContext)}`, error.stack);
            if (error instanceof common_1.NotFoundException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Error al procesar la recepción: ${error.message}`);
        }
    }
    async finalizeReceivedStatus(id, tenantId, userId, dto, purchaseOrder) {
        if (dto?.received_items?.length) {
            await this.receiptValidatorService.validateReceivedItems(dto.received_items);
            await this.assertMeasureUomsExist(dto.received_items, tenantId);
            await this.applyReceivedTotals(this.purchaseOrderRepository, id, tenantId, userId, dto);
            return;
        }
        const lines = purchaseOrder.line_items || [];
        let subtotal = 0;
        let iva = 0;
        let ieps = 0;
        for (const line of lines) {
            const qty = Number(line.received_original_quantity || 0);
            if (qty <= 0)
                continue;
            subtotal += qty * Number(line.received_original_unit_total || 0);
            iva += qty * Number(line.received_original_iva_unit || 0);
            ieps += qty * Number(line.received_original_ieps_unit || 0);
        }
        await this.purchaseOrderRepository.update({ id, tenant_id: tenantId }, {
            general_status: 'Recibida',
            received_subtotal: this.roundMoney(subtotal),
            received_iva_total: this.roundMoney(iva),
            received_ieps_total: this.roundMoney(ieps),
            received_total: this.roundMoney(subtotal + iva + ieps),
            updated_by: userId,
        });
    }
    async applyReceivedTotals(repo, id, tenantId, userId, dto) {
        const receivedSubtotal = this.totalCalculatorService.calculateReceivedSubtotal(dto.received_items);
        const receivedIvaTotal = this.totalCalculatorService.calculateReceivedIvaTotal(dto.received_items);
        const receivedIepsTotal = this.totalCalculatorService.calculateReceivedIepsTotal(dto.received_items);
        const receivedTotal = this.totalCalculatorService.calculateReceivedTotal(dto.received_items);
        await repo.update({ id, tenant_id: tenantId }, {
            received_subtotal: receivedSubtotal,
            received_iva_total: receivedIvaTotal,
            received_ieps_total: receivedIepsTotal,
            received_total: receivedTotal,
            general_status: 'Recibida',
            updated_by: userId,
        });
    }
    async recordReceivedStatus(purchaseOrderId, tenantId, userId, receivedItems) {
        try {
            await this.activityService.record({
                tenantId,
                purchaseOrderId,
                type: purchase_order_movements_1.PURCHASE_ORDER_MOVEMENT_TYPES.STATUS_CHANGED,
                actorId: userId,
                description: 'La orden pasó de Creada a Recibida.',
                changes: (0, purchase_order_activity_change_util_1.compactActivityChanges)([
                    (0, purchase_order_activity_change_util_1.activityChange)('general_status', 'Estatus', 'Creada', 'Recibida'),
                ]),
                metadata: { received_items: receivedItems },
            });
        }
        catch (error) {
            this.logger.error('No se pudo guardar el movimiento de recepción', error);
        }
    }
    async loadReceivedPurchaseOrder(id) {
        const updatedPO = await this.purchaseOrderRepository.findOne({
            where: { id },
            relations: [
                'line_items',
                'line_items.product_uom',
                'line_items.product_uom.uom',
                'line_items.received_uom',
            ],
        });
        if (!updatedPO) {
            throw new common_1.NotFoundException(`Orden de compra no encontrada después de la recepción: ${id}`);
        }
        return updatedPO;
    }
    async assertMeasureUomsExist(items, tenantId) {
        const ids = new Set();
        for (const item of items) {
            if (item.measure_uom_id) {
                ids.add(item.measure_uom_id);
            }
            for (const lot of item.lots || []) {
                if (lot.measure_uom_id) {
                    ids.add(lot.measure_uom_id);
                }
            }
        }
        if (ids.size === 0) {
            return;
        }
        const found = await this.uomCatalogRepository
            .createQueryBuilder('uom')
            .select('uom.id')
            .where('uom.tenant_id = :tenantId', { tenantId })
            .andWhere('uom.id IN (:...ids)', { ids: [...ids] })
            .getMany();
        if (found.length !== ids.size) {
            throw new common_1.BadRequestException('Unidad de tamaño no encontrada en el catálogo. Elige Foot, PIES u otra unidad; no uses la de la orden de compra');
        }
    }
    roundMoney(value) {
        return Math.round(value * 100) / 100;
    }
};
exports.ReceiptService = ReceiptService;
exports.ReceiptService = ReceiptService = ReceiptService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(purchase_order_batch_entity_1.PurchaseOrderBatch)),
    __param(1, (0, typeorm_1.InjectRepository)(purchase_order_batch_detail_entity_1.PurchaseOrderBatchDetail)),
    __param(2, (0, typeorm_1.InjectRepository)(inventory_batch_entity_1.InventoryBatch)),
    __param(3, (0, typeorm_1.InjectRepository)(uom_catalog_entity_1.UoMCatalog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        receipt_validator_service_1.ReceiptValidatorService,
        batch_creator_service_1.BatchCreatorService,
        total_calculator_service_1.TotalCalculatorService,
        tenant_validator_service_1.TenantValidatorService,
        purchase_order_activity_service_1.PurchaseOrderActivityService,
        purchase_order_real_cost_service_1.PurchaseOrderRealCostService,
        typeorm_2.DataSource])
], ReceiptService);
//# sourceMappingURL=receipt.service.js.map