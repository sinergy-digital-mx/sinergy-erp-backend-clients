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
exports.TransferContextResponseDto = exports.TransferContextWarehouseDto = exports.TransferContextBranchDto = exports.TransferContextFiscalDto = exports.TransferContextBatchDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const inventory_location_tree_response_dto_1 = require("./inventory-location-tree-response.dto");
class TransferContextBatchDto {
    batch_id;
    batch_number;
    source_tag_identifier;
    measure;
    measure_uom_id;
    measure_uom_name;
    measure_label;
    available_quantity;
    initial_quantity;
    purchase_order_folio;
    created_at;
}
exports.TransferContextBatchDto = TransferContextBatchDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransferContextBatchDto.prototype, "batch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransferContextBatchDto.prototype, "batch_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], TransferContextBatchDto.prototype, "source_tag_identifier", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], TransferContextBatchDto.prototype, "measure", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], TransferContextBatchDto.prototype, "measure_uom_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], TransferContextBatchDto.prototype, "measure_uom_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], TransferContextBatchDto.prototype, "measure_label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransferContextBatchDto.prototype, "available_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransferContextBatchDto.prototype, "initial_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], TransferContextBatchDto.prototype, "purchase_order_folio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], TransferContextBatchDto.prototype, "created_at", void 0);
class TransferContextFiscalDto {
    id;
    razon_social;
    rfc;
}
exports.TransferContextFiscalDto = TransferContextFiscalDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransferContextFiscalDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransferContextFiscalDto.prototype, "razon_social", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransferContextFiscalDto.prototype, "rfc", void 0);
class TransferContextBranchDto {
    id;
    code;
    city;
    state;
    fiscal_configuration;
}
exports.TransferContextBranchDto = TransferContextBranchDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransferContextBranchDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransferContextBranchDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransferContextBranchDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransferContextBranchDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: TransferContextFiscalDto, nullable: true }),
    __metadata("design:type", Object)
], TransferContextBranchDto.prototype, "fiscal_configuration", void 0);
class TransferContextWarehouseDto {
    id;
    name;
    code;
    billing_branch_id;
    billing_branch;
}
exports.TransferContextWarehouseDto = TransferContextWarehouseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransferContextWarehouseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransferContextWarehouseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], TransferContextWarehouseDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], TransferContextWarehouseDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: TransferContextBranchDto, nullable: true }),
    __metadata("design:type", Object)
], TransferContextWarehouseDto.prototype, "billing_branch", void 0);
class TransferContextResponseDto {
    product_id;
    product_name;
    product_sku;
    uom_id;
    uom_name;
    total_available_quantity;
    total_batches;
    source_warehouse;
    destinations;
    batches;
}
exports.TransferContextResponseDto = TransferContextResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransferContextResponseDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransferContextResponseDto.prototype, "product_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransferContextResponseDto.prototype, "product_sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransferContextResponseDto.prototype, "uom_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransferContextResponseDto.prototype, "uom_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TransferContextResponseDto.prototype, "total_available_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TransferContextResponseDto.prototype, "total_batches", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: TransferContextWarehouseDto }),
    __metadata("design:type", TransferContextWarehouseDto)
], TransferContextResponseDto.prototype, "source_warehouse", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [inventory_location_tree_response_dto_1.InventoryLocationFiscalDto],
        description: 'Árbol destino razón social → sucursal → almacén (activos, sin el almacén origen)',
    }),
    __metadata("design:type", Array)
], TransferContextResponseDto.prototype, "destinations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [TransferContextBatchDto] }),
    __metadata("design:type", Array)
], TransferContextResponseDto.prototype, "batches", void 0);
//# sourceMappingURL=transfer-context-response.dto.js.map