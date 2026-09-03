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
exports.CreateFiscalConfigurationDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class CreateFiscalConfigurationDto {
    razon_social;
    rfc;
    persona_type;
    prefix;
    fiscal_regime;
    digital_seal;
    digital_seal_password;
    private_key;
    logo;
    status;
}
exports.CreateFiscalConfigurationDto = CreateFiscalConfigurationDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFiscalConfigurationDto.prototype, "razon_social", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, {
        message: 'El RFC no tiene un formato válido (3-4 letras + 6 dígitos + 3 alfanuméricos)',
    }),
    __metadata("design:type", String)
], CreateFiscalConfigurationDto.prototype, "rfc", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFiscalConfigurationDto.prototype, "persona_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Prefijo para lotes de recepción (ej. MZN). Letras/números, máx. 10, sin guiones',
        example: 'MZN',
        maxLength: 10,
        nullable: true,
    }),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === undefined) {
            return undefined;
        }
        if (value === null || value === '') {
            return null;
        }
        return String(value);
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, value) => value !== null && value !== undefined),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10),
    __metadata("design:type", Object)
], CreateFiscalConfigurationDto.prototype, "prefix", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFiscalConfigurationDto.prototype, "fiscal_regime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFiscalConfigurationDto.prototype, "digital_seal", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFiscalConfigurationDto.prototype, "digital_seal_password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFiscalConfigurationDto.prototype, "private_key", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFiscalConfigurationDto.prototype, "logo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFiscalConfigurationDto.prototype, "status", void 0);
//# sourceMappingURL=create-fiscal-configuration.dto.js.map