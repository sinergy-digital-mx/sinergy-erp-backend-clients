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
exports.UpsertOvertimePolicyDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class UpsertOvertimePolicyDto {
    workday_hours;
    daily_double_hours;
    weekly_double_hours;
    double_multiplier;
    excess_multiplier;
}
exports.UpsertOvertimePolicyDto = UpsertOvertimePolicyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Horas de la jornada ordinaria. Tarifa = salario diario / jornada.' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'Las horas de jornada deben ser un número' }),
    (0, class_validator_1.Min)(1, { message: 'La jornada debe ser de al menos 1 hora' }),
    (0, class_validator_1.Max)(24, { message: 'La jornada no puede superar 24 horas' }),
    __metadata("design:type", Number)
], UpsertOvertimePolicyDto.prototype, "workday_hours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Primeras horas del día que se pagan al doble' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'El tope diario debe ser un número' }),
    (0, class_validator_1.Min)(0, { message: 'El tope diario no puede ser negativo' }),
    (0, class_validator_1.Max)(24, { message: 'El tope diario no puede superar 24 horas' }),
    __metadata("design:type", Number)
], UpsertOvertimePolicyDto.prototype, "daily_double_hours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Primeras horas de la semana que se pagan al doble' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'El tope semanal debe ser un número' }),
    (0, class_validator_1.Min)(0, { message: 'El tope semanal no puede ser negativo' }),
    (0, class_validator_1.Max)(168, { message: 'El tope semanal no puede superar 168 horas' }),
    __metadata("design:type", Number)
], UpsertOvertimePolicyDto.prototype, "weekly_double_hours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Multiplicador de las horas dentro del tope. 2 = doble.' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'El multiplicador doble debe ser un número' }),
    (0, class_validator_1.Min)(1, { message: 'El multiplicador doble debe ser al menos 1' }),
    (0, class_validator_1.Max)(10, { message: 'El multiplicador doble no puede superar 10' }),
    __metadata("design:type", Number)
], UpsertOvertimePolicyDto.prototype, "double_multiplier", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Multiplicador del excedente. 3 = triple.' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'El multiplicador del excedente debe ser un número' }),
    (0, class_validator_1.Min)(1, { message: 'El multiplicador del excedente debe ser al menos 1' }),
    (0, class_validator_1.Max)(10, { message: 'El multiplicador del excedente no puede superar 10' }),
    __metadata("design:type", Number)
], UpsertOvertimePolicyDto.prototype, "excess_multiplier", void 0);
//# sourceMappingURL=upsert-overtime-policy.dto.js.map