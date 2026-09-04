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
exports.CreateProductDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const product_item_kind_enum_1 = require("../../../entities/products/product-item-kind.enum");
class CreateProductDto {
    sku;
    external_sku;
    name;
    description;
    sat_clave;
    sat_code;
    category_id;
    subcategory_id;
    item_kind;
    base_uom_catalog_id;
    base_uom_id;
}
exports.CreateProductDto = CreateProductDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'PROD-001', description: 'SKU único. En servicio se puede omitir y se genera.' }),
    (0, class_validator_1.ValidateIf)((dto) => dto.item_kind !== product_item_kind_enum_1.ProductItemKind.Service || !!dto.sku),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], CreateProductDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'EXT-ERP-001',
        description: 'SKU externo del producto en sistemas de terceros',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], CreateProductDto.prototype, "external_sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Producto de ejemplo', description: 'Nombre del producto' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], CreateProductDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Descripción detallada del producto', description: 'Descripción' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '31201610', description: 'Clave de producto o servicio SAT (c_ClaveProdServ)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 8),
    __metadata("design:type", String)
], CreateProductDto.prototype, "sat_clave", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '31201610', description: 'Alias de sat_clave' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 8),
    __metadata("design:type", String)
], CreateProductDto.prototype, "sat_code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'uuid-category', description: 'ID de la categoría' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "category_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'uuid-subcategory', description: 'ID de la subcategoría' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "subcategory_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: product_item_kind_enum_1.ProductItemKind, default: product_item_kind_enum_1.ProductItemKind.Goods }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(product_item_kind_enum_1.ProductItemKind),
    __metadata("design:type", String)
], CreateProductDto.prototype, "item_kind", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'uuid-uom-catalog',
        description: 'UOM base del catálogo. Si se envía, se crea en la misma transacción.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "base_uom_catalog_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'uuid-uom-catalog' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "base_uom_id", void 0);
//# sourceMappingURL=create-product.dto.js.map