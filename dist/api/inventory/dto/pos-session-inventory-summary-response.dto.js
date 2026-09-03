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
exports.PosSessionInventorySummaryResponseDto = exports.PosSessionWarehouseDto = exports.PosSessionProductInventorySummaryDto = exports.PosSessionBatchBreakdownDto = exports.PosSessionApplicableDiscountDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const product_discount_entity_1 = require("../../../entities/products/product-discount.entity");
class PosSessionApplicableDiscountDto {
    id;
    name;
    discount_type;
    value;
    product_uom_id;
}
exports.PosSessionApplicableDiscountDto = PosSessionApplicableDiscountDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosSessionApplicableDiscountDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosSessionApplicableDiscountDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: product_discount_entity_1.ProductDiscountType }),
    __metadata("design:type", String)
], PosSessionApplicableDiscountDto.prototype, "discount_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PosSessionApplicableDiscountDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], PosSessionApplicableDiscountDto.prototype, "product_uom_id", void 0);
class PosSessionBatchBreakdownDto {
    batch_id;
    batch_number;
    source_tag_identifier;
    measure;
    measure_uom_id;
    measure_uom_name;
    measure_label;
    warehouse_id;
    warehouse_name;
    available_quantity;
    initial_quantity;
    purchase_order_folio;
    created_at;
}
exports.PosSessionBatchBreakdownDto = PosSessionBatchBreakdownDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosSessionBatchBreakdownDto.prototype, "batch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosSessionBatchBreakdownDto.prototype, "batch_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], PosSessionBatchBreakdownDto.prototype, "source_tag_identifier", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], PosSessionBatchBreakdownDto.prototype, "measure", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], PosSessionBatchBreakdownDto.prototype, "measure_uom_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], PosSessionBatchBreakdownDto.prototype, "measure_uom_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], PosSessionBatchBreakdownDto.prototype, "measure_label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosSessionBatchBreakdownDto.prototype, "warehouse_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosSessionBatchBreakdownDto.prototype, "warehouse_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosSessionBatchBreakdownDto.prototype, "available_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosSessionBatchBreakdownDto.prototype, "initial_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], PosSessionBatchBreakdownDto.prototype, "purchase_order_folio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], PosSessionBatchBreakdownDto.prototype, "created_at", void 0);
class PosSessionProductInventorySummaryDto {
    product_id;
    product_name;
    product_sku;
    product_photo;
    uom_id;
    uom_name;
    warehouse_ids;
    warehouse_names;
    suggested_unit_price;
    suggested_iva_percentage;
    suggested_ieps_percentage;
    pricing_options;
    product_uom_id;
    has_applicable_discounts;
    applicable_discounts;
    total_available_quantity;
    total_initial_quantity;
    total_batches;
    measure_totals;
    batches;
}
exports.PosSessionProductInventorySummaryDto = PosSessionProductInventorySummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosSessionProductInventorySummaryDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosSessionProductInventorySummaryDto.prototype, "product_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosSessionProductInventorySummaryDto.prototype, "product_sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Signed product photo URL (temporary access)' }),
    __metadata("design:type", Object)
], PosSessionProductInventorySummaryDto.prototype, "product_photo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosSessionProductInventorySummaryDto.prototype, "uom_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosSessionProductInventorySummaryDto.prototype, "uom_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], PosSessionProductInventorySummaryDto.prototype, "warehouse_ids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], PosSessionProductInventorySummaryDto.prototype, "warehouse_names", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], PosSessionProductInventorySummaryDto.prototype, "suggested_unit_price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], PosSessionProductInventorySummaryDto.prototype, "suggested_iva_percentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], PosSessionProductInventorySummaryDto.prototype, "suggested_ieps_percentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], PosSessionProductInventorySummaryDto.prototype, "pricing_options", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID de product_uoms para enviar en sales-orders (product_uom_id)',
    }),
    __metadata("design:type", String)
], PosSessionProductInventorySummaryDto.prototype, "product_uom_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Indica si el producto tiene descuentos activos aplicables a esta UOM',
    }),
    __metadata("design:type", Boolean)
], PosSessionProductInventorySummaryDto.prototype, "has_applicable_discounts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PosSessionApplicableDiscountDto] }),
    __metadata("design:type", Array)
], PosSessionProductInventorySummaryDto.prototype, "applicable_discounts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosSessionProductInventorySummaryDto.prototype, "total_available_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosSessionProductInventorySummaryDto.prototype, "total_initial_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PosSessionProductInventorySummaryDto.prototype, "total_batches", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object] }),
    __metadata("design:type", Array)
], PosSessionProductInventorySummaryDto.prototype, "measure_totals", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PosSessionBatchBreakdownDto] }),
    __metadata("design:type", Array)
], PosSessionProductInventorySummaryDto.prototype, "batches", void 0);
class PosSessionWarehouseDto {
    id;
    name;
    status;
}
exports.PosSessionWarehouseDto = PosSessionWarehouseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosSessionWarehouseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosSessionWarehouseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PosSessionWarehouseDto.prototype, "status", void 0);
class PosSessionInventorySummaryResponseDto {
    billing_branch_id;
    fiscal_configuration_id;
    warehouses;
    applied_warehouse_id;
    data;
    total;
    page;
    limit;
    totalPages;
}
exports.PosSessionInventorySummaryResponseDto = PosSessionInventorySummaryResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Sucursal de la terminal POS (billing_branch_id del usuario)' }),
    __metadata("design:type", String)
], PosSessionInventorySummaryResponseDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        nullable: true,
        description: 'Razón social de esa sucursal. Usar al crear la orden POS.',
    }),
    __metadata("design:type", Object)
], PosSessionInventorySummaryResponseDto.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [PosSessionWarehouseDto],
        description: 'Almacenes de esa sucursal. Usar uno de estos ids si se filtra por warehouse_id.',
    }),
    __metadata("design:type", Array)
], PosSessionInventorySummaryResponseDto.prototype, "warehouses", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        nullable: true,
        description: 'Almacén aplicado al filtro. null = todos los de la sucursal.',
    }),
    __metadata("design:type", Object)
], PosSessionInventorySummaryResponseDto.prototype, "applied_warehouse_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PosSessionProductInventorySummaryDto] }),
    __metadata("design:type", Array)
], PosSessionInventorySummaryResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PosSessionInventorySummaryResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PosSessionInventorySummaryResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PosSessionInventorySummaryResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PosSessionInventorySummaryResponseDto.prototype, "totalPages", void 0);
//# sourceMappingURL=pos-session-inventory-summary-response.dto.js.map