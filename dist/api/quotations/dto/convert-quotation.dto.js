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
exports.ConvertQuotationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class ConvertQuotationDto {
    customer_id;
    notes;
    send_to_pos_caja;
}
exports.ConvertQuotationDto = ConvertQuotationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Cliente de la OV. Si se omite se usa el de la cotización. Útil para cambiar el mostrador POS por un cliente real al convertir.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ConvertQuotationDto.prototype, "customer_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Notas extra que se concatenan a las de la cotización en la OV.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], ConvertQuotationDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Si true, la OV va a caja POS de la sucursal de la cotización. Si false, queda MANUAL. Si se omite, POS solo cuando la cotización era POS.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === true || value === 'true')
            return true;
        if (value === false || value === 'false')
            return false;
        return undefined;
    }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConvertQuotationDto.prototype, "send_to_pos_caja", void 0);
//# sourceMappingURL=convert-quotation.dto.js.map