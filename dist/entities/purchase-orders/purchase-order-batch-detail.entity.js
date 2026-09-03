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
exports.PurchaseOrderBatchDetail = void 0;
const typeorm_1 = require("typeorm");
const purchase_order_batch_entity_1 = require("./purchase-order-batch.entity");
const product_entity_1 = require("../products/product.entity");
const product_uom_entity_1 = require("../products/product-uom.entity");
const uom_catalog_entity_1 = require("../uom-catalog/uom-catalog.entity");
let PurchaseOrderBatchDetail = class PurchaseOrderBatchDetail {
    id;
    purchase_order_batch;
    purchase_order_batch_id;
    product;
    product_id;
    product_uom;
    product_uom_id;
    quantity;
    unit_total;
    iva_percentage;
    iva_unit;
    ieps_percentage;
    ieps_unit;
    line_subtotal;
    line_iva;
    line_ieps;
    line_total;
    received_product;
    received_original_product_id;
    received_uom;
    received_original_uom_id;
    received_original_quantity;
    received_original_unit_total;
    received_original_iva_percentage;
    received_original_iva_unit;
    received_original_ieps_percentage;
    received_original_ieps_unit;
    received_line_subtotal;
    received_line_iva;
    received_line_ieps;
    received_line_total;
    converted_uom;
    received_converted_uom_id;
    received_converted_quantity;
    igi_percentage;
    real_unit_cost_usd;
    real_unit_cost_mxn;
    created_by;
    created_at;
    updated_by;
    updated_at;
};
exports.PurchaseOrderBatchDetail = PurchaseOrderBatchDetail;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PurchaseOrderBatchDetail.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => purchase_order_batch_entity_1.PurchaseOrderBatch, (batch) => batch.line_items, {
        onDelete: 'CASCADE',
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'purchase_order_batch_id' }),
    __metadata("design:type", purchase_order_batch_entity_1.PurchaseOrderBatch)
], PurchaseOrderBatchDetail.prototype, "purchase_order_batch", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PurchaseOrderBatchDetail.prototype, "purchase_order_batch_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], PurchaseOrderBatchDetail.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PurchaseOrderBatchDetail.prototype, "product_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_uom_entity_1.ProductUoM, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'product_uom_id' }),
    __metadata("design:type", product_uom_entity_1.ProductUoM)
], PurchaseOrderBatchDetail.prototype, "product_uom", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PurchaseOrderBatchDetail.prototype, "product_uom_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 3 }),
    __metadata("design:type", Number)
], PurchaseOrderBatchDetail.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 16, scale: 4 }),
    __metadata("design:type", Number)
], PurchaseOrderBatchDetail.prototype, "unit_total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseOrderBatchDetail.prototype, "iva_percentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseOrderBatchDetail.prototype, "iva_unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseOrderBatchDetail.prototype, "ieps_percentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseOrderBatchDetail.prototype, "ieps_unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseOrderBatchDetail.prototype, "line_subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseOrderBatchDetail.prototype, "line_iva", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseOrderBatchDetail.prototype, "line_ieps", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseOrderBatchDetail.prototype, "line_total", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { onDelete: 'RESTRICT', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'received_original_product_id' }),
    __metadata("design:type", product_entity_1.Product)
], PurchaseOrderBatchDetail.prototype, "received_product", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PurchaseOrderBatchDetail.prototype, "received_original_product_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => uom_catalog_entity_1.UoMCatalog, { onDelete: 'RESTRICT', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'received_original_uom_id' }),
    __metadata("design:type", uom_catalog_entity_1.UoMCatalog)
], PurchaseOrderBatchDetail.prototype, "received_uom", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PurchaseOrderBatchDetail.prototype, "received_original_uom_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 3, nullable: true }),
    __metadata("design:type", Number)
], PurchaseOrderBatchDetail.prototype, "received_original_quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 16, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], PurchaseOrderBatchDetail.prototype, "received_original_unit_total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PurchaseOrderBatchDetail.prototype, "received_original_iva_percentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PurchaseOrderBatchDetail.prototype, "received_original_iva_unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PurchaseOrderBatchDetail.prototype, "received_original_ieps_percentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PurchaseOrderBatchDetail.prototype, "received_original_ieps_unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], PurchaseOrderBatchDetail.prototype, "received_line_subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], PurchaseOrderBatchDetail.prototype, "received_line_iva", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], PurchaseOrderBatchDetail.prototype, "received_line_ieps", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], PurchaseOrderBatchDetail.prototype, "received_line_total", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => uom_catalog_entity_1.UoMCatalog, { onDelete: 'RESTRICT', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'received_converted_uom_id' }),
    __metadata("design:type", uom_catalog_entity_1.UoMCatalog)
], PurchaseOrderBatchDetail.prototype, "converted_uom", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PurchaseOrderBatchDetail.prototype, "received_converted_uom_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 3, nullable: true }),
    __metadata("design:type", Number)
], PurchaseOrderBatchDetail.prototype, "received_converted_quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PurchaseOrderBatchDetail.prototype, "igi_percentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 16, scale: 4, nullable: true }),
    __metadata("design:type", Object)
], PurchaseOrderBatchDetail.prototype, "real_unit_cost_usd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 16, scale: 4, nullable: true }),
    __metadata("design:type", Object)
], PurchaseOrderBatchDetail.prototype, "real_unit_cost_mxn", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PurchaseOrderBatchDetail.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PurchaseOrderBatchDetail.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PurchaseOrderBatchDetail.prototype, "updated_by", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PurchaseOrderBatchDetail.prototype, "updated_at", void 0);
exports.PurchaseOrderBatchDetail = PurchaseOrderBatchDetail = __decorate([
    (0, typeorm_1.Entity)('inv_s_purchase_order_batch_detail'),
    (0, typeorm_1.Index)('idx_purchase_order', ['purchase_order_batch_id']),
    (0, typeorm_1.Index)('idx_product', ['product_id']),
    (0, typeorm_1.Index)('idx_received_product', ['received_original_product_id'])
], PurchaseOrderBatchDetail);
//# sourceMappingURL=purchase-order-batch-detail.entity.js.map