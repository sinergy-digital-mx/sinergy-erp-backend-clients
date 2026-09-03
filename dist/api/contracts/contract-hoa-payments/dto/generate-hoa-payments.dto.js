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
exports.GenerateHoaPaymentsDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class GenerateHoaPaymentsDto {
    first_payment_date;
    payments_count;
    payment_day;
    start_date;
    end_date;
    monthly_amount;
    currency;
}
exports.GenerateHoaPaymentsDto = GenerateHoaPaymentsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GenerateHoaPaymentsDto.prototype, "first_payment_date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1, { message: 'La cantidad de pagos debe ser mayor a 0' }),
    __metadata("design:type", Number)
], GenerateHoaPaymentsDto.prototype, "payments_count", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1, { message: 'El día de pago debe estar entre 1 y 31' }),
    (0, class_validator_1.Max)(31, { message: 'El día de pago debe estar entre 1 y 31' }),
    __metadata("design:type", Number)
], GenerateHoaPaymentsDto.prototype, "payment_day", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GenerateHoaPaymentsDto.prototype, "start_date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GenerateHoaPaymentsDto.prototype, "end_date", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01, { message: 'El monto mensual debe ser mayor a 0' }),
    __metadata("design:type", Number)
], GenerateHoaPaymentsDto.prototype, "monthly_amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value),
    (0, class_validator_1.IsIn)(['USD', 'MXN']),
    __metadata("design:type", String)
], GenerateHoaPaymentsDto.prototype, "currency", void 0);
//# sourceMappingURL=generate-hoa-payments.dto.js.map