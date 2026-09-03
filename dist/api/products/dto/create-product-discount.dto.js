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
exports.CreateProductDiscountDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const product_discount_entity_1 = require("../../../entities/products/product-discount.entity");
class CreateProductDiscountDto {
    name;
    discount_type;
    value;
    product_uom_id;
    is_active = true;
    valid_from;
    valid_to;
}
exports.CreateProductDiscountDto = CreateProductDiscountDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Promo mostrador' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateProductDiscountDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: product_discount_entity_1.ProductDiscountType, example: product_discount_entity_1.ProductDiscountType.PERCENTAGE }),
    (0, class_validator_1.IsEnum)(product_discount_entity_1.ProductDiscountType),
    __metadata("design:type", String)
], CreateProductDiscountDto.prototype, "discount_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], CreateProductDiscountDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], CreateProductDiscountDto.prototype, "product_uom_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateProductDiscountDto.prototype, "is_active", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Object)
], CreateProductDiscountDto.prototype, "valid_from", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Object)
], CreateProductDiscountDto.prototype, "valid_to", void 0);
//# sourceMappingURL=create-product-discount.dto.js.map