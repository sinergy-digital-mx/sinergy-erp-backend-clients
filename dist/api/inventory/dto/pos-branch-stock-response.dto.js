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
exports.PosBranchStockResponseDto = exports.PosBranchStockProductDto = exports.PosBranchStockCellDto = exports.PosBranchStockBranchDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class PosBranchStockBranchDto {
    id;
    name;
    city;
}
exports.PosBranchStockBranchDto = PosBranchStockBranchDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosBranchStockBranchDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Código de la sucursal' }),
    __metadata("design:type", String)
], PosBranchStockBranchDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], PosBranchStockBranchDto.prototype, "city", void 0);
class PosBranchStockCellDto {
    billing_branch_id;
    quantity;
    uom_name;
}
exports.PosBranchStockCellDto = PosBranchStockCellDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosBranchStockCellDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '12.000', description: 'Existencia. Sin costo.' }),
    __metadata("design:type", String)
], PosBranchStockCellDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], PosBranchStockCellDto.prototype, "uom_name", void 0);
class PosBranchStockProductDto {
    product_id;
    sku;
    name;
    uom_name;
    total_quantity;
    branches;
}
exports.PosBranchStockProductDto = PosBranchStockProductDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosBranchStockProductDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosBranchStockProductDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosBranchStockProductDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosBranchStockProductDto.prototype, "uom_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosBranchStockProductDto.prototype, "total_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PosBranchStockCellDto] }),
    __metadata("design:type", Array)
], PosBranchStockProductDto.prototype, "branches", void 0);
class PosBranchStockResponseDto {
    search;
    has_more;
    branches;
    products;
}
exports.PosBranchStockResponseDto = PosBranchStockResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosBranchStockResponseDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Hay más productos que el tope de la consulta' }),
    __metadata("design:type", Boolean)
], PosBranchStockResponseDto.prototype, "has_more", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PosBranchStockBranchDto] }),
    __metadata("design:type", Array)
], PosBranchStockResponseDto.prototype, "branches", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PosBranchStockProductDto] }),
    __metadata("design:type", Array)
], PosBranchStockResponseDto.prototype, "products", void 0);
//# sourceMappingURL=pos-branch-stock-response.dto.js.map