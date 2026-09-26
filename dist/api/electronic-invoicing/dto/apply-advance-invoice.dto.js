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
exports.ApplyAdvanceInvoiceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class ApplyAdvanceInvoiceDto {
    uso_cfdi;
    uso_cfdi_aplicacion;
    forma_pago;
    metodo_pago;
    regimen_fiscal_receptor;
    series;
    environment;
}
exports.ApplyAdvanceInvoiceDto = ApplyAdvanceInvoiceDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 'G01', description: 'Uso CFDI de la factura de mercancía.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApplyAdvanceInvoiceDto.prototype, "uso_cfdi", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        default: 'G02',
        description: 'Uso CFDI de la nota de crédito que aplica el anticipo.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApplyAdvanceInvoiceDto.prototype, "uso_cfdi_aplicacion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: '03' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApplyAdvanceInvoiceDto.prototype, "forma_pago", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['PUE', 'PPD'], default: 'PUE' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['PUE', 'PPD']),
    __metadata("design:type", String)
], ApplyAdvanceInvoiceDto.prototype, "metodo_pago", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '601' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApplyAdvanceInvoiceDto.prototype, "regimen_fiscal_receptor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApplyAdvanceInvoiceDto.prototype, "series", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['demo', 'production'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['demo', 'production']),
    __metadata("design:type", String)
], ApplyAdvanceInvoiceDto.prototype, "environment", void 0);
//# sourceMappingURL=apply-advance-invoice.dto.js.map