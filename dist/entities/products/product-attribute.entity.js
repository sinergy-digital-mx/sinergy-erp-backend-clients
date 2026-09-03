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
exports.ProductAttribute = void 0;
const typeorm_1 = require("typeorm");
const product_attribute_value_entity_1 = require("./product-attribute-value.entity");
let ProductAttribute = class ProductAttribute {
    id;
    tenant_id;
    name;
    is_active;
    values;
    created_at;
    updated_at;
};
exports.ProductAttribute = ProductAttribute;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProductAttribute.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProductAttribute.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], ProductAttribute.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], ProductAttribute.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => product_attribute_value_entity_1.ProductAttributeValue, (value) => value.attribute),
    __metadata("design:type", Array)
], ProductAttribute.prototype, "values", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ProductAttribute.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ProductAttribute.prototype, "updated_at", void 0);
exports.ProductAttribute = ProductAttribute = __decorate([
    (0, typeorm_1.Entity)('product_attributes'),
    (0, typeorm_1.Index)('UQ_product_attributes_tenant_name', ['tenant_id', 'name'], { unique: true }),
    (0, typeorm_1.Index)('IDX_product_attributes_tenant_id', ['tenant_id']),
    (0, typeorm_1.Index)('IDX_product_attributes_is_active', ['is_active'])
], ProductAttribute);
//# sourceMappingURL=product-attribute.entity.js.map