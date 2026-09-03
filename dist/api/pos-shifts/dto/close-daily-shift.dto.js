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
exports.CloseDailyShiftDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const create_partial_shift_dto_1 = require("./create-partial-shift.dto");
class CloseDailyShiftDto {
    closing_cash_mxn;
    closing_cash_usd;
    denominations;
    notes;
}
exports.CloseDailyShiftDto = CloseDailyShiftDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 605.59,
        description: 'Efectivo MXN contado en caja al cerrar',
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CloseDailyShiftDto.prototype, "closing_cash_mxn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CloseDailyShiftDto.prototype, "closing_cash_usd", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        type: [create_partial_shift_dto_1.PartialShiftDenominationDto],
        description: 'Desglose de billetes, monedas y centavos contados en caja (opcional)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => create_partial_shift_dto_1.PartialShiftDenominationDto),
    __metadata("design:type", Array)
], CloseDailyShiftDto.prototype, "denominations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CloseDailyShiftDto.prototype, "notes", void 0);
//# sourceMappingURL=close-daily-shift.dto.js.map