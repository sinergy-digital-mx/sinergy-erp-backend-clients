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
exports.QueryProductDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const product_item_kind_enum_1 = require("../../../entities/products/product-item-kind.enum");
class QueryProductDto {
    page = 1;
    limit = 10;
    search;
    sku;
    external_sku;
    name;
    category_id;
    subcategory_id;
    is_active;
    item_kind;
}
exports.QueryProductDto = QueryProductDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1, description: 'Número de página' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryProductDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 20, description: 'Registros por página (máx. 100)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryProductDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'manzana',
        description: 'Buscar por nombre, SKU o SKU externo (coincidencia parcial)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryProductDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'PROD', description: 'Buscar por SKU' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryProductDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'EXT-ERP', description: 'Buscar por SKU externo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryProductDto.prototype, "external_sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Producto', description: 'Buscar por nombre' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryProductDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'uuid-category', description: 'Filtrar por categoría' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryProductDto.prototype, "category_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'uuid-subcategory', description: 'Filtrar por subcategoría' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryProductDto.prototype, "subcategory_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true, description: 'Filtrar por estado activo/inactivo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueryProductDto.prototype, "is_active", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: product_item_kind_enum_1.ProductItemKind, description: 'Filtrar por producto o servicio' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(product_item_kind_enum_1.ProductItemKind),
    __metadata("design:type", String)
], QueryProductDto.prototype, "item_kind", void 0);
//# sourceMappingURL=query-product.dto.js.map