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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesOrderBatchAllocation = void 0;
const typeorm_1 = require("typeorm");
const sales_order_detail_entity_1 = require("./sales-order-detail.entity");
const inventory_batch_entity_1 = require("../purchase-orders/inventory-batch.entity");
let SalesOrderBatchAllocation = class SalesOrderBatchAllocation {
    id;
    sales_order_detail;
    sales_order_detail_id;
    inventory_batch;
    inventory_batch_id;
    quantity_allocated;
    created_by;
    created_at;
};
exports.SalesOrderBatchAllocation = SalesOrderBatchAllocation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SalesOrderBatchAllocation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sales_order_detail_entity_1.SalesOrderDetail, (d) => d.batch_allocations, {
        onDelete: 'CASCADE',
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'sales_order_detail_id' }),
    __metadata("design:type", sales_order_detail_entity_1.SalesOrderDetail)
], SalesOrderBatchAllocation.prototype, "sales_order_detail", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SalesOrderBatchAllocation.prototype, "sales_order_detail_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => inventory_batch_entity_1.InventoryBatch, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'inventory_batch_id' }),
    __metadata("design:type", inventory_batch_entity_1.InventoryBatch)
], SalesOrderBatchAllocation.prototype, "inventory_batch", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SalesOrderBatchAllocation.prototype, "inventory_batch_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 3 }),
    __metadata("design:type", Number)
], SalesOrderBatchAllocation.prototype, "quantity_allocated", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SalesOrderBatchAllocation.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], SalesOrderBatchAllocation.prototype, "created_at", void 0);
exports.SalesOrderBatchAllocation = SalesOrderBatchAllocation = __decorate([
    (0, typeorm_1.Entity)('inv_s_sales_order_batch_allocations'),
    (0, typeorm_1.Index)('idx_alloc_detail', ['sales_order_detail_id']),
    (0, typeorm_1.Index)('idx_alloc_batch', ['inventory_batch_id'])
], SalesOrderBatchAllocation);
//# sourceMappingURL=sales-order-batch-allocation.entity.js.map