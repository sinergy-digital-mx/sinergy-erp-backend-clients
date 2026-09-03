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
exports.CollectPosSaleDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const pos_sale_payment_method_enum_1 = require("../../../entities/pos/pos-sale-payment-method.enum");
class CollectPosSaleDto {
    customer_id;
    payment_method;
    amount_cash_mxn;
    amount_cash_usd;
    usd_exchange_rate;
    amount_transfer_mxn;
    transfer_reference;
    amount_card_mxn;
    card_reference;
    amount_credit_mxn;
    generate_invoice;
    received_cash_mxn;
    received_cash_usd;
    notes;
}
exports.CollectPosSaleDto = CollectPosSaleDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Cliente al cobrar. Si no se envía, se mantiene el de la orden (p. ej. mostrador).',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value)),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CollectPosSaleDto.prototype, "customer_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: pos_sale_payment_method_enum_1.PosSalePaymentMethod,
        description: 'Método de pago aplicado en cobranza',
    }),
    (0, class_validator_1.IsEnum)(pos_sale_payment_method_enum_1.PosSalePaymentMethod),
    __metadata("design:type", String)
], CollectPosSaleDto.prototype, "payment_method", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Monto de la orden cubierto con efectivo MXN',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CollectPosSaleDto.prototype, "amount_cash_mxn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Monto en USD aplicado a la orden (se convierte con tipo de cambio)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CollectPosSaleDto.prototype, "amount_cash_usd", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Tipo de cambio USD→MXN. Obligatorio si amount_cash_usd > 0',
    }),
    (0, class_validator_1.ValidateIf)((dto) => (dto.amount_cash_usd ?? 0) > 0),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.0001),
    __metadata("design:type", Number)
], CollectPosSaleDto.prototype, "usd_exchange_rate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Monto cubierto con transferencia (MXN)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CollectPosSaleDto.prototype, "amount_transfer_mxn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Referencia de transferencia' }),
    (0, class_validator_1.ValidateIf)((dto) => (dto.amount_transfer_mxn ?? 0) > 0),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CollectPosSaleDto.prototype, "transfer_reference", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Monto cubierto con tarjeta (MXN)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CollectPosSaleDto.prototype, "amount_card_mxn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Referencia o últimos dígitos de tarjeta' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CollectPosSaleDto.prototype, "card_reference", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Monto cubierto a crédito (MXN). Si payment_method = credit y se omite, se usa el saldo pendiente.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CollectPosSaleDto.prototype, "amount_credit_mxn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Si true, pide timbrar factura al cobrar. Requiere datos fiscales completos del cliente.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CollectPosSaleDto.prototype, "generate_invoice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Efectivo MXN recibido del cliente (para calcular cambio)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CollectPosSaleDto.prototype, "received_cash_mxn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Efectivo USD recibido del cliente (para calcular cambio)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CollectPosSaleDto.prototype, "received_cash_usd", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CollectPosSaleDto.prototype, "notes", void 0);
//# sourceMappingURL=collect-pos-sale.dto.js.map