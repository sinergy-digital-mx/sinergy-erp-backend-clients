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
exports.GenerateDownpaymentPaymentsDto = exports.DownpaymentInitialPaymentDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class DownpaymentInitialPaymentDto {
    amount;
    due_date;
}
exports.DownpaymentInitialPaymentDto = DownpaymentInitialPaymentDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01, { message: 'El monto del pago inicial debe ser mayor a 0' }),
    __metadata("design:type", Number)
], DownpaymentInitialPaymentDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], DownpaymentInitialPaymentDto.prototype, "due_date", void 0);
class GenerateDownpaymentPaymentsDto {
    down_payment_target;
    down_payment_months;
    first_payment_date;
    payment_day;
    initial_payments;
}
exports.GenerateDownpaymentPaymentsDto = GenerateDownpaymentPaymentsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01, { message: 'El enganche objetivo debe ser mayor a 0' }),
    __metadata("design:type", Number)
], GenerateDownpaymentPaymentsDto.prototype, "down_payment_target", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1, { message: 'Los meses de enganche deben ser al menos 1' }),
    __metadata("design:type", Number)
], GenerateDownpaymentPaymentsDto.prototype, "down_payment_months", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GenerateDownpaymentPaymentsDto.prototype, "first_payment_date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(31),
    __metadata("design:type", Number)
], GenerateDownpaymentPaymentsDto.prototype, "payment_day", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => DownpaymentInitialPaymentDto),
    __metadata("design:type", Array)
], GenerateDownpaymentPaymentsDto.prototype, "initial_payments", void 0);
//# sourceMappingURL=generate-downpayment-payments.dto.js.map