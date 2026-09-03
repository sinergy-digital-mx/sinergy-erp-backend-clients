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
exports.InventoryTransferListResponseDto = exports.InventoryTransferResponseDto = exports.InventoryTransferUserSummaryDto = exports.InventoryTransferWarehouseSummaryDto = exports.InventoryTransferLineResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class InventoryTransferLineResponseDto {
    id;
    source_inventory_batch_id;
    source_batch_number;
    destination_inventory_batch_id;
    destination_batch_number;
    quantity;
    created_at;
}
exports.InventoryTransferLineResponseDto = InventoryTransferLineResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryTransferLineResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryTransferLineResponseDto.prototype, "source_inventory_batch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryTransferLineResponseDto.prototype, "source_batch_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryTransferLineResponseDto.prototype, "destination_inventory_batch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryTransferLineResponseDto.prototype, "destination_batch_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryTransferLineResponseDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], InventoryTransferLineResponseDto.prototype, "created_at", void 0);
class InventoryTransferWarehouseSummaryDto {
    id;
    name;
    code;
    billing_branch_id;
    billing_branch_code;
    billing_branch_city;
    billing_branch_state;
    fiscal_configuration_id;
    fiscal_razon_social;
    fiscal_rfc;
}
exports.InventoryTransferWarehouseSummaryDto = InventoryTransferWarehouseSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryTransferWarehouseSummaryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryTransferWarehouseSummaryDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryTransferWarehouseSummaryDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryTransferWarehouseSummaryDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryTransferWarehouseSummaryDto.prototype, "billing_branch_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryTransferWarehouseSummaryDto.prototype, "billing_branch_city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryTransferWarehouseSummaryDto.prototype, "billing_branch_state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryTransferWarehouseSummaryDto.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryTransferWarehouseSummaryDto.prototype, "fiscal_razon_social", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryTransferWarehouseSummaryDto.prototype, "fiscal_rfc", void 0);
class InventoryTransferUserSummaryDto {
    id;
    name;
    email;
}
exports.InventoryTransferUserSummaryDto = InventoryTransferUserSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryTransferUserSummaryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryTransferUserSummaryDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryTransferUserSummaryDto.prototype, "email", void 0);
class InventoryTransferResponseDto {
    id;
    folio;
    product_id;
    product_name;
    product_sku;
    uom_id;
    uom_name;
    source_warehouse;
    destination_warehouse;
    total_quantity;
    status;
    notes;
    created_by_user;
    created_at;
    lines;
}
exports.InventoryTransferResponseDto = InventoryTransferResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryTransferResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryTransferResponseDto.prototype, "folio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryTransferResponseDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryTransferResponseDto.prototype, "product_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryTransferResponseDto.prototype, "product_sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryTransferResponseDto.prototype, "uom_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryTransferResponseDto.prototype, "uom_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: InventoryTransferWarehouseSummaryDto }),
    __metadata("design:type", InventoryTransferWarehouseSummaryDto)
], InventoryTransferResponseDto.prototype, "source_warehouse", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: InventoryTransferWarehouseSummaryDto }),
    __metadata("design:type", InventoryTransferWarehouseSummaryDto)
], InventoryTransferResponseDto.prototype, "destination_warehouse", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryTransferResponseDto.prototype, "total_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryTransferResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryTransferResponseDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: InventoryTransferUserSummaryDto }),
    __metadata("design:type", InventoryTransferUserSummaryDto)
], InventoryTransferResponseDto.prototype, "created_by_user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], InventoryTransferResponseDto.prototype, "created_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [InventoryTransferLineResponseDto] }),
    __metadata("design:type", Array)
], InventoryTransferResponseDto.prototype, "lines", void 0);
class InventoryTransferListResponseDto {
    data;
    total;
    page;
    limit;
    totalPages;
}
exports.InventoryTransferListResponseDto = InventoryTransferListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [InventoryTransferResponseDto] }),
    __metadata("design:type", Array)
], InventoryTransferListResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InventoryTransferListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InventoryTransferListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InventoryTransferListResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InventoryTransferListResponseDto.prototype, "totalPages", void 0);
//# sourceMappingURL=inventory-transfer-response.dto.js.map