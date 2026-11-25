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
exports.StartAdvanceQuotationDto = void 0;
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class StartAdvanceQuotationDto {
    advance_amount;
    advance_case;
    advance_iva_percentage;
    advance_uso_cfdi;
    advance_metodo_pago;
}
exports.StartAdvanceQuotationDto = StartAdvanceQuotationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Monto del anticipo, con IVA.' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], StartAdvanceQuotationDto.prototype, "advance_amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['unknown', 'products'] }),
    (0, class_validator_1.IsIn)(['unknown', 'products']),
    __metadata("design:type", String)
], StartAdvanceQuotationDto.prototype, "advance_case", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'IVA cuando el caso es unknown: 0, 8 o 16.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsIn)([0, 8, 16]),
    __metadata("design:type", Number)
], StartAdvanceQuotationDto.prototype, "advance_iva_percentage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(4),
    __metadata("design:type", String)
], StartAdvanceQuotationDto.prototype, "advance_uso_cfdi", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['PUE', 'PPD'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['PUE', 'PPD']),
    __metadata("design:type", String)
], StartAdvanceQuotationDto.prototype, "advance_metodo_pago", void 0);
//# sourceMappingURL=start-advance-quotation.dto.js.map