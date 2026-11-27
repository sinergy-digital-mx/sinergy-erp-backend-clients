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
exports.RegisterPosAbonoDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const pos_sale_payment_method_enum_1 = require("../../../entities/pos/pos-sale-payment-method.enum");
const ABONO_METHODS = [
    pos_sale_payment_method_enum_1.PosSalePaymentMethod.CASH,
    pos_sale_payment_method_enum_1.PosSalePaymentMethod.CARD,
    pos_sale_payment_method_enum_1.PosSalePaymentMethod.TRANSFER,
    pos_sale_payment_method_enum_1.PosSalePaymentMethod.CHECK,
];
class RegisterPosAbonoDto {
    amount;
    payment_date;
    payment_method;
    reference_number;
    billing_branch_id;
    collected_by_user_id;
}
exports.RegisterPosAbonoDto = RegisterPosAbonoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 500 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], RegisterPosAbonoDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-11-24' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], RegisterPosAbonoDto.prototype, "payment_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ABONO_METHODS, example: pos_sale_payment_method_enum_1.PosSalePaymentMethod.CASH }),
    (0, class_validator_1.IsIn)(ABONO_METHODS),
    __metadata("design:type", Object)
], RegisterPosAbonoDto.prototype, "payment_method", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Obligatoria en transferencia y cheque' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], RegisterPosAbonoDto.prototype, "reference_number", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterPosAbonoDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Persona que cobra el abono, ya validada con su código. Si no se envía, queda la terminal de caja.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RegisterPosAbonoDto.prototype, "collected_by_user_id", void 0);
//# sourceMappingURL=register-pos-abono.dto.js.map