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
exports.StampSalesOrderCreditNoteDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class StampSalesOrderCreditNoteDto {
    amount;
    reason;
    uso_cfdi;
    environment;
}
exports.StampSalesOrderCreditNoteDto = StampSalesOrderCreditNoteDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total de la nota, con IVA. No puede pasar el disponible de la factura.',
        example: 200,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], StampSalesOrderCreditNoteDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Motivo. Queda como descripción del concepto.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(250),
    __metadata("design:type", String)
], StampSalesOrderCreditNoteDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 'G02', description: 'Uso CFDI. G02 es devoluciones, descuentos o bonificaciones.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StampSalesOrderCreditNoteDto.prototype, "uso_cfdi", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['demo', 'production'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['demo', 'production']),
    __metadata("design:type", String)
], StampSalesOrderCreditNoteDto.prototype, "environment", void 0);
//# sourceMappingURL=stamp-sales-order-credit-note.dto.js.map