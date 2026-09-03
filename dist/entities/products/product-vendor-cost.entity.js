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
exports.ProductVendorCost = void 0;
const typeorm_1 = require("typeorm");
const product_entity_1 = require("./product.entity");
const vendor_entity_1 = require("../vendor/vendor.entity");
const product_uom_entity_1 = require("./product-uom.entity");
let ProductVendorCost = class ProductVendorCost {
    id;
    product;
    product_id;
    vendor;
    vendor_id;
    product_uom;
    product_uom_id;
    cost;
    currency;
    iva_percentage;
    ieps_percentage;
    iva_unit_total;
    ieps_unit_total;
    subtotal;
    total;
    created_at;
    updated_at;
};
exports.ProductVendorCost = ProductVendorCost;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProductVendorCost.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], ProductVendorCost.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProductVendorCost.prototype, "product_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vendor_entity_1.Vendor, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'vendor_id' }),
    __metadata("design:type", vendor_entity_1.Vendor)
], ProductVendorCost.prototype, "vendor", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProductVendorCost.prototype, "vendor_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_uom_entity_1.ProductUoM, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'product_uom_id' }),
    __metadata("design:type", product_uom_entity_1.ProductUoM)
], ProductVendorCost.prototype, "product_uom", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProductVendorCost.prototype, "product_uom_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 16, scale: 4 }),
    __metadata("design:type", Number)
], ProductVendorCost.prototype, "cost", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['MXN', 'USD'],
        default: 'MXN',
    }),
    __metadata("design:type", String)
], ProductVendorCost.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ProductVendorCost.prototype, "iva_percentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ProductVendorCost.prototype, "ieps_percentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ProductVendorCost.prototype, "iva_unit_total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ProductVendorCost.prototype, "ieps_unit_total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], ProductVendorCost.prototype, "subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], ProductVendorCost.prototype, "total", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ProductVendorCost.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ProductVendorCost.prototype, "updated_at", void 0);
exports.ProductVendorCost = ProductVendorCost = __decorate([
    (0, typeorm_1.Entity)('product_vendor_costs'),
    (0, typeorm_1.Index)('product_vendor_uom_unique', ['product_id', 'vendor_id', 'product_uom_id'], { unique: true }),
    (0, typeorm_1.Index)('product_index', ['product_id']),
    (0, typeorm_1.Index)('vendor_index', ['vendor_id']),
    (0, typeorm_1.Index)('product_uom_index', ['product_uom_id'])
], ProductVendorCost);
//# sourceMappingURL=product-vendor-cost.entity.js.map