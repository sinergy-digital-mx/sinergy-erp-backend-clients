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
exports.ProductAttributeValue = void 0;
const typeorm_1 = require("typeorm");
const product_attribute_entity_1 = require("./product-attribute.entity");
let ProductAttributeValue = class ProductAttributeValue {
    id;
    attribute;
    attribute_id;
    value;
    display_order;
    is_active;
    created_at;
    updated_at;
};
exports.ProductAttributeValue = ProductAttributeValue;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProductAttributeValue.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_attribute_entity_1.ProductAttribute, (attribute) => attribute.values, {
        onDelete: 'CASCADE',
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'attribute_id' }),
    __metadata("design:type", product_attribute_entity_1.ProductAttribute)
], ProductAttributeValue.prototype, "attribute", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProductAttributeValue.prototype, "attribute_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], ProductAttributeValue.prototype, "value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ProductAttributeValue.prototype, "display_order", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], ProductAttributeValue.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ProductAttributeValue.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ProductAttributeValue.prototype, "updated_at", void 0);
exports.ProductAttributeValue = ProductAttributeValue = __decorate([
    (0, typeorm_1.Entity)('product_attribute_values'),
    (0, typeorm_1.Index)('UQ_product_attribute_values_attribute_value', ['attribute_id', 'value'], { unique: true }),
    (0, typeorm_1.Index)('IDX_product_attribute_values_attribute_id', ['attribute_id']),
    (0, typeorm_1.Index)('IDX_product_attribute_values_is_active', ['is_active'])
], ProductAttributeValue);
//# sourceMappingURL=product-attribute-value.entity.js.map