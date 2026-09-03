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
exports.CreateEmailTemplateDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const email_template_variable_dto_1 = require("./email-template-variable.dto");
class CreateEmailTemplateDto {
    name;
    subject;
    bodyHtml;
    variables;
    customVariables;
    isActive;
}
exports.CreateEmailTemplateDto = CreateEmailTemplateDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Recordatorio de pago' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 150),
    __metadata("design:type", String)
], CreateEmailTemplateDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Recordatorio de pago pendiente' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], CreateEmailTemplateDto.prototype, "subject", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '<p>Hola {{customer.name}}, tienes un pago pendiente.</p>' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmailTemplateDto.prototype, "bodyHtml", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['customer.name', 'payment.amount_pending'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.Matches)(/^[a-zA-Z][a-zA-Z0-9_.-]*$/, { each: true }),
    __metadata("design:type", Array)
], CreateEmailTemplateDto.prototype, "variables", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [email_template_variable_dto_1.EmailTemplateCustomVariableDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => email_template_variable_dto_1.EmailTemplateCustomVariableDto),
    __metadata("design:type", Array)
], CreateEmailTemplateDto.prototype, "customVariables", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateEmailTemplateDto.prototype, "isActive", void 0);
//# sourceMappingURL=create-email-template.dto.js.map