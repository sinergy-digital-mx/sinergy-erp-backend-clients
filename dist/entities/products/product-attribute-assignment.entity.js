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
exports.ProductAttributeAssignment = void 0;
const typeorm_1 = require("typeorm");
const product_entity_1 = require("./product.entity");
const product_attribute_value_entity_1 = require("./product-attribute-value.entity");
let ProductAttributeAssignment = class ProductAttributeAssignment {
    id;
    product;
    product_id;
    attribute_value;
    attribute_value_id;
    created_at;
    updated_at;
};
exports.ProductAttributeAssignment = ProductAttributeAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProductAttributeAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], ProductAttributeAssignment.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProductAttributeAssignment.prototype, "product_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_attribute_value_entity_1.ProductAttributeValue, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'attribute_value_id' }),
    __metadata("design:type", product_attribute_value_entity_1.ProductAttributeValue)
], ProductAttributeAssignment.prototype, "attribute_value", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProductAttributeAssignment.prototype, "attribute_value_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ProductAttributeAssignment.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ProductAttributeAssignment.prototype, "updated_at", void 0);
exports.ProductAttributeAssignment = ProductAttributeAssignment = __decorate([
    (0, typeorm_1.Entity)('product_attribute_assignments'),
    (0, typeorm_1.Index)('UQ_product_attribute_assignments_product_value', ['product_id', 'attribute_value_id'], {
        unique: true,
    }),
    (0, typeorm_1.Index)('IDX_product_attribute_assignments_product_id', ['product_id']),
    (0, typeorm_1.Index)('IDX_product_attribute_assignments_attribute_value_id', ['attribute_value_id'])
], ProductAttributeAssignment);
//# sourceMappingURL=product-attribute-assignment.entity.js.map