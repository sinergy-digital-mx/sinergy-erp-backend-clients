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
exports.CreateProductUoMDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class CreateProductUoMDto {
    uom_catalog_id;
    factor;
    is_base;
    parent_uom_id;
}
exports.CreateProductUoMDto = CreateProductUoMDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-uom-catalog', description: 'ID de la UoM del catálogo' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateProductUoMDto.prototype, "uom_catalog_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 24, description: 'Factor de conversión (entero)' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateProductUoMDto.prototype, "factor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Es la unidad base del producto' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateProductUoMDto.prototype, "is_base", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'uuid-parent-uom',
        description: 'UoM padre: preferible product_uoms.id de otra UoM del mismo producto; también acepta uom_catalog.id. En BD se guarda siempre como uom_catalog.id.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], CreateProductUoMDto.prototype, "parent_uom_id", void 0);
//# sourceMappingURL=create-product-uom.dto.js.map