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
exports.SalesOrderDetail = void 0;
const typeorm_1 = require("typeorm");
const sales_order_entity_1 = require("./sales-order.entity");
const product_entity_1 = require("../products/product.entity");
const product_uom_entity_1 = require("../products/product-uom.entity");
const product_discount_entity_1 = require("../products/product-discount.entity");
const uom_catalog_entity_1 = require("../uom-catalog/uom-catalog.entity");
const sales_order_batch_allocation_entity_1 = require("./sales-order-batch-allocation.entity");
let SalesOrderDetail = class SalesOrderDetail {
    id;
    sales_order;
    sales_order_id;
    product;
    product_id;
    product_uom;
    product_uom_id;
    quantity;
    quantity_base_uom;
    base_uom;
    base_uom_id;
    unit_price;
    discount_percentage;
    discount_unit;
    product_discount;
    product_discount_id;
    iva_percentage;
    iva_unit;
    ieps_percentage;
    ieps_unit;
    created_by;
    created_at;
    updated_by;
    updated_at;
    batch_allocations;
};
exports.SalesOrderDetail = SalesOrderDetail;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SalesOrderDetail.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sales_order_entity_1.SalesOrder, (so) => so.line_items, {
        onDelete: 'CASCADE',
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'sales_order_id' }),
    __metadata("design:type", sales_order_entity_1.SalesOrder)
], SalesOrderDetail.prototype, "sales_order", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SalesOrderDetail.prototype, "sales_order_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], SalesOrderDetail.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SalesOrderDetail.prototype, "product_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_uom_entity_1.ProductUoM, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'product_uom_id' }),
    __metadata("design:type", product_uom_entity_1.ProductUoM)
], SalesOrderDetail.prototype, "product_uom", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SalesOrderDetail.prototype, "product_uom_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 3 }),
    __metadata("design:type", Number)
], SalesOrderDetail.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 3, default: 0 }),
    __metadata("design:type", Number)
], SalesOrderDetail.prototype, "quantity_base_uom", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => uom_catalog_entity_1.UoMCatalog, { onDelete: 'RESTRICT', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'base_uom_id' }),
    __metadata("design:type", uom_catalog_entity_1.UoMCatalog)
], SalesOrderDetail.prototype, "base_uom", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SalesOrderDetail.prototype, "base_uom_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 16, scale: 4 }),
    __metadata("design:type", Number)
], SalesOrderDetail.prototype, "unit_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesOrderDetail.prototype, "discount_percentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesOrderDetail.prototype, "discount_unit", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_discount_entity_1.ProductDiscount, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'product_discount_id' }),
    __metadata("design:type", Object)
], SalesOrderDetail.prototype, "product_discount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], SalesOrderDetail.prototype, "product_discount_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesOrderDetail.prototype, "iva_percentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesOrderDetail.prototype, "iva_unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesOrderDetail.prototype, "ieps_percentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SalesOrderDetail.prototype, "ieps_unit", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SalesOrderDetail.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], SalesOrderDetail.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SalesOrderDetail.prototype, "updated_by", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], SalesOrderDetail.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sales_order_batch_allocation_entity_1.SalesOrderBatchAllocation, (a) => a.sales_order_detail),
    __metadata("design:type", Array)
], SalesOrderDetail.prototype, "batch_allocations", void 0);
exports.SalesOrderDetail = SalesOrderDetail = __decorate([
    (0, typeorm_1.Entity)('inv_s_sales_order_details'),
    (0, typeorm_1.Index)('idx_so_detail_order', ['sales_order_id']),
    (0, typeorm_1.Index)('idx_so_detail_product', ['product_id'])
], SalesOrderDetail);
//# sourceMappingURL=sales-order-detail.entity.js.map