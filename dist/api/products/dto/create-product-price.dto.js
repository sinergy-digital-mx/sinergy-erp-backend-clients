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
exports.CreateProductPriceDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class CreateProductPriceDto {
    price_list_id;
    product_uom_id;
    price;
    iva_percentage;
    ieps_percentage;
}
exports.CreateProductPriceDto = CreateProductPriceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-price-list', description: 'ID de la lista de precios' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateProductPriceDto.prototype, "price_list_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-product-uom', description: 'ID de la UOM del producto' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateProductPriceDto.prototype, "product_uom_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2.15, description: 'Precio unitario. Hasta 4 decimales (p. ej. 2.150).' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProductPriceDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 16, description: 'Porcentaje de IVA' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProductPriceDto.prototype, "iva_percentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Porcentaje de IEPS' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProductPriceDto.prototype, "ieps_percentage", void 0);
//# sourceMappingURL=create-product-price.dto.js.map