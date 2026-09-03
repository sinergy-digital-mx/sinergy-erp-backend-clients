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
exports.UpsertCustomerCreditsDto = exports.UpsertCustomerCreditItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class UpsertCustomerCreditItemDto {
    fiscal_configuration_id;
    credit_enabled;
    credit_days;
    credit_amount;
}
exports.UpsertCustomerCreditItemDto = UpsertCustomerCreditItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Razón social (fiscal_configuration_id)' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpsertCustomerCreditItemDto.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpsertCustomerCreditItemDto.prototype, "credit_enabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 30 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Object)
], UpsertCustomerCreditItemDto.prototype, "credit_days", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 15000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Object)
], UpsertCustomerCreditItemDto.prototype, "credit_amount", void 0);
class UpsertCustomerCreditsDto {
    credits;
}
exports.UpsertCustomerCreditsDto = UpsertCustomerCreditsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [UpsertCustomerCreditItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UpsertCustomerCreditItemDto),
    __metadata("design:type", Array)
], UpsertCustomerCreditsDto.prototype, "credits", void 0);
//# sourceMappingURL=upsert-customer-credit.dto.js.map