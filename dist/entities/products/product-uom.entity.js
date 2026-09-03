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
exports.ProductUoM = void 0;
const typeorm_1 = require("typeorm");
const product_entity_1 = require("./product.entity");
const uom_catalog_entity_1 = require("../uom-catalog/uom-catalog.entity");
let ProductUoM = class ProductUoM {
    id;
    product;
    product_id;
    uom;
    uom_catalog_id;
    factor;
    is_base;
    parent_uom;
    parent_uom_id;
    created_at;
    updated_at;
};
exports.ProductUoM = ProductUoM;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProductUoM.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], ProductUoM.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProductUoM.prototype, "product_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => uom_catalog_entity_1.UoMCatalog, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'uom_catalog_id' }),
    __metadata("design:type", uom_catalog_entity_1.UoMCatalog)
], ProductUoM.prototype, "uom", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProductUoM.prototype, "uom_catalog_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], ProductUoM.prototype, "factor", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ProductUoM.prototype, "is_base", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => uom_catalog_entity_1.UoMCatalog, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'parent_uom_id' }),
    __metadata("design:type", Object)
], ProductUoM.prototype, "parent_uom", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], ProductUoM.prototype, "parent_uom_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ProductUoM.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ProductUoM.prototype, "updated_at", void 0);
exports.ProductUoM = ProductUoM = __decorate([
    (0, typeorm_1.Entity)('product_uoms'),
    (0, typeorm_1.Index)('product_uom_unique', ['product_id', 'uom_catalog_id'], { unique: true }),
    (0, typeorm_1.Index)('product_index', ['product_id']),
    (0, typeorm_1.Index)('uom_catalog_index', ['uom_catalog_id'])
], ProductUoM);
//# sourceMappingURL=product-uom.entity.js.map