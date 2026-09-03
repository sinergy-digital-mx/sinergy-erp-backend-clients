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
exports.QueryVendorProductsDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const toOptionalBoolean = ({ value }) => {
    if (value === undefined || value === null || value === '')
        return undefined;
    if (value === true || value === 'true' || value === '1' || value === 1)
        return true;
    if (value === false || value === 'false' || value === '0' || value === 0)
        return false;
    return undefined;
};
class QueryVendorProductsDto {
    search;
    include_without_cost;
    only_with_cost;
}
exports.QueryVendorProductsDto = QueryVendorProductsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filtrar por nombre, SKU o SKU externo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryVendorProductsDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        default: true,
        description: 'Incluir productos activos sin costo de este proveedor',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(toOptionalBoolean),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueryVendorProductsDto.prototype, "include_without_cost", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Solo productos con costo de este proveedor (comportamiento anterior)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(toOptionalBoolean),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueryVendorProductsDto.prototype, "only_with_cost", void 0);
//# sourceMappingURL=query-vendor-products.dto.js.map