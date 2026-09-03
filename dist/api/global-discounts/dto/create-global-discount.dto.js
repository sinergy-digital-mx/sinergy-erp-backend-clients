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
exports.CreateGlobalDiscountDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const global_discount_entity_1 = require("../../../entities/global-discounts/global-discount.entity");
class CreateGlobalDiscountDto {
    name;
    discount_type;
    value;
    is_active = true;
    valid_from;
    valid_to;
}
exports.CreateGlobalDiscountDto = CreateGlobalDiscountDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Descuento de carpintero' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateGlobalDiscountDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: global_discount_entity_1.GlobalDiscountType, example: global_discount_entity_1.GlobalDiscountType.PERCENTAGE }),
    (0, class_validator_1.IsEnum)(global_discount_entity_1.GlobalDiscountType),
    __metadata("design:type", String)
], CreateGlobalDiscountDto.prototype, "discount_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], CreateGlobalDiscountDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateGlobalDiscountDto.prototype, "is_active", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Object)
], CreateGlobalDiscountDto.prototype, "valid_from", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Object)
], CreateGlobalDiscountDto.prototype, "valid_to", void 0);
//# sourceMappingURL=create-global-discount.dto.js.map