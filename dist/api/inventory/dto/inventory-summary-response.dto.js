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
exports.InventorySummaryResponseDto = exports.ProductInventorySummaryDto = exports.MeasureTotalDto = exports.BatchBreakdownDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class BatchBreakdownDto {
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
exports.BatchBreakdownDto = BatchBreakdownDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchBreakdownDto.prototype, "batch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchBreakdownDto.prototype, "batch_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BatchBreakdownDto.prototype, "source_tag_identifier", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        nullable: true,
        description: 'Tamaño (8, 12). Independiente de la UOM de inventario.',
    }),
    __metadata("design:type", Object)
], BatchBreakdownDto.prototype, "measure", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BatchBreakdownDto.prototype, "measure_uom_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], BatchBreakdownDto.prototype, "measure_uom_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Ej. "8 Foot". No concatenar con uom_name.' }),
    __metadata("design:type", Object)
], BatchBreakdownDto.prototype, "measure_label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchBreakdownDto.prototype, "available_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BatchBreakdownDto.prototype, "initial_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], BatchBreakdownDto.prototype, "purchase_order_folio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], BatchBreakdownDto.prototype, "created_at", void 0);
class MeasureTotalDto {
    measure;
    measure_uom_id;
    measure_uom_name;
    measure_label;
    total_available_quantity;
    total_initial_quantity;
    total_batches;
}
exports.MeasureTotalDto = MeasureTotalDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        nullable: true,
        description: 'Tamaño (8, 12). Null = lotes de este SKU sin tamaño.',
    }),
    __metadata("design:type", Object)
], MeasureTotalDto.prototype, "measure", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], MeasureTotalDto.prototype, "measure_uom_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], MeasureTotalDto.prototype, "measure_uom_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Ej. "8 Foot"' }),
    __metadata("design:type", Object)
], MeasureTotalDto.prototype, "measure_label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MeasureTotalDto.prototype, "total_available_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MeasureTotalDto.prototype, "total_initial_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MeasureTotalDto.prototype, "total_batches", void 0);
class ProductInventorySummaryDto {
    product_id;
    product_name;
    product_sku;
    product_photo;
    warehouse_id;
    warehouse_name;
    fiscal_configuration_id;
    razon_social;
    billing_branch_id;
    sucursal;
    uom_id;
    uom_name;
    suggested_unit_price;
    suggested_iva_percentage;
    suggested_ieps_percentage;
    pricing_options;
    total_available_quantity;
    total_initial_quantity;
    total_batches;
    measure_totals;
    batches;
}
exports.ProductInventorySummaryDto = ProductInventorySummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ProductInventorySummaryDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ProductInventorySummaryDto.prototype, "product_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ProductInventorySummaryDto.prototype, "product_sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Signed product photo URL (temporary access)' }),
    __metadata("design:type", Object)
], ProductInventorySummaryDto.prototype, "product_photo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ProductInventorySummaryDto.prototype, "warehouse_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ProductInventorySummaryDto.prototype, "warehouse_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Razón social ID' }),
    __metadata("design:type", Object)
], ProductInventorySummaryDto.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Razón social' }),
    __metadata("design:type", Object)
], ProductInventorySummaryDto.prototype, "razon_social", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Sucursal ID' }),
    __metadata("design:type", Object)
], ProductInventorySummaryDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Nombre de sucursal' }),
    __metadata("design:type", Object)
], ProductInventorySummaryDto.prototype, "sucursal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ProductInventorySummaryDto.prototype, "uom_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ProductInventorySummaryDto.prototype, "uom_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Suggested unit price for this product/UOM' }),
    __metadata("design:type", Object)
], ProductInventorySummaryDto.prototype, "suggested_unit_price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Suggested IVA percentage from price list' }),
    __metadata("design:type", Object)
], ProductInventorySummaryDto.prototype, "suggested_iva_percentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Suggested IEPS percentage from price list' }),
    __metadata("design:type", Object)
], ProductInventorySummaryDto.prototype, "suggested_ieps_percentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object], description: 'All active price-list options for this product/UOM' }),
    __metadata("design:type", Array)
], ProductInventorySummaryDto.prototype, "pricing_options", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ProductInventorySummaryDto.prototype, "total_available_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ProductInventorySummaryDto.prototype, "total_initial_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ProductInventorySummaryDto.prototype, "total_batches", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [MeasureTotalDto] }),
    __metadata("design:type", Array)
], ProductInventorySummaryDto.prototype, "measure_totals", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BatchBreakdownDto] }),
    __metadata("design:type", Array)
], ProductInventorySummaryDto.prototype, "batches", void 0);
class InventorySummaryResponseDto {
    data;
    total;
    page;
    limit;
    totalPages;
}
exports.InventorySummaryResponseDto = InventorySummaryResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ProductInventorySummaryDto] }),
    __metadata("design:type", Array)
], InventorySummaryResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InventorySummaryResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InventorySummaryResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InventorySummaryResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InventorySummaryResponseDto.prototype, "totalPages", void 0);
//# sourceMappingURL=inventory-summary-response.dto.js.map