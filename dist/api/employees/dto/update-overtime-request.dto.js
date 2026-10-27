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
exports.UpdateOvertimeRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
class UpdateOvertimeRequestDto {
    work_date;
    start_time;
    end_time;
    reason;
    notes;
}
exports.UpdateOvertimeRequestDto = UpdateOvertimeRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'La fecha debe tener formato YYYY-MM-DD',
    }),
    __metadata("design:type", String)
], UpdateOvertimeRequestDto.prototype, "work_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: '18:00' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(CLOCK, { message: 'La hora de inicio debe tener formato HH:mm' }),
    __metadata("design:type", String)
], UpdateOvertimeRequestDto.prototype, "start_time", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: '21:00' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(CLOCK, { message: 'La hora de término debe tener formato HH:mm' }),
    __metadata("design:type", String)
], UpdateOvertimeRequestDto.prototype, "end_time", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El motivo debe ser texto' }),
    (0, class_validator_1.MaxLength)(500, { message: 'El motivo no puede superar 500 caracteres' }),
    __metadata("design:type", String)
], UpdateOvertimeRequestDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Las observaciones deben ser texto' }),
    (0, class_validator_1.MaxLength)(500, {
        message: 'Las observaciones no pueden superar 500 caracteres',
    }),
    __metadata("design:type", Object)
], UpdateOvertimeRequestDto.prototype, "notes", void 0);
//# sourceMappingURL=update-overtime-request.dto.js.map