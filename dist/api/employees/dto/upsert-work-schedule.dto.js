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
exports.UpsertWorkScheduleDto = exports.WorkScheduleDayDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class WorkScheduleDayDto {
    weekday;
    is_workday;
    start_time;
    end_time;
}
exports.WorkScheduleDayDto = WorkScheduleDayDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Día ISO: 1 lunes … 7 domingo' }),
    (0, class_validator_1.IsInt)({ message: 'El día de la semana debe ser un número' }),
    (0, class_validator_1.Min)(1, { message: 'El día de la semana no es válido' }),
    (0, class_validator_1.Max)(7, { message: 'El día de la semana no es válido' }),
    __metadata("design:type", Number)
], WorkScheduleDayDto.prototype, "weekday", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'true si trabaja ese día' }),
    (0, class_validator_1.IsBoolean)({ message: 'Indica si el día es laboral' }),
    __metadata("design:type", Boolean)
], WorkScheduleDayDto.prototype, "is_workday", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: '09:00' }),
    (0, class_validator_1.ValidateIf)((_, value) => value != null && value !== ''),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
        message: 'La hora de entrada debe ser HH:mm',
    }),
    __metadata("design:type", Object)
], WorkScheduleDayDto.prototype, "start_time", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: '18:00' }),
    (0, class_validator_1.ValidateIf)((_, value) => value != null && value !== ''),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
        message: 'La hora de salida debe ser HH:mm',
    }),
    __metadata("design:type", Object)
], WorkScheduleDayDto.prototype, "end_time", void 0);
class UpsertWorkScheduleDto {
    days;
    notes;
}
exports.UpsertWorkScheduleDto = UpsertWorkScheduleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [WorkScheduleDayDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'Envía los días del horario' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => WorkScheduleDayDto),
    __metadata("design:type", Array)
], UpsertWorkScheduleDto.prototype, "days", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, maxLength: 255 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Las notas deben ser texto' }),
    (0, class_validator_1.MaxLength)(255, { message: 'Las notas del horario admiten máximo 255 caracteres' }),
    __metadata("design:type", Object)
], UpsertWorkScheduleDto.prototype, "notes", void 0);
//# sourceMappingURL=upsert-work-schedule.dto.js.map