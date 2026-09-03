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
exports.InventoryLocationTreeResponseDto = exports.InventoryLocationFiscalDto = exports.InventoryLocationBranchDto = exports.InventoryLocationWarehouseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class InventoryLocationWarehouseDto {
    id;
    name;
    status;
}
exports.InventoryLocationWarehouseDto = InventoryLocationWarehouseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryLocationWarehouseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryLocationWarehouseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['active', 'inactive'] }),
    __metadata("design:type", String)
], InventoryLocationWarehouseDto.prototype, "status", void 0);
class InventoryLocationBranchDto {
    id;
    name;
    status;
    warehouses;
}
exports.InventoryLocationBranchDto = InventoryLocationBranchDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryLocationBranchDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nombre de sucursal (code en BD)' }),
    __metadata("design:type", String)
], InventoryLocationBranchDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '1 = activa, 0 = inactiva' }),
    __metadata("design:type", Number)
], InventoryLocationBranchDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [InventoryLocationWarehouseDto] }),
    __metadata("design:type", Array)
], InventoryLocationBranchDto.prototype, "warehouses", void 0);
class InventoryLocationFiscalDto {
    id;
    razon_social;
    rfc;
    status;
    branches;
}
exports.InventoryLocationFiscalDto = InventoryLocationFiscalDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryLocationFiscalDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryLocationFiscalDto.prototype, "razon_social", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryLocationFiscalDto.prototype, "rfc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['active', 'inactive'] }),
    __metadata("design:type", String)
], InventoryLocationFiscalDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [InventoryLocationBranchDto] }),
    __metadata("design:type", Array)
], InventoryLocationFiscalDto.prototype, "branches", void 0);
class InventoryLocationTreeResponseDto {
    data;
}
exports.InventoryLocationTreeResponseDto = InventoryLocationTreeResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [InventoryLocationFiscalDto] }),
    __metadata("design:type", Array)
], InventoryLocationTreeResponseDto.prototype, "data", void 0);
//# sourceMappingURL=inventory-location-tree-response.dto.js.map