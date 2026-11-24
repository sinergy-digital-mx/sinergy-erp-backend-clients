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
exports.QueryBranchReportProductsDto = exports.QueryBranchReportDto = exports.BranchStockReportResponseDto = exports.BranchReportProductDto = exports.BranchReportLineDto = exports.UpdateBranchReportSettingsDto = exports.BranchReportSettingsResponseDto = exports.BranchReportSettingsBranchDto = exports.BranchReportProductSearchResponseDto = exports.BranchReportProductHitDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class BranchReportProductHitDto {
    id;
    sku;
    name;
}
exports.BranchReportProductHitDto = BranchReportProductHitDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BranchReportProductHitDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BranchReportProductHitDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BranchReportProductHitDto.prototype, "name", void 0);
class BranchReportProductSearchResponseDto {
    products;
}
exports.BranchReportProductSearchResponseDto = BranchReportProductSearchResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BranchReportProductHitDto] }),
    __metadata("design:type", Array)
], BranchReportProductSearchResponseDto.prototype, "products", void 0);
class BranchReportSettingsBranchDto {
    id;
    name;
    city;
    razon_social;
    visible;
}
exports.BranchReportSettingsBranchDto = BranchReportSettingsBranchDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BranchReportSettingsBranchDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Código de la sucursal' }),
    __metadata("design:type", String)
], BranchReportSettingsBranchDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BranchReportSettingsBranchDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BranchReportSettingsBranchDto.prototype, "razon_social", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Si sale en el reporte' }),
    __metadata("design:type", Boolean)
], BranchReportSettingsBranchDto.prototype, "visible", void 0);
class BranchReportSettingsResponseDto {
    configured;
    branches;
}
exports.BranchReportSettingsResponseDto = BranchReportSettingsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'True cuando ya se guardó una selección' }),
    __metadata("design:type", Boolean)
], BranchReportSettingsResponseDto.prototype, "configured", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BranchReportSettingsBranchDto] }),
    __metadata("design:type", Array)
], BranchReportSettingsResponseDto.prototype, "branches", void 0);
class UpdateBranchReportSettingsDto {
    branch_ids;
}
exports.UpdateBranchReportSettingsDto = UpdateBranchReportSettingsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [String],
        description: 'Sucursales que deben salir en el reporte. Al menos una.',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(300),
    (0, class_validator_1.IsUUID)('all', { each: true }),
    __metadata("design:type", Array)
], UpdateBranchReportSettingsDto.prototype, "branch_ids", void 0);
class BranchReportLineDto {
    billing_branch_id;
    name;
    city;
    razon_social;
    uom_name;
    quantity;
    average_unit_cost;
    total_cost;
    cost_complete;
}
exports.BranchReportLineDto = BranchReportLineDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BranchReportLineDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BranchReportLineDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BranchReportLineDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BranchReportLineDto.prototype, "razon_social", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BranchReportLineDto.prototype, "uom_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '12.000' }),
    __metadata("design:type", String)
], BranchReportLineDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, example: '27.9454' }),
    __metadata("design:type", Object)
], BranchReportLineDto.prototype, "average_unit_cost", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, example: '97069.2935' }),
    __metadata("design:type", Object)
], BranchReportLineDto.prototype, "total_cost", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], BranchReportLineDto.prototype, "cost_complete", void 0);
class BranchReportProductDto {
    id;
    sku;
    name;
}
exports.BranchReportProductDto = BranchReportProductDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BranchReportProductDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BranchReportProductDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BranchReportProductDto.prototype, "name", void 0);
class BranchStockReportResponseDto {
    product;
    uom_name;
    mixed_uom;
    total_quantity;
    average_unit_cost;
    total_cost;
    cost_complete;
    lines;
}
exports.BranchStockReportResponseDto = BranchStockReportResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: BranchReportProductDto }),
    __metadata("design:type", BranchReportProductDto)
], BranchStockReportResponseDto.prototype, "product", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BranchStockReportResponseDto.prototype, "uom_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Hay existencia en más de una unidad. No se suman.' }),
    __metadata("design:type", Boolean)
], BranchStockReportResponseDto.prototype, "mixed_uom", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, example: '3624.000' }),
    __metadata("design:type", Object)
], BranchStockReportResponseDto.prototype, "total_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BranchStockReportResponseDto.prototype, "average_unit_cost", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BranchStockReportResponseDto.prototype, "total_cost", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], BranchStockReportResponseDto.prototype, "cost_complete", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BranchReportLineDto] }),
    __metadata("design:type", Array)
], BranchStockReportResponseDto.prototype, "lines", void 0);
class QueryBranchReportDto {
    product_id;
}
exports.QueryBranchReportDto = QueryBranchReportDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)('all'),
    __metadata("design:type", String)
], QueryBranchReportDto.prototype, "product_id", void 0);
class QueryBranchReportProductsDto {
    search;
}
exports.QueryBranchReportProductsDto = QueryBranchReportProductsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nombre, SKU o SKU externo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], QueryBranchReportProductsDto.prototype, "search", void 0);
//# sourceMappingURL=branch-stock-report.dto.js.map