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
exports.ProductDiscount = exports.ProductDiscountType = void 0;
const typeorm_1 = require("typeorm");
const product_entity_1 = require("./product.entity");
const product_uom_entity_1 = require("./product-uom.entity");
var ProductDiscountType;
(function (ProductDiscountType) {
    ProductDiscountType["PERCENTAGE"] = "percentage";
    ProductDiscountType["FIXED"] = "fixed";
})(ProductDiscountType || (exports.ProductDiscountType = ProductDiscountType = {}));
let ProductDiscount = class ProductDiscount {
    id;
    product;
    product_id;
    name;
    discount_type;
    value;
    product_uom;
    product_uom_id;
    is_active;
    valid_from;
    valid_to;
    created_at;
    updated_at;
};
exports.ProductDiscount = ProductDiscount;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProductDiscount.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], ProductDiscount.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProductDiscount.prototype, "product_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120 }),
    __metadata("design:type", String)
], ProductDiscount.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ProductDiscountType,
        default: ProductDiscountType.PERCENTAGE,
    }),
    __metadata("design:type", String)
], ProductDiscount.prototype, "discount_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], ProductDiscount.prototype, "value", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_uom_entity_1.ProductUoM, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'product_uom_id' }),
    __metadata("design:type", Object)
], ProductDiscount.prototype, "product_uom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], ProductDiscount.prototype, "product_uom_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], ProductDiscount.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], ProductDiscount.prototype, "valid_from", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], ProductDiscount.prototype, "valid_to", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ProductDiscount.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ProductDiscount.prototype, "updated_at", void 0);
exports.ProductDiscount = ProductDiscount = __decorate([
    (0, typeorm_1.Entity)('product_discounts'),
    (0, typeorm_1.Index)('product_discount_product_index', ['product_id']),
    (0, typeorm_1.Index)('product_discount_uom_index', ['product_uom_id']),
    (0, typeorm_1.Index)('UQ_product_discounts_product_name', ['product_id', 'name'], { unique: true })
], ProductDiscount);
//# sourceMappingURL=product-discount.entity.js.map