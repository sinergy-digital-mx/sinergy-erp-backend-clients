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
exports.CreatePriceListDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
function optionalNumber(value) {
    if (value === undefined)
        return undefined;
    if (value === null || value === '')
        return null;
    const parsed = typeof value === 'number' ? value : Number(String(value).trim().replace(',', '.'));
    return parsed;
}
class CreatePriceListDto {
    name;
    list_number;
    margin_percent;
    description;
}
exports.CreatePriceListDto = CreatePriceListDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Precio Comercial', description: 'Nombre de la lista de precios' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], CreatePriceListDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1, description: 'Número libre de la lista. No tiene que ir en orden.', nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => optionalNumber(value)),
    (0, class_validator_1.ValidateIf)((_, value) => value !== null && value !== undefined),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(9999),
    __metadata("design:type", Object)
], CreatePriceListDto.prototype, "list_number", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 18, description: 'Porcentaje de margen sobre el costo promedio.', nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => optionalNumber(value)),
    (0, class_validator_1.ValidateIf)((_, value) => value !== null && value !== undefined),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(-100),
    (0, class_validator_1.Max)(999.99),
    __metadata("design:type", Object)
], CreatePriceListDto.prototype, "margin_percent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Precios para clientes comerciales', description: 'Descripción' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePriceListDto.prototype, "description", void 0);
//# sourceMappingURL=create-price-list.dto.js.map