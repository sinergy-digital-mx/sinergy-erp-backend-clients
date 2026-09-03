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
exports.ResendMailerConfigurationPayloadDto = exports.CreateMailerConfigurationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const mailer_vendor_enum_1 = require("../enums/mailer-vendor.enum");
class CreateMailerConfigurationDto {
    name;
    vendor = mailer_vendor_enum_1.MailerVendor.RESEND;
    vendorConfig;
    apiKey;
    isActive;
    isFallback;
}
exports.CreateMailerConfigurationDto = CreateMailerConfigurationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Resend Produccion' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMailerConfigurationDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: mailer_vendor_enum_1.MailerVendor, example: mailer_vendor_enum_1.MailerVendor.RESEND }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(mailer_vendor_enum_1.MailerVendor),
    __metadata("design:type", String)
], CreateMailerConfigurationDto.prototype, "vendor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: {
            apiKey: 're_xxxxxxxxxxxxxxxxx',
            fromEmail: 'noreply@tu-dominio.com',
            fromName: 'Synergy ERP',
            replyTo: 'soporte@tu-dominio.com',
        },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateMailerConfigurationDto.prototype, "vendorConfig", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 're_xxxxxxxxxxxxxxxxx', description: 'Legacy shortcut for Resend api key' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMailerConfigurationDto.prototype, "apiKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateMailerConfigurationDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateMailerConfigurationDto.prototype, "isFallback", void 0);
class ResendMailerConfigurationPayloadDto {
    apiKey;
    fromEmail;
    fromName;
    replyTo;
}
exports.ResendMailerConfigurationPayloadDto = ResendMailerConfigurationPayloadDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 're_xxxxxxxxxxxxxxxxx' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResendMailerConfigurationPayloadDto.prototype, "apiKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'noreply@tu-dominio.com' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResendMailerConfigurationPayloadDto.prototype, "fromEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Synergy ERP' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResendMailerConfigurationPayloadDto.prototype, "fromName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'soporte@tu-dominio.com' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResendMailerConfigurationPayloadDto.prototype, "replyTo", void 0);
//# sourceMappingURL=create-mailer-configuration.dto.js.map