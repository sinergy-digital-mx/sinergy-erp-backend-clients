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
exports.SendQuotationToCajaDto = void 0;
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const create_quotation_dto_1 = require("../../quotations/dto/create-quotation.dto");
class SendQuotationToCajaDto {
    line_items;
    customer_id;
    warehouse_id;
    global_discount_id;
    notes;
    advance_amount;
    advance_uso_cfdi;
    advance_metodo_pago;
}
exports.SendQuotationToCajaDto = SendQuotationToCajaDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Si viene, reemplaza los productos de la cotización antes de reenviar.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'La cotización debe tener al menos un producto' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => create_quotation_dto_1.CreateQuotationLineItemDto),
    __metadata("design:type", Array)
], SendQuotationToCajaDto.prototype, "line_items", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SendQuotationToCajaDto.prototype, "customer_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SendQuotationToCajaDto.prototype, "warehouse_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SendQuotationToCajaDto.prototype, "global_discount_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], SendQuotationToCajaDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Anticipo con IVA a cobrar. Si se omite, se conserva el monto regresado.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], SendQuotationToCajaDto.prototype, "advance_amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(4),
    __metadata("design:type", String)
], SendQuotationToCajaDto.prototype, "advance_uso_cfdi", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['PUE', 'PPD']),
    __metadata("design:type", String)
], SendQuotationToCajaDto.prototype, "advance_metodo_pago", void 0);
//# sourceMappingURL=send-quotation-to-caja.dto.js.map