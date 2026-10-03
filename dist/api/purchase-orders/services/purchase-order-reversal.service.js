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
exports.PurchaseOrderReversalService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../../../entities/products/product.entity");
const inventory_batch_entity_1 = require("../../../entities/purchase-orders/inventory-batch.entity");
const purchase_order_batch_entity_1 = require("../../../entities/purchase-orders/purchase-order-batch.entity");
const purchase_order_batch_detail_entity_1 = require("../../../entities/purchase-orders/purchase-order-batch-detail.entity");
const inventory_stock_ledger_movement_type_enum_1 = require("../../../entities/inventory/inventory-stock-ledger-movement-type.enum");
const inventory_stock_ledger_service_1 = require("../../inventory/services/inventory-stock-ledger.service");
const inventory_stock_ledger_valuation_service_1 = require("../../inventory/services/inventory-stock-ledger-valuation.service");
const purchase_order_movements_1 = require("../constants/purchase-order-movements");
const purchase_order_activity_service_1 = require("./purchase-order-activity.service");
const purchase_order_activity_change_util_1 = require("../utils/purchase-order-activity-change.util");
const purchase_order_line_breakdown_util_1 = require("../utils/purchase-order-line-breakdown.util");
const purchase_order_reversal_util_1 = require("../utils/purchase-order-reversal.util");
let PurchaseOrderReversalService = class PurchaseOrderReversalService {
    orderRepo;
    detailRepo;
    dataSource;
    stockLedger;
    stockLedgerValuation;
    activityService;
    constructor(orderRepo, detailRepo, dataSource, stockLedger, stockLedgerValuation, activityService) {
        this.orderRepo = orderRepo;
        this.detailRepo = detailRepo;
        this.dataSource = dataSource;
        this.stockLedger = stockLedger;
        this.stockLedgerValuation = stockLedgerValuation;
        this.activityService = activityService;
    }
    async cancel(id, tenantId, userId, reason) {
        const order = await this.loadOrder(id, tenantId);
        if (order.general_status === 'Cancelada') {
            throw new common_1.BadRequestException('La orden de compra ya está cancelada');
        }
        if (order.general_status !== 'Creada' && order.general_status !== 'Recibida') {
            throw new common_1.BadRequestException(`No se puede cancelar la orden de compra con estado: ${order.general_status}`);
        }
        const previous = order.general_status;
        if (previous === 'Recibida') {
            await this.exitReceivedInventory(order, userId);
        }
        else {
            order.general_status = 'Cancelada';
            order.updated_by = userId;
            await this.orderRepo.save(order);
        }
        const note = reason?.trim();
        await this.activityService.record({
            tenantId,
            purchaseOrderId: id,
            type: purchase_order_movements_1.PURCHASE_ORDER_MOVEMENT_TYPES.STATUS_CHANGED,
            actorId: userId,
            title: previous === 'Recibida' ? 'Orden cancelada y inventario salido' : 'Orden cancelada',
            description: note
                ? `La orden pasó de ${previous} a Cancelada. ${note}`
                : previous === 'Recibida'
                    ? 'La orden pasó de Recibida a Cancelada y se dio salida al inventario ingresado.'
                    : 'La orden pasó de Creada a Cancelada.',
            changes: (0, purchase_order_activity_change_util_1.compactActivityChanges)([
                (0, purchase_order_activity_change_util_1.activityChange)('general_status', 'Estatus', previous, 'Cancelada'),
            ]),
        });
    }
    async reopen(id, tenantId, userId) {
        const order = await this.loadOrder(id, tenantId);
        if (order.general_status !== 'Cancelada') {
            throw new common_1.BadRequestException(`Solo se puede reabrir una orden cancelada. Estado actual: ${order.general_status}`);
        }
        const hadReceipt = (order.line_items ?? []).some((line) => Number(line.received_original_quantity ?? 0) > 0);
        order.general_status = 'Creada';
        order.updated_by = userId;
        if (hadReceipt) {
            order.received_subtotal = 0;
            order.received_iva_total = 0;
            order.received_ieps_total = 0;
            order.received_total = 0;
            for (const line of order.line_items ?? []) {
                Object.assign(line, {
                    received_original_product_id: null,
                    received_original_uom_id: null,
                    received_original_quantity: null,
                    received_original_unit_total: null,
                    received_original_iva_percentage: null,
                    received_original_iva_unit: null,
                    received_original_ieps_percentage: null,
                    received_original_ieps_unit: null,
                    received_line_subtotal: null,
                    received_line_iva: null,
                    received_line_ieps: null,
                    received_line_total: null,
                    received_converted_uom_id: null,
                    received_converted_quantity: null,
                });
            }
            await this.detailRepo.save(order.line_items ?? []);
        }
        await this.orderRepo.save(order);
        await this.activityService.record({
            tenantId,
            purchaseOrderId: id,
            type: purchase_order_movements_1.PURCHASE_ORDER_MOVEMENT_TYPES.STATUS_CHANGED,
            actorId: userId,
            title: 'Orden reabierta',
            description: hadReceipt
                ? 'La orden volvió a Creada. El inventario de la recepción cancelada no regresa; hay que recibir de nuevo.'
                : 'La orden volvió de Cancelada a Creada.',
            changes: (0, purchase_order_activity_change_util_1.compactActivityChanges)([
                (0, purchase_order_activity_change_util_1.activityChange)('general_status', 'Estatus', 'Cancelada', 'Creada'),
            ]),
        });
    }
    async correctReceipt(id, dto, tenantId, userId) {
        const order = await this.loadOrder(id, tenantId);
        if (order.general_status !== 'Recibida') {
            throw new common_1.BadRequestException('Solo se corrige el recibo de una orden recibida');
        }
        const corrections = [];
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await this.lockPurchaseOrder(queryRunner.manager, order.id, tenantId);
            const batches = await this.lockPurchaseBatches(queryRunner.manager, tenantId, order.id);
            await this.fillProductLabels(queryRunner.manager, batches);
            for (const patch of dto.lines) {
                const line = (order.line_items ?? []).find((item) => item.id === patch.line_item_id);
                if (!line) {
                    throw new common_1.NotFoundException(`Línea no encontrada: ${patch.line_item_id}`);
                }
                if (patch.quantity == null && patch.unit_total == null) {
                    throw new common_1.BadRequestException('Indica cantidad o precio para corregir');
                }
                const direct = batches.filter((batch) => batch.purchase_order_detail_id === line.id && !batch.transferred_from_batch_id);
                const previousQty = Number(line.received_original_quantity ?? 0);
                const previousCost = Number(line.received_original_unit_total ?? 0);
                const nextQty = patch.quantity != null ? Number(patch.quantity) : previousQty;
                const nextCost = patch.unit_total != null
                    ? (0, purchase_order_line_breakdown_util_1.roundPoUnitCost)(patch.unit_total)
                    : previousCost;
                const qtyChanged = patch.quantity != null
                    && Math.abs(nextQty - previousQty) > purchase_order_reversal_util_1.PURCHASE_REVERSAL_QTY_EPSILON;
                const costChanged = patch.unit_total != null
                    && Math.abs(nextCost - previousCost) > 0.00005;
                if (!qtyChanged && !costChanged) {
                    continue;
                }
                if (qtyChanged) {
                    if (direct.length !== 1) {
                        throw new common_1.BadRequestException('Esta línea tiene varios lotes. Para cambiar la cantidad, el inventario de cada lote debe seguir completo y la corrección es de un solo lote por línea.');
                    }
                    const blocked = (0, purchase_order_reversal_util_1.lotsBlockingFullExit)(direct.map((batch) => this.toLotStock(batch)));
                    if (blocked.length) {
                        throw new common_1.BadRequestException((0, purchase_order_reversal_util_1.formatBlockedLotsMessage)(order.folio, blocked));
                    }
                    await this.applyQuantityCorrection(order, direct[0], line, nextQty, userId, queryRunner.manager);
                }
                line.received_original_quantity = nextQty;
                line.received_original_unit_total = nextCost;
                const ivaPct = Number(line.received_original_iva_percentage ?? 0);
                const iepsPct = Number(line.received_original_ieps_percentage ?? 0);
                line.received_original_iva_unit = (0, purchase_order_line_breakdown_util_1.roundPoMoney)(nextCost * (ivaPct / 100));
                line.received_original_ieps_unit = (0, purchase_order_line_breakdown_util_1.roundPoMoney)(nextCost * (iepsPct / 100));
                Object.assign(line, (0, purchase_order_line_breakdown_util_1.computeReceivedLineBreakdown)(nextQty, nextCost, ivaPct, iepsPct));
                await queryRunner.manager.getRepository(purchase_order_batch_detail_entity_1.PurchaseOrderBatchDetail).save(line);
                corrections.push({
                    changes: (0, purchase_order_activity_change_util_1.compactActivityChanges)([
                        (0, purchase_order_activity_change_util_1.activityChange)('received_original_quantity', 'Cantidad recibida', previousQty, nextQty),
                        (0, purchase_order_activity_change_util_1.activityChange)('received_original_unit_total', 'Costo unitario recibido', previousCost, nextCost),
                    ]),
                });
            }
            this.refreshReceivedTotals(order);
            order.updated_by = userId;
            await queryRunner.manager.getRepository(purchase_order_batch_entity_1.PurchaseOrderBatch).save(order);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        for (const correction of corrections) {
            await this.activityService.record({
                tenantId,
                purchaseOrderId: id,
                type: purchase_order_movements_1.PURCHASE_ORDER_MOVEMENT_TYPES.RECEIPT_CORRECTED,
                actorId: userId,
                description: 'Se corrigió cantidad o precio del recibo.',
                changes: correction.changes,
            });
        }
    }
    async exitReceivedInventory(order, userId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await this.lockPurchaseOrder(queryRunner.manager, order.id, order.tenant_id);
            const batches = await this.lockPurchaseBatches(queryRunner.manager, order.tenant_id, order.id);
            await this.fillProductLabels(queryRunner.manager, batches);
            const nets = await this.purchaseNetByBatch(queryRunner.manager, order.tenant_id, batches.map((batch) => batch.id));
            const direct = batches.filter((batch) => {
                if (batch.transferred_from_batch_id) {
                    return false;
                }
                const initial = (0, purchase_order_reversal_util_1.roundPurchaseQty)(batch.initial_quantity);
                if (initial <= purchase_order_reversal_util_1.PURCHASE_REVERSAL_QTY_EPSILON) {
                    return false;
                }
                const available = (0, purchase_order_reversal_util_1.roundPurchaseQty)(batch.available_quantity);
                const purchaseNet = nets.get(batch.id) ?? initial;
                return !(0, purchase_order_reversal_util_1.isPurchaseLotAlreadyExited)(available, purchaseNet);
            });
            const blocked = (0, purchase_order_reversal_util_1.lotsBlockingFullExit)(direct.map((batch) => this.toLotStock(batch)));
            if (blocked.length) {
                throw new common_1.BadRequestException((0, purchase_order_reversal_util_1.formatBlockedLotsMessage)(order.folio, blocked));
            }
            for (const batch of direct) {
                const initial = (0, purchase_order_reversal_util_1.roundPurchaseQty)(batch.initial_quantity);
                if (initial <= purchase_order_reversal_util_1.PURCHASE_REVERSAL_QTY_EPSILON) {
                    continue;
                }
                batch.available_quantity = 0;
                await queryRunner.manager.getRepository(inventory_batch_entity_1.InventoryBatch).save(batch);
                const valuation = await this.stockLedgerValuation.resolveFromBatchId(order.tenant_id, batch.id, queryRunner.manager);
                await this.stockLedger.append({
                    tenantId: order.tenant_id,
                    productId: batch.product_id,
                    warehouseId: batch.warehouse_id,
                    uomId: batch.uom_id,
                    inventoryBatchId: batch.id,
                    movementType: inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.PURCHASE_REVERSAL,
                    quantityDelta: -initial,
                    unitCostMxn: valuation.unitCostMxn,
                    unitSalePriceMxn: valuation.unitSalePriceMxn,
                    occurredAt: new Date(),
                    referenceType: inventory_stock_ledger_service_1.STOCK_LEDGER_REFERENCE.PURCHASE_ORDER,
                    referenceId: order.id,
                    referenceFolio: order.folio,
                    createdBy: userId,
                    notes: `Salida por cancelación de ${order.folio}. El ingreso queda en el historial.`,
                }, queryRunner.manager);
            }
            order.general_status = 'Cancelada';
            order.updated_by = userId;
            await queryRunner.manager.getRepository(purchase_order_batch_entity_1.PurchaseOrderBatch).save(order);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async applyQuantityCorrection(order, batch, line, nextQty, userId, manager) {
        const previousOriginal = Number(line.received_original_quantity ?? 0);
        const previousBase = (0, purchase_order_reversal_util_1.roundPurchaseQty)(batch.initial_quantity);
        const factor = previousOriginal > purchase_order_reversal_util_1.PURCHASE_REVERSAL_QTY_EPSILON
            ? previousBase / previousOriginal
            : 1;
        const nextBase = (0, purchase_order_reversal_util_1.roundPurchaseQty)(nextQty * factor);
        const delta = (0, purchase_order_reversal_util_1.roundPurchaseQty)(nextBase - previousBase);
        batch.initial_quantity = nextBase;
        batch.available_quantity = nextBase;
        line.received_converted_quantity = nextBase;
        await manager.getRepository(inventory_batch_entity_1.InventoryBatch).save(batch);
        if (Math.abs(delta) <= purchase_order_reversal_util_1.PURCHASE_REVERSAL_QTY_EPSILON) {
            return;
        }
        const valuation = await this.stockLedgerValuation.resolveFromBatchId(order.tenant_id, batch.id, manager);
        await this.stockLedger.append({
            tenantId: order.tenant_id,
            productId: batch.product_id,
            warehouseId: batch.warehouse_id,
            uomId: batch.uom_id,
            inventoryBatchId: batch.id,
            movementType: delta > 0
                ? inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.PURCHASE_RECEIPT
                : inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.PURCHASE_REVERSAL,
            quantityDelta: delta,
            unitCostMxn: valuation.unitCostMxn,
            unitSalePriceMxn: valuation.unitSalePriceMxn,
            occurredAt: new Date(),
            referenceType: inventory_stock_ledger_service_1.STOCK_LEDGER_REFERENCE.PURCHASE_ORDER,
            referenceId: order.id,
            referenceFolio: order.folio,
            createdBy: userId,
            notes: `Corrección de recibo ${order.folio}`,
        }, manager);
    }
    refreshReceivedTotals(order) {
        const lines = order.line_items ?? [];
        order.received_subtotal = (0, purchase_order_line_breakdown_util_1.roundPoMoney)(lines.reduce((sum, line) => sum + Number(line.received_line_subtotal ?? 0), 0));
        order.received_iva_total = (0, purchase_order_line_breakdown_util_1.roundPoMoney)(lines.reduce((sum, line) => sum + Number(line.received_line_iva ?? 0), 0));
        order.received_ieps_total = (0, purchase_order_line_breakdown_util_1.roundPoMoney)(lines.reduce((sum, line) => sum + Number(line.received_line_ieps ?? 0), 0));
        order.received_total = (0, purchase_order_line_breakdown_util_1.roundPoMoney)(lines.reduce((sum, line) => sum + Number(line.received_line_total ?? 0), 0));
    }
    toLotStock(batch) {
        const product = batch.product;
        const label = [product?.sku, product?.name].filter(Boolean).join(' · ') || batch.product_id;
        return {
            batch_id: batch.id,
            batch_number: batch.batch_number,
            product_label: label,
            initial_quantity: Number(batch.initial_quantity),
            available_quantity: Number(batch.available_quantity),
            missing_quantity: 0,
            transferred_from_batch_id: batch.transferred_from_batch_id,
        };
    }
    async lockPurchaseOrder(manager, orderId, tenantId) {
        const locked = await manager
            .getRepository(purchase_order_batch_entity_1.PurchaseOrderBatch)
            .createQueryBuilder('po')
            .setLock('pessimistic_write')
            .where('po.id = :orderId', { orderId })
            .andWhere('po.tenant_id = :tenantId', { tenantId })
            .getOne();
        if (!locked || locked.general_status !== 'Recibida') {
            throw new common_1.BadRequestException('La orden ya no está recibida');
        }
    }
    async lockPurchaseBatches(manager, tenantId, orderId) {
        return manager
            .getRepository(inventory_batch_entity_1.InventoryBatch)
            .createQueryBuilder('batch')
            .setLock('pessimistic_write')
            .where('batch.tenant_id = :tenantId', { tenantId })
            .andWhere('batch.purchase_order_batch_id = :orderId', { orderId })
            .getMany();
    }
    async purchaseNetByBatch(manager, tenantId, batchIds) {
        const nets = new Map();
        if (!batchIds.length) {
            return nets;
        }
        const placeholders = batchIds.map(() => '?').join(', ');
        const rows = await manager.query(`
        SELECT inventory_batch_id, SUM(quantity_delta) AS purchase_net
        FROM inv_s_stock_ledger
        WHERE tenant_id = ?
          AND inventory_batch_id IN (${placeholders})
          AND movement_type IN ('purchase_receipt', 'import', 'purchase_reversal')
        GROUP BY inventory_batch_id
        `, [tenantId, ...batchIds]);
        for (const row of rows) {
            nets.set(row.inventory_batch_id, Number(row.purchase_net ?? 0));
        }
        return nets;
    }
    async fillProductLabels(manager, batches) {
        const ids = [...new Set(batches.map((batch) => batch.product_id).filter(Boolean))];
        if (!ids.length) {
            return;
        }
        const products = await manager.getRepository(product_entity_1.Product).find({
            where: { id: (0, typeorm_2.In)(ids) },
            select: { id: true, name: true, sku: true },
        });
        const byId = new Map(products.map((product) => [product.id, product]));
        for (const batch of batches) {
            const product = byId.get(batch.product_id);
            if (product) {
                batch.product = product;
            }
        }
    }
    async loadOrder(id, tenantId) {
        const order = await this.orderRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['line_items'],
        });
        if (!order) {
            throw new common_1.NotFoundException('Orden de compra no encontrada');
        }
        return order;
    }
};
exports.PurchaseOrderReversalService = PurchaseOrderReversalService;
exports.PurchaseOrderReversalService = PurchaseOrderReversalService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(purchase_order_batch_entity_1.PurchaseOrderBatch)),
    __param(1, (0, typeorm_1.InjectRepository)(purchase_order_batch_detail_entity_1.PurchaseOrderBatchDetail)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        inventory_stock_ledger_service_1.InventoryStockLedgerService,
        inventory_stock_ledger_valuation_service_1.InventoryStockLedgerValuationService,
        purchase_order_activity_service_1.PurchaseOrderActivityService])
], PurchaseOrderReversalService);
//# sourceMappingURL=purchase-order-reversal.service.js.map