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
exports.QueryWhatsappMessagesDto = exports.WhatsappPairingCodeDto = exports.SendWhatsappFileDto = exports.SendWhatsappTextDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const whatsapp_constants_1 = require("../whatsapp.constants");
class SendWhatsappBaseDto {
    phone;
    reference_type;
    reference_id;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(32),
    __metadata("design:type", String)
], SendWhatsappBaseDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], SendWhatsappBaseDto.prototype, "reference_type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(36),
    __metadata("design:type", String)
], SendWhatsappBaseDto.prototype, "reference_id", void 0);
class SendWhatsappTextDto extends SendWhatsappBaseDto {
    text;
}
exports.SendWhatsappTextDto = SendWhatsappTextDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(whatsapp_constants_1.WHATSAPP_TEXT_MAX_LENGTH),
    __metadata("design:type", String)
], SendWhatsappTextDto.prototype, "text", void 0);
class SendWhatsappFileDto extends SendWhatsappBaseDto {
    file_url;
    file_name;
    mimetype;
    caption;
}
exports.SendWhatsappFileDto = SendWhatsappFileDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(2048),
    __metadata("design:type", String)
], SendWhatsappFileDto.prototype, "file_url", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], SendWhatsappFileDto.prototype, "file_name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    (0, class_validator_1.Matches)(/^[\w.+-]+\/[\w.+-]+$/, { message: 'mimetype inválido' }),
    __metadata("design:type", String)
], SendWhatsappFileDto.prototype, "mimetype", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(whatsapp_constants_1.WHATSAPP_TEXT_MAX_LENGTH),
    __metadata("design:type", String)
], SendWhatsappFileDto.prototype, "caption", void 0);
class WhatsappPairingCodeDto {
    phone;
}
exports.WhatsappPairingCodeDto = WhatsappPairingCodeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(32),
    __metadata("design:type", String)
], WhatsappPairingCodeDto.prototype, "phone", void 0);
class QueryWhatsappMessagesDto {
    page = 1;
    limit = 20;
    status;
    phone;
    reference_type;
    reference_id;
}
exports.QueryWhatsappMessagesDto = QueryWhatsappMessagesDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryWhatsappMessagesDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], QueryWhatsappMessagesDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['queued', 'sending', 'sent', 'delivered', 'read', 'failed']),
    __metadata("design:type", String)
], QueryWhatsappMessagesDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(32),
    __metadata("design:type", String)
], QueryWhatsappMessagesDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], QueryWhatsappMessagesDto.prototype, "reference_type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(36),
    __metadata("design:type", String)
], QueryWhatsappMessagesDto.prototype, "reference_id", void 0);
//# sourceMappingURL=whatsapp.dto.js.map