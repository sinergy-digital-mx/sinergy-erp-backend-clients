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
exports.CreateLeadDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const is_phone_decorator_1 = require("../../../common/decorators/is-phone.decorator");
class CreateLeadDto {
    tenant_id;
    status_id;
    name;
    lastname;
    email;
    phone;
    phone_country;
    phone_code;
    source;
    company_name;
    company_phone;
    website;
    group_id;
}
exports.CreateLeadDto = CreateLeadDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tenant ID', example: 1 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateLeadDto.prototype, "tenant_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Lead status ID', example: 1 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateLeadDto.prototype, "status_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Lead first name', example: 'John' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateLeadDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Lead last name', example: 'Doe' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateLeadDto.prototype, "lastname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Lead email address', example: 'john.doe@example.com' }),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateLeadDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Lead phone number in E.164 format. Must include country code. Examples: +1 2025551234 (USA), +52 6647945661 (Mexico), +44 2071838750 (UK)',
        example: '+52 6647945661'
    }),
    (0, is_phone_decorator_1.IsPhone)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateLeadDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Phone country', example: 'Mexico' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateLeadDto.prototype, "phone_country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Phone country code', example: '+52' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateLeadDto.prototype, "phone_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Lead source', example: 'Website', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateLeadDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Company name', example: 'Acme Corporation', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateLeadDto.prototype, "company_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Company phone number in E.164 format. Must include country code. Examples: +1 2025551234 (USA), +52 6647945661 (Mexico), +44 2071838750 (UK)',
        example: '+52 6647945661',
        required: false
    }),
    (0, is_phone_decorator_1.IsPhone)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateLeadDto.prototype, "company_phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Company website', example: 'https://example.com', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateLeadDto.prototype, "website", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Lead group ID', example: 'uuid-here', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateLeadDto.prototype, "group_id", void 0);
//# sourceMappingURL=create-lead.dto.js.map