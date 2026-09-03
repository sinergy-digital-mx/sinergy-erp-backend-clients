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
exports.InventoryStatsResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class InventoryStatsResponseDto {
    total_batches;
    batches_with_stock;
    batches_depleted;
    total_products;
    products_with_stock;
    total_warehouses;
    total_available_quantity;
    total_initial_quantity;
    total_cost;
    total_sale_value;
    average_unit_cost;
    average_unit_price;
    gross_margin;
    gross_margin_percentage;
    batches_without_cost;
    quantity_without_cost;
    products_without_price;
    quantity_without_price;
}
exports.InventoryStatsResponseDto = InventoryStatsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total de lotes (incluye agotados)', example: 120 }),
    __metadata("design:type", Number)
], InventoryStatsResponseDto.prototype, "total_batches", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Lotes con existencia > 0', example: 98 }),
    __metadata("design:type", Number)
], InventoryStatsResponseDto.prototype, "batches_with_stock", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Lotes agotados (existencia = 0)', example: 22 }),
    __metadata("design:type", Number)
], InventoryStatsResponseDto.prototype, "batches_depleted", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Productos distintos en el alcance', example: 45 }),
    __metadata("design:type", Number)
], InventoryStatsResponseDto.prototype, "total_products", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Productos con existencia > 0', example: 40 }),
    __metadata("design:type", Number)
], InventoryStatsResponseDto.prototype, "products_with_stock", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Almacenes con lotes en el alcance', example: 3 }),
    __metadata("design:type", Number)
], InventoryStatsResponseDto.prototype, "total_warehouses", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cantidad disponible total', example: '15230.000' }),
    __metadata("design:type", String)
], InventoryStatsResponseDto.prototype, "total_available_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cantidad inicial total', example: '18000.000' }),
    __metadata("design:type", String)
], InventoryStatsResponseDto.prototype, "total_initial_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Valor a costo de compra (existencia × costo unitario OC)', example: '450000.00' }),
    __metadata("design:type", String)
], InventoryStatsResponseDto.prototype, "total_cost", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Valor a precio de venta sugerido (existencia × precio lista)', example: '720000.00' }),
    __metadata("design:type", String)
], InventoryStatsResponseDto.prototype, "total_sale_value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Costo unitario promedio ponderado por existencia', example: '29.55' }),
    __metadata("design:type", String)
], InventoryStatsResponseDto.prototype, "average_unit_cost", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Precio unitario promedio ponderado por existencia', example: '47.27' }),
    __metadata("design:type", String)
], InventoryStatsResponseDto.prototype, "average_unit_price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Margen bruto = valor venta − costo', example: '270000.00' }),
    __metadata("design:type", String)
], InventoryStatsResponseDto.prototype, "gross_margin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Margen bruto % sobre valor de venta', example: '37.50' }),
    __metadata("design:type", String)
], InventoryStatsResponseDto.prototype, "gross_margin_percentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Lotes con stock sin costo de OC', example: 5 }),
    __metadata("design:type", Number)
], InventoryStatsResponseDto.prototype, "batches_without_cost", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Existencia sin costo de OC', example: '120.000' }),
    __metadata("design:type", String)
], InventoryStatsResponseDto.prototype, "quantity_without_cost", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Productos+UOM con stock sin precio de lista', example: 2 }),
    __metadata("design:type", Number)
], InventoryStatsResponseDto.prototype, "products_without_price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Existencia sin precio de lista', example: '80.000' }),
    __metadata("design:type", String)
], InventoryStatsResponseDto.prototype, "quantity_without_price", void 0);
//# sourceMappingURL=inventory-stats-response.dto.js.map