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
exports.QueryPurchaseOrderDetailExportDto = exports.QueryPurchaseOrderHeaderExportDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class QueryPurchaseOrderHeaderExportDto {
    search;
    general_status;
    payment_status;
    vendor_id;
    fiscal_configuration_id;
    billing_branch_id;
    warehouse_id;
    created_from;
    created_to;
}
exports.QueryPurchaseOrderHeaderExportDto = QueryPurchaseOrderHeaderExportDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryPurchaseOrderHeaderExportDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['Creada', 'Recibida', 'Cancelada']),
    __metadata("design:type", String)
], QueryPurchaseOrderHeaderExportDto.prototype, "general_status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['Pendiente', 'Pagado']),
    __metadata("design:type", String)
], QueryPurchaseOrderHeaderExportDto.prototype, "payment_status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryPurchaseOrderHeaderExportDto.prototype, "vendor_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryPurchaseOrderHeaderExportDto.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryPurchaseOrderHeaderExportDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryPurchaseOrderHeaderExportDto.prototype, "warehouse_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryPurchaseOrderHeaderExportDto.prototype, "created_from", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryPurchaseOrderHeaderExportDto.prototype, "created_to", void 0);
class QueryPurchaseOrderDetailExportDto extends QueryPurchaseOrderHeaderExportDto {
}
exports.QueryPurchaseOrderDetailExportDto = QueryPurchaseOrderDetailExportDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-06-01' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryPurchaseOrderDetailExportDto.prototype, "created_from", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-06-30' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryPurchaseOrderDetailExportDto.prototype, "created_to", void 0);
//# sourceMappingURL=query-purchase-order-export.dto.js.map