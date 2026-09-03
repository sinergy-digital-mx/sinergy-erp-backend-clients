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
exports.InventorySummaryFilterDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class InventorySummaryFilterDto {
    search;
    fiscal_configuration_id;
    billing_branch_id;
    warehouse_id;
    product_id;
    only_available = false;
    page = 1;
    limit = 20;
    sort_by = 'product_name';
    sort_order = 'ASC';
}
exports.InventorySummaryFilterDto = InventorySummaryFilterDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Search by product name or SKU', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InventorySummaryFilterDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filtrar por razón social. Requerido si se envía billing_branch_id',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], InventorySummaryFilterDto.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filtrar por sucursal. Requiere fiscal_configuration_id. Requerido si se envía warehouse_id',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], InventorySummaryFilterDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filtrar por almacén. Requiere fiscal_configuration_id y billing_branch_id',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], InventorySummaryFilterDto.prototype, "warehouse_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filter by product ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], InventorySummaryFilterDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Show only products with available stock > 0', required: false, default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], InventorySummaryFilterDto.prototype, "only_available", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Page number', required: false, default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], InventorySummaryFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Items per page', required: false, default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], InventorySummaryFilterDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Sort by field', required: false, default: 'product_name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['product_name', 'product_sku', 'total_available_quantity', 'warehouse_name']),
    __metadata("design:type", String)
], InventorySummaryFilterDto.prototype, "sort_by", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Sort order', required: false, default: 'ASC' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['ASC', 'DESC']),
    __metadata("design:type", String)
], InventorySummaryFilterDto.prototype, "sort_order", void 0);
//# sourceMappingURL=inventory-summary-filter.dto.js.map