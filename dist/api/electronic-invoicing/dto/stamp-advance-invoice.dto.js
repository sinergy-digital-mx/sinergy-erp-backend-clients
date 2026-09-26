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
exports.StampAdvanceInvoiceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class StampAdvanceInvoiceDto {
    base_amount;
    iva_percentage;
    uso_cfdi;
    forma_pago;
    metodo_pago;
    regimen_fiscal_receptor;
    series;
    folio;
    environment;
}
exports.StampAdvanceInvoiceDto = StampAdvanceInvoiceDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Base sin IVA. Si se omite, usa la base de la cotización u orden.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], StampAdvanceInvoiceDto.prototype, "base_amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'IVA del anticipo. 0, 8 o 16. Si se omite, se infiere del documento.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(16),
    __metadata("design:type", Number)
], StampAdvanceInvoiceDto.prototype, "iva_percentage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 'G01' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StampAdvanceInvoiceDto.prototype, "uso_cfdi", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: '03' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StampAdvanceInvoiceDto.prototype, "forma_pago", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['PUE', 'PPD'], default: 'PUE' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['PUE', 'PPD']),
    __metadata("design:type", String)
], StampAdvanceInvoiceDto.prototype, "metodo_pago", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '601' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StampAdvanceInvoiceDto.prototype, "regimen_fiscal_receptor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StampAdvanceInvoiceDto.prototype, "series", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StampAdvanceInvoiceDto.prototype, "folio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['demo', 'production'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['demo', 'production']),
    __metadata("design:type", String)
], StampAdvanceInvoiceDto.prototype, "environment", void 0);
//# sourceMappingURL=stamp-advance-invoice.dto.js.map