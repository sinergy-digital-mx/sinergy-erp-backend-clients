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
exports.CreateLeaveRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const leave_type_enum_1 = require("../../../entities/employees/leave-type.enum");
class CreateLeaveRequestDto {
    type;
    start_date;
    end_date;
    reason;
    is_paid;
    days;
    count_weekends;
}
exports.CreateLeaveRequestDto = CreateLeaveRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: leave_type_enum_1.LeaveType, description: 'Tipo de solicitud' }),
    (0, class_validator_1.IsEnum)(leave_type_enum_1.LeaveType, {
        message: 'El tipo debe ser vacation, absence, permission o sick_leave',
    }),
    __metadata("design:type", String)
], CreateLeaveRequestDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Fecha de inicio (YYYY-MM-DD)' }),
    (0, class_validator_1.IsISO8601)({}, { message: 'La fecha de inicio debe tener formato YYYY-MM-DD' }),
    __metadata("design:type", String)
], CreateLeaveRequestDto.prototype, "start_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Fecha de fin (YYYY-MM-DD)' }),
    (0, class_validator_1.IsISO8601)({}, { message: 'La fecha de fin debe tener formato YYYY-MM-DD' }),
    __metadata("design:type", String)
], CreateLeaveRequestDto.prototype, "end_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Motivo / comentarios' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El motivo debe ser texto' }),
    (0, class_validator_1.MaxLength)(500, { message: 'El motivo no puede superar 500 caracteres' }),
    __metadata("design:type", String)
], CreateLeaveRequestDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Indica si la ausencia es con goce de sueldo (default true)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'is_paid debe ser verdadero o falso' }),
    __metadata("design:type", Boolean)
], CreateLeaveRequestDto.prototype, "is_paid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Días a descontar. Si se omite, vacaciones = hábiles (lun–vie) y el resto = naturales.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Los días deben ser un número' }),
    (0, class_validator_1.Min)(0.5, { message: 'Los días deben ser al menos 0.5' }),
    __metadata("design:type", Number)
], CreateLeaveRequestDto.prototype, "days", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Si es true, cuenta sábados y domingo. Default false en vacation, true en los demás tipos.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'count_weekends debe ser verdadero o falso' }),
    __metadata("design:type", Boolean)
], CreateLeaveRequestDto.prototype, "count_weekends", void 0);
//# sourceMappingURL=create-leave-request.dto.js.map