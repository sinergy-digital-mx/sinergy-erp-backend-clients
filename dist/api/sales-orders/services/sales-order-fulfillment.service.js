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
const sales_order_batch_allocation_entity_1 = require("../../../entities/sales-orders/sales-order-batch-allocation.entity");
let SalesOrderFulfillmentService = SalesOrderFulfillmentService_1 = class SalesOrderFulfillmentService {
    batchRepo;
    logger = new common_1.Logger(SalesOrderFulfillmentService_1.name);
    constructor(batchRepo) {
        this.batchRepo = batchRepo;
    }
    async allocateFifo(detail, userId, manager, scope, quantityBase) {
        const needed = parseFloat((quantityBase ?? detail.quantity_base_uom).toString());
        if (needed <= 0) {
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
        }
        await manager.remove(sales_order_batch_allocation_entity_1.SalesOrderBatchAllocation, allocations);
    }
};
exports.SalesOrderFulfillmentService = SalesOrderFulfillmentService;
exports.SalesOrderFulfillmentService = SalesOrderFulfillmentService = SalesOrderFulfillmentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_batch_entity_1.InventoryBatch)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SalesOrderFulfillmentService);
//# sourceMappingURL=sales-order-fulfillment.service.js.map