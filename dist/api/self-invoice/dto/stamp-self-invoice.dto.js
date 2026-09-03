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
exports.StampSelfInvoiceDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class StampSelfInvoiceDto {
    email;
    phone;
    fiscal_rfc;
    fiscal_razon_social;
    fiscal_person_type;
    fiscal_postal_code;
    fiscal_country;
    fiscal_street;
    fiscal_exterior_number;
    fiscal_interior_number;
    fiscal_colonia;
    fiscal_localidad;
    fiscal_municipio;
    fiscal_state;
    uso_cfdi;
    regimen_fiscal_receptor;
    forma_pago;
    metodo_pago;
}
exports.StampSelfInvoiceDto = StampSelfInvoiceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ana@empresa.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], StampSelfInvoiceDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '6641234567' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], StampSelfInvoiceDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SSS2410213X9' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i, {
        message: 'El RFC no tiene un formato válido',
    }),
    __metadata("design:type", String)
], StampSelfInvoiceDto.prototype, "fiscal_rfc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SINERGY SW SOLUTIONS' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], StampSelfInvoiceDto.prototype, "fiscal_razon_social", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['fisica', 'moral', 'otro'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['fisica', 'moral', 'otro']),
    __metadata("design:type", String)
], StampSelfInvoiceDto.prototype, "fiscal_person_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '22040' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{5}$/, { message: 'El código postal debe ser de 5 dígitos' }),
    __metadata("design:type", String)
], StampSelfInvoiceDto.prototype, "fiscal_postal_code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'MEX' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[A-Z]{3}$/i, { message: 'El país debe ser clave SAT de 3 letras' }),
    __metadata("design:type", String)
], StampSelfInvoiceDto.prototype, "fiscal_country", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], StampSelfInvoiceDto.prototype, "fiscal_street", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], StampSelfInvoiceDto.prototype, "fiscal_exterior_number", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], StampSelfInvoiceDto.prototype, "fiscal_interior_number", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], StampSelfInvoiceDto.prototype, "fiscal_colonia", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], StampSelfInvoiceDto.prototype, "fiscal_localidad", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], StampSelfInvoiceDto.prototype, "fiscal_municipio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], StampSelfInvoiceDto.prototype, "fiscal_state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'G03' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[A-Z0-9]{3,4}$/i),
    __metadata("design:type", String)
], StampSelfInvoiceDto.prototype, "uso_cfdi", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '601' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{3}$/),
    __metadata("design:type", String)
], StampSelfInvoiceDto.prototype, "regimen_fiscal_receptor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '01' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{2}$/),
    __metadata("design:type", String)
], StampSelfInvoiceDto.prototype, "forma_pago", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'PUE' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['PUE', 'PPD']),
    __metadata("design:type", String)
], StampSelfInvoiceDto.prototype, "metodo_pago", void 0);
//# sourceMappingURL=stamp-self-invoice.dto.js.map