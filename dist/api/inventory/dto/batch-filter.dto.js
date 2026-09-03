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
exports.BatchFilterDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class BatchFilterDto {
    search;
    batch_number;
    product_id;
    fiscal_configuration_id;
    billing_branch_id;
    warehouse_id;
    purchase_order_batch_id;
    purchase_order_id;
    created_from;
    created_to;
    page = 1;
    limit = 20;
    sort_by = 'created_at';
    sort_order = 'DESC';
}
exports.BatchFilterDto = BatchFilterDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Search by batch number, product name or product SKU', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BatchFilterDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filter by batch number', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BatchFilterDto.prototype, "batch_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filter by product ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BatchFilterDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filtrar por razón social. Requerido si se envía billing_branch_id',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BatchFilterDto.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filtrar por sucursal. Requiere fiscal_configuration_id. Requerido si se envía warehouse_id',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BatchFilterDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filtrar por almacén. Requiere fiscal_configuration_id y billing_branch_id',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BatchFilterDto.prototype, "warehouse_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filter by purchase order batch ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BatchFilterDto.prototype, "purchase_order_batch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filter by purchase order ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BatchFilterDto.prototype, "purchase_order_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filter batches created from this date (ISO 8601)', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], BatchFilterDto.prototype, "created_from", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Filter batches created until this date (ISO 8601)', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], BatchFilterDto.prototype, "created_to", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Page number for pagination', required: false, default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], BatchFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of records per page', required: false, default: 20, maximum: 100 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], BatchFilterDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sort by field',
        required: false,
        default: 'created_at',
        enum: ['batch_number', 'created_at', 'quantity'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['batch_number', 'created_at', 'quantity']),
    __metadata("design:type", String)
], BatchFilterDto.prototype, "sort_by", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sort order',
        required: false,
        default: 'DESC',
        enum: ['ASC', 'DESC'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['ASC', 'DESC']),
    __metadata("design:type", String)
], BatchFilterDto.prototype, "sort_order", void 0);
//# sourceMappingURL=batch-filter.dto.js.map