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
exports.QuotationDetail = void 0;
const typeorm_1 = require("typeorm");
const quotation_entity_1 = require("./quotation.entity");
const product_entity_1 = require("../products/product.entity");
const product_uom_entity_1 = require("../products/product-uom.entity");
const product_discount_entity_1 = require("../products/product-discount.entity");
const uom_catalog_entity_1 = require("../uom-catalog/uom-catalog.entity");
let QuotationDetail = class QuotationDetail {
    id;
    quotation;
    quotation_id;
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
};
exports.QuotationDetail = QuotationDetail;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], QuotationDetail.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => quotation_entity_1.Quotation, (quotation) => quotation.line_items, {
        onDelete: 'CASCADE',
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'quotation_id' }),
    __metadata("design:type", quotation_entity_1.Quotation)
], QuotationDetail.prototype, "quotation", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QuotationDetail.prototype, "quotation_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], QuotationDetail.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QuotationDetail.prototype, "product_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_uom_entity_1.ProductUoM, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'product_uom_id' }),
    __metadata("design:type", product_uom_entity_1.ProductUoM)
], QuotationDetail.prototype, "product_uom", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QuotationDetail.prototype, "product_uom_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 3 }),
    __metadata("design:type", Number)
], QuotationDetail.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 3, default: 0 }),
    __metadata("design:type", Number)
], QuotationDetail.prototype, "quantity_base_uom", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => uom_catalog_entity_1.UoMCatalog, { onDelete: 'RESTRICT', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'base_uom_id' }),
    __metadata("design:type", uom_catalog_entity_1.UoMCatalog)
], QuotationDetail.prototype, "base_uom", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], QuotationDetail.prototype, "base_uom_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 16, scale: 4 }),
    __metadata("design:type", Number)
], QuotationDetail.prototype, "unit_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], QuotationDetail.prototype, "discount_percentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], QuotationDetail.prototype, "discount_unit", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_discount_entity_1.ProductDiscount, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'product_discount_id' }),
    __metadata("design:type", Object)
], QuotationDetail.prototype, "product_discount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], QuotationDetail.prototype, "product_discount_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], QuotationDetail.prototype, "iva_percentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], QuotationDetail.prototype, "iva_unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], QuotationDetail.prototype, "ieps_percentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], QuotationDetail.prototype, "ieps_unit", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QuotationDetail.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], QuotationDetail.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], QuotationDetail.prototype, "updated_by", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], QuotationDetail.prototype, "updated_at", void 0);
exports.QuotationDetail = QuotationDetail = __decorate([
    (0, typeorm_1.Entity)('inv_s_quotation_details'),
    (0, typeorm_1.Index)('idx_qt_detail_quotation', ['quotation_id']),
    (0, typeorm_1.Index)('idx_qt_detail_product', ['product_id'])
], QuotationDetail);
//# sourceMappingURL=quotation-detail.entity.js.map