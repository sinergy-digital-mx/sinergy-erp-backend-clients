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
exports.CreatePosConfigurationDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class CreatePosConfigurationDto {
    code;
    type;
    sucursal;
    modelo;
    status;
}
exports.CreatePosConfigurationDto = CreatePosConfigurationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Equipment code identifier',
        example: 'Computadora 1',
        maxLength: 255
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreatePosConfigurationDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Equipment type',
        example: 'VENTAS',
        enum: ['VENTAS', 'COBRANZA'],
    }),
    (0, class_transformer_1.Transform)(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value)),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['VENTAS', 'COBRANZA']),
    __metadata("design:type", String)
], CreatePosConfigurationDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Branch UUID where equipment is located',
        example: '550e8400-e29b-41d4-a716-446655440000'
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreatePosConfigurationDto.prototype, "sucursal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Equipment model specification',
        example: 'Dell OptiPlex 7090',
        required: false,
        maxLength: 255
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreatePosConfigurationDto.prototype, "modelo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Configuration status: 1 = active, 0 = inactive',
        example: 1,
        enum: [0, 1],
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)([0, 1]),
    __metadata("design:type", Number)
], CreatePosConfigurationDto.prototype, "status", void 0);
//# sourceMappingURL=create-pos-configuration.dto.js.map