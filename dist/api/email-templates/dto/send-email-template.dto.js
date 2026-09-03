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
exports.SendEmailTemplateDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const render_email_template_dto_1 = require("./render-email-template.dto");
class SendEmailTemplateDto {
    context;
    variables;
    toEmail;
    cc;
    bcc;
    note;
}
exports.SendEmailTemplateDto = SendEmailTemplateDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: {
            entity: 'payment',
            id: 'payment-id-123',
        },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => render_email_template_dto_1.RenderEmailTemplateContextDto),
    __metadata("design:type", render_email_template_dto_1.RenderEmailTemplateContextDto)
], SendEmailTemplateDto.prototype, "context", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: {
            customer: { name: 'Maria Lopez', email: 'maria@example.com' },
            payment: { amount_pending: '$1,250.00' },
        },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SendEmailTemplateDto.prototype, "variables", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'cliente@example.com' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SendEmailTemplateDto.prototype, "toEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['admin@example.com'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEmail)({}, { each: true }),
    __metadata("design:type", Array)
], SendEmailTemplateDto.prototype, "cc", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['auditoria@example.com'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEmail)({}, { each: true }),
    __metadata("design:type", Array)
], SendEmailTemplateDto.prototype, "bcc", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Mensaje opcional para auditoria interna' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendEmailTemplateDto.prototype, "note", void 0);
//# sourceMappingURL=send-email-template.dto.js.map