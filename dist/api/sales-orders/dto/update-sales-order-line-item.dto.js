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
exports.UpdateSalesOrderLineItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateSalesOrderLineItemDto {
    quantity;
    product_uom_id;
    unit_price;
    discount_percentage;
    iva_percentage;
    ieps_percentage;
}
exports.UpdateSalesOrderLineItemDto = UpdateSalesOrderLineItemDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Cantidad en la UOM de la línea' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.001),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateSalesOrderLineItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID de product_uoms o de uom_catalog de la línea',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSalesOrderLineItemDto.prototype, "product_uom_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Precio unitario sin impuestos. Hasta 4 decimales.',
        example: 2.15,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateSalesOrderLineItemDto.prototype, "unit_price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Descuento % de línea (si no hay product_discount_id)' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateSalesOrderLineItemDto.prototype, "discount_percentage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateSalesOrderLineItemDto.prototype, "iva_percentage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateSalesOrderLineItemDto.prototype, "ieps_percentage", void 0);
//# sourceMappingURL=update-sales-order-line-item.dto.js.map