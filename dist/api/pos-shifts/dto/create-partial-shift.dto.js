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
exports.CreatePartialShiftDto = exports.PartialShiftDenominationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class PartialShiftDenominationDto {
    currency;
    denomination;
    bill_count;
}
exports.PartialShiftDenominationDto = PartialShiftDenominationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['MXN', 'USD'] }),
    (0, class_validator_1.IsEnum)(['MXN', 'USD']),
    __metadata("design:type", String)
], PartialShiftDenominationDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 50, description: 'Valor de la pieza, incluyendo centavos (0.50, 0.20, 0.10, 0.05, 0.01)' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], PartialShiftDenominationDto.prototype, "denomination", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PartialShiftDenominationDto.prototype, "bill_count", void 0);
class CreatePartialShiftDto {
    denominations;
    notes;
    performed_by_user_id;
}
exports.CreatePartialShiftDto = CreatePartialShiftDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PartialShiftDenominationDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PartialShiftDenominationDto),
    __metadata("design:type", Array)
], CreatePartialShiftDto.prototype, "denominations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePartialShiftDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Vendedor que realiza el corte parcial (si no se envía, usa el terminal)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePartialShiftDto.prototype, "performed_by_user_id", void 0);
//# sourceMappingURL=create-partial-shift.dto.js.map