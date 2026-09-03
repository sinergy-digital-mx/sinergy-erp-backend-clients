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
exports.BatchResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class BatchResponseDto {
    id;
    batch_number;
    source_tag_identifier;
    measure;
    measure_uom_id;
    measure_uom_name;
    measure_label;
    warehouse_id;
    warehouse_name;
    fiscal_configuration_id;
    razon_social;
    billing_branch_id;
    sucursal;
    product_id;
    product_name;
    product_sku;
    uom_id;
    uom_name;
    quantity;
    purchase_order_batch_id;
    purchase_order_id;
    purchase_order_detail_id;
    purchase_order_folio;
    created_by;
    created_at;
}
exports.BatchResponseDto = BatchResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Batch unique identifier' }),
    __metadata("design:type", String)
], BatchResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Batch number' }),
    __metadata("design:type", String)
], BatchResponseDto.prototype, "batch_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Source lot tag/identifier from receipt', nullable: true }),
    __metadata("design:type", Object)
], BatchResponseDto.prototype, "source_tag_identifier", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        nullable: true,
        description: 'Tamaño (8, 12). Independiente de la UOM de inventario.',
    }),
    __metadata("design:type", Object)
], BatchResponseDto.prototype, "measure", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Unidad del tamaño (catálogo UoM).' }),
    __metadata("design:type", Object)
], BatchResponseDto.prototype, "measure_uom_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Nombre de la unidad del tamaño (Foot, PIES).' }),
    __metadata("design:type", Object)
], BatchResponseDto.prototype, "measure_uom_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, description: 'Etiqueta lista para pintar: "8 Foot".' }),
    __metadata("design:type", Object)
], BatchResponseDto.prototype, "measure_label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Warehouse ID' }),
    __metadata("design:type", String)
], BatchResponseDto.prototype, "warehouse_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Warehouse name' }),
    __metadata("design:type", String)
], BatchResponseDto.prototype, "warehouse_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Razón social ID', nullable: true }),
    __metadata("design:type", Object)
], BatchResponseDto.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Razón social', nullable: true }),
    __metadata("design:type", Object)
], BatchResponseDto.prototype, "razon_social", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Sucursal ID', nullable: true }),
    __metadata("design:type", Object)
], BatchResponseDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nombre de sucursal', nullable: true }),
    __metadata("design:type", Object)
], BatchResponseDto.prototype, "sucursal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Product ID' }),
    __metadata("design:type", String)
], BatchResponseDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Product name' }),
    __metadata("design:type", String)
], BatchResponseDto.prototype, "product_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Product SKU' }),
    __metadata("design:type", String)
], BatchResponseDto.prototype, "product_sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unit of Measure ID' }),
    __metadata("design:type", String)
], BatchResponseDto.prototype, "uom_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unit of Measure name' }),
    __metadata("design:type", String)
], BatchResponseDto.prototype, "uom_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Batch quantity', type: 'string' }),
    __metadata("design:type", String)
], BatchResponseDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Purchase Order Batch ID', nullable: true }),
    __metadata("design:type", String)
], BatchResponseDto.prototype, "purchase_order_batch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Purchase Order ID', nullable: true }),
    __metadata("design:type", String)
], BatchResponseDto.prototype, "purchase_order_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Purchase Order Batch Detail ID', nullable: true }),
    __metadata("design:type", String)
], BatchResponseDto.prototype, "purchase_order_detail_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Purchase Order folio', nullable: true }),
    __metadata("design:type", String)
], BatchResponseDto.prototype, "purchase_order_folio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User who created the batch' }),
    __metadata("design:type", String)
], BatchResponseDto.prototype, "created_by", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Batch creation date' }),
    __metadata("design:type", Date)
], BatchResponseDto.prototype, "created_at", void 0);
//# sourceMappingURL=batch-response.dto.js.map