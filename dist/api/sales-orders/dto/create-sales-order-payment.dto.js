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
exports.CreateSalesOrderPaymentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const pos_sale_payment_method_enum_1 = require("../../../entities/pos/pos-sale-payment-method.enum");
class CreateSalesOrderPaymentDto {
    amount;
    payment_date;
    payment_method;
    currency = 'MXN';
    reference_number;
    notes;
}
exports.CreateSalesOrderPaymentDto = CreateSalesOrderPaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1500.5 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], CreateSalesOrderPaymentDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-07-03' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateSalesOrderPaymentDto.prototype, "payment_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: pos_sale_payment_method_enum_1.PosSalePaymentMethod, example: pos_sale_payment_method_enum_1.PosSalePaymentMethod.TRANSFER }),
    (0, class_validator_1.IsEnum)(pos_sale_payment_method_enum_1.PosSalePaymentMethod),
    __metadata("design:type", String)
], CreateSalesOrderPaymentDto.prototype, "payment_method", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['MXN', 'USD'], default: 'MXN' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['MXN', 'USD']),
    __metadata("design:type", String)
], CreateSalesOrderPaymentDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'SPEI-123456',
        description: 'Referencia (obligatoria si payment_method = transfer)',
    }),
    (0, class_validator_1.ValidateIf)((dto) => dto.payment_method === pos_sale_payment_method_enum_1.PosSalePaymentMethod.TRANSFER),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateSalesOrderPaymentDto.prototype, "reference_number", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSalesOrderPaymentDto.prototype, "notes", void 0);
//# sourceMappingURL=create-sales-order-payment.dto.js.map