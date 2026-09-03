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
exports.InventoryBatch = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const warehouse_entity_1 = require("../warehouse/warehouse.entity");
const product_entity_1 = require("../products/product.entity");
const uom_catalog_entity_1 = require("../uom-catalog/uom-catalog.entity");
const purchase_order_batch_entity_1 = require("./purchase-order-batch.entity");
const purchase_order_batch_detail_entity_1 = require("./purchase-order-batch-detail.entity");
let InventoryBatch = class InventoryBatch {
    id;
    tenant;
    tenant_id;
    batch_number;
    source_tag_identifier;
    measure;
    measure_uom;
    measure_uom_id;
    photo;
    warehouse;
    warehouse_id;
    product;
    product_id;
    uom;
    uom_id;
    initial_quantity;
    available_quantity;
    purchase_order_batch;
    purchase_order_batch_id;
    purchase_order_detail;
    purchase_order_detail_id;
    transferred_from_batch;
    transferred_from_batch_id;
    created_by;
    created_at;
};
exports.InventoryBatch = InventoryBatch;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InventoryBatch.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], InventoryBatch.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InventoryBatch.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], InventoryBatch.prototype, "batch_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], InventoryBatch.prototype, "source_tag_identifier", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 3, nullable: true }),
    __metadata("design:type", Object)
], InventoryBatch.prototype, "measure", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => uom_catalog_entity_1.UoMCatalog, { onDelete: 'RESTRICT', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'measure_uom_id' }),
    __metadata("design:type", Object)
], InventoryBatch.prototype, "measure_uom", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryBatch.prototype, "measure_uom_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], InventoryBatch.prototype, "photo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'warehouse_id' }),
    __metadata("design:type", warehouse_entity_1.Warehouse)
], InventoryBatch.prototype, "warehouse", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InventoryBatch.prototype, "warehouse_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], InventoryBatch.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InventoryBatch.prototype, "product_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => uom_catalog_entity_1.UoMCatalog, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'uom_id' }),
    __metadata("design:type", uom_catalog_entity_1.UoMCatalog)
], InventoryBatch.prototype, "uom", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InventoryBatch.prototype, "uom_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 3 }),
    __metadata("design:type", Number)
], InventoryBatch.prototype, "initial_quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 3 }),
    __metadata("design:type", Number)
], InventoryBatch.prototype, "available_quantity", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => purchase_order_batch_entity_1.PurchaseOrderBatch, (po) => po.batches, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'purchase_order_batch_id' }),
    __metadata("design:type", purchase_order_batch_entity_1.PurchaseOrderBatch)
], InventoryBatch.prototype, "purchase_order_batch", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], InventoryBatch.prototype, "purchase_order_batch_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => purchase_order_batch_detail_entity_1.PurchaseOrderBatchDetail, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'purchase_order_detail_id' }),
    __metadata("design:type", purchase_order_batch_detail_entity_1.PurchaseOrderBatchDetail)
], InventoryBatch.prototype, "purchase_order_detail", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], InventoryBatch.prototype, "purchase_order_detail_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => InventoryBatch, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'transferred_from_batch_id' }),
    __metadata("design:type", Object)
], InventoryBatch.prototype, "transferred_from_batch", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryBatch.prototype, "transferred_from_batch_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InventoryBatch.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], InventoryBatch.prototype, "created_at", void 0);
exports.InventoryBatch = InventoryBatch = __decorate([
    (0, typeorm_1.Entity)('inv_s_batches'),
    (0, typeorm_1.Index)('idx_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('idx_warehouse', ['warehouse_id']),
    (0, typeorm_1.Index)('idx_product', ['product_id']),
    (0, typeorm_1.Index)('idx_batch_number', ['batch_number']),
    (0, typeorm_1.Index)('idx_purchase_order', ['purchase_order_batch_id']),
    (0, typeorm_1.Index)('uq_batch_number', ['tenant_id', 'batch_number'], { unique: true })
], InventoryBatch);
//# sourceMappingURL=inventory-batch.entity.js.map