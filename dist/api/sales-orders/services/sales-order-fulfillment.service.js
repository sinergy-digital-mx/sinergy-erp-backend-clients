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
var SalesOrderFulfillmentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesOrderFulfillmentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inventory_batch_entity_1 = require("../../../entities/purchase-orders/inventory-batch.entity");
const sales_order_entity_1 = require("../../../entities/sales-orders/sales-order.entity");
const sales_order_detail_entity_1 = require("../../../entities/sales-orders/sales-order-detail.entity");
const product_entity_1 = require("../../../entities/products/product.entity");
const product_item_kind_enum_1 = require("../../../entities/products/product-item-kind.enum");
const sales_order_batch_allocation_entity_1 = require("../../../entities/sales-orders/sales-order-batch-allocation.entity");
const inventory_stock_ledger_movement_type_enum_1 = require("../../../entities/inventory/inventory-stock-ledger-movement-type.enum");
const inventory_stock_ledger_service_1 = require("../../inventory/services/inventory-stock-ledger.service");
const inventory_stock_ledger_valuation_service_1 = require("../../inventory/services/inventory-stock-ledger-valuation.service");
const stock_ledger_valuation_util_1 = require("../../inventory/utils/stock-ledger-valuation.util");
let SalesOrderFulfillmentService = SalesOrderFulfillmentService_1 = class SalesOrderFulfillmentService {
    batchRepo;
    stockLedger;
    stockLedgerValuation;
    logger = new common_1.Logger(SalesOrderFulfillmentService_1.name);
    constructor(batchRepo, stockLedger, stockLedgerValuation) {
        this.batchRepo = batchRepo;
        this.stockLedger = stockLedger;
        this.stockLedgerValuation = stockLedgerValuation;
    }
    async allocateFifo(detail, userId, manager, scope, quantityBase) {
        const needed = parseFloat((quantityBase ?? detail.quantity_base_uom).toString());
        if (needed <= 0) {
            return [];
        }
        const product = await manager.findOne(product_entity_1.Product, {
            where: { id: detail.product_id },
            select: ['id', 'item_kind'],
        });
        if (product?.item_kind === product_item_kind_enum_1.ProductItemKind.Service) {
            return [];
        }
        const warehouseId = scope.warehouseId || undefined;
        const billingBranchId = scope.billingBranchId || undefined;
        if (!warehouseId && !billingBranchId) {
            throw new common_1.BadRequestException('No se puede surtir: la orden no tiene sucursal ni almacén');
        }
        const qb = manager
            .createQueryBuilder(inventory_batch_entity_1.InventoryBatch, 'batch')
            .where('batch.product_id = :productId', { productId: detail.product_id })
            .andWhere('batch.available_quantity > 0')
            .orderBy('batch.created_at', 'ASC')
            .setLock('pessimistic_write');
        if (warehouseId) {
            qb.andWhere('batch.warehouse_id = :warehouseId', { warehouseId });
        }
        else {
            qb.innerJoin('batch.warehouse', 'warehouse').andWhere('warehouse.billing_branch_id = :billingBranchId', { billingBranchId });
        }
        const batches = await qb.getMany();
        const totalAvailable = batches.reduce((sum, b) => sum + parseFloat(b.available_quantity.toString()), 0);
        if (totalAvailable < needed) {
            throw new common_1.BadRequestException(`Stock insuficiente para el producto ${detail.product_id}. ` +
                `Requerido: ${needed}, disponible: ${totalAvailable}`);
        }
        const salesOrder = await this.resolveSalesOrder(detail, manager);
        const allocations = [];
        let remaining = needed;
        for (const batch of batches) {
            if (remaining <= 0)
                break;
            const available = parseFloat(batch.available_quantity.toString());
            const take = Math.min(available, remaining);
            batch.available_quantity = parseFloat((available - take).toFixed(3));
            await manager.save(inventory_batch_entity_1.InventoryBatch, batch);
            const allocation = manager.create(sales_order_batch_allocation_entity_1.SalesOrderBatchAllocation, {
                sales_order_detail_id: detail.id,
                inventory_batch_id: batch.id,
                quantity_allocated: take,
                created_by: userId,
            });
            await manager.save(sales_order_batch_allocation_entity_1.SalesOrderBatchAllocation, allocation);
            allocations.push(allocation);
            const valuation = await this.stockLedgerValuation.resolveFromBatchId(batch.tenant_id, batch.id, manager);
            const unitPrice = parseFloat(String(detail.unit_price ?? 0));
            const discountUnit = parseFloat(String(detail.discount_unit ?? 0));
            const saleUnit = Number.isFinite(unitPrice)
                ? (0, stock_ledger_valuation_util_1.roundStockMoney)(Math.max(0, unitPrice - (Number.isFinite(discountUnit) ? discountUnit : 0)))
                : null;
            await this.stockLedger.append({
                tenantId: batch.tenant_id,
                productId: batch.product_id,
                warehouseId: batch.warehouse_id,
                uomId: batch.uom_id,
                inventoryBatchId: batch.id,
                movementType: inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.SALE,
                quantityDelta: -take,
                unitCostMxn: valuation.unitCostMxn,
                unitSalePriceMxn: saleUnit,
                occurredAt: allocation.created_at ?? new Date(),
                referenceType: inventory_stock_ledger_service_1.STOCK_LEDGER_REFERENCE.SALES_ORDER,
                referenceId: salesOrder?.id ?? detail.sales_order_id,
                referenceFolio: salesOrder?.folio ?? null,
                createdBy: userId,
            }, manager);
            this.logger.log(`FIFO alloc: batch ${batch.batch_number} → ${take} units (remaining: ${remaining - take})`);
            remaining = parseFloat((remaining - take).toFixed(3));
        }
        return allocations;
    }
    async releaseAllocations(allocations, manager) {
        if (!allocations.length) {
            return;
        }
        for (const alloc of allocations) {
            const batch = await manager.findOne(inventory_batch_entity_1.InventoryBatch, {
                where: { id: alloc.inventory_batch_id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!batch)
                continue;
            const current = parseFloat(batch.available_quantity.toString());
            const qty = parseFloat(alloc.quantity_allocated.toString());
            batch.available_quantity = parseFloat((current + qty).toFixed(3));
            await manager.save(inventory_batch_entity_1.InventoryBatch, batch);
            const salesMeta = await this.resolveSalesMetaFromAllocation(alloc, manager);
            const valuation = await this.stockLedgerValuation.resolveFromBatchId(batch.tenant_id, batch.id, manager);
            const detail = await manager.findOne(sales_order_detail_entity_1.SalesOrderDetail, {
                where: { id: alloc.sales_order_detail_id },
            });
            const unitPrice = parseFloat(String(detail?.unit_price ?? 0));
            const discountUnit = parseFloat(String(detail?.discount_unit ?? 0));
            const saleUnit = detail && Number.isFinite(unitPrice)
                ? (0, stock_ledger_valuation_util_1.roundStockMoney)(Math.max(0, unitPrice - (Number.isFinite(discountUnit) ? discountUnit : 0)))
                : null;
            await this.stockLedger.append({
                tenantId: batch.tenant_id,
                productId: batch.product_id,
                warehouseId: batch.warehouse_id,
                uomId: batch.uom_id,
                inventoryBatchId: batch.id,
                movementType: inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.SALE_REVERSAL,
                quantityDelta: qty,
                unitCostMxn: valuation.unitCostMxn,
                unitSalePriceMxn: saleUnit,
                occurredAt: new Date(),
                referenceType: inventory_stock_ledger_service_1.STOCK_LEDGER_REFERENCE.SALES_ORDER,
                referenceId: salesMeta.salesOrderId,
                referenceFolio: salesMeta.folio,
                createdBy: alloc.created_by ?? null,
            }, manager);
        }
        await manager.remove(sales_order_batch_allocation_entity_1.SalesOrderBatchAllocation, allocations);
    }
    async resolveSalesOrder(detail, manager) {
        if (detail.sales_order?.folio) {
            return detail.sales_order;
        }
        if (!detail.sales_order_id) {
            return null;
        }
        return manager.findOne(sales_order_entity_1.SalesOrder, { where: { id: detail.sales_order_id } });
    }
    async resolveSalesMetaFromAllocation(alloc, manager) {
        const detail = alloc.sales_order_detail ??
            (await manager.findOne(sales_order_detail_entity_1.SalesOrderDetail, {
                where: { id: alloc.sales_order_detail_id },
                relations: ['sales_order'],
            }));
        if (!detail) {
            return { salesOrderId: null, folio: null };
        }
        const so = detail.sales_order ??
            (await manager.findOne(sales_order_entity_1.SalesOrder, { where: { id: detail.sales_order_id } }));
        return {
            salesOrderId: detail.sales_order_id,
            folio: so?.folio ?? null,
        };
    }
};
exports.SalesOrderFulfillmentService = SalesOrderFulfillmentService;
exports.SalesOrderFulfillmentService = SalesOrderFulfillmentService = SalesOrderFulfillmentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_batch_entity_1.InventoryBatch)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        inventory_stock_ledger_service_1.InventoryStockLedgerService,
        inventory_stock_ledger_valuation_service_1.InventoryStockLedgerValuationService])
], SalesOrderFulfillmentService);
//# sourceMappingURL=sales-order-fulfillment.service.js.map