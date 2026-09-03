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
exports.UpdateLeaveRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateLeaveRequestDto {
    start_date;
    end_date;
    days;
    count_weekends;
    reason;
    is_paid;
}
exports.UpdateLeaveRequestDto = UpdateLeaveRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Fecha de inicio (YYYY-MM-DD)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)({}, { message: 'La fecha de inicio debe tener formato YYYY-MM-DD' }),
    __metadata("design:type", String)
], UpdateLeaveRequestDto.prototype, "start_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Fecha de fin (YYYY-MM-DD)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)({}, { message: 'La fecha de fin debe tener formato YYYY-MM-DD' }),
    __metadata("design:type", String)
], UpdateLeaveRequestDto.prototype, "end_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Días a descontar. Si se omite y cambian fechas, se recalcula.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Los días deben ser un número' }),
    (0, class_validator_1.Min)(0.5, { message: 'Los días deben ser al menos 0.5' }),
    __metadata("design:type", Number)
], UpdateLeaveRequestDto.prototype, "days", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Si es true, el recálculo incluye sábados y domingo.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'count_weekends debe ser verdadero o falso' }),
    __metadata("design:type", Boolean)
], UpdateLeaveRequestDto.prototype, "count_weekends", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Motivo / comentarios' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El motivo debe ser texto' }),
    (0, class_validator_1.MaxLength)(500, { message: 'El motivo no puede superar 500 caracteres' }),
    __metadata("design:type", String)
], UpdateLeaveRequestDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'is_paid debe ser verdadero o falso' }),
    __metadata("design:type", Boolean)
], UpdateLeaveRequestDto.prototype, "is_paid", void 0);
//# sourceMappingURL=update-leave-request.dto.js.map