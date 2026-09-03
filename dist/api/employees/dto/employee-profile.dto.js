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
exports.EmployeeProfileDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const employee_status_enum_1 = require("../../../entities/employees/employee-status.enum");
const employee_payment_frequency_enum_1 = require("../../../entities/employees/employee-payment-frequency.enum");
function isEmpty(value) {
    return value === null || value === undefined || value === '';
}
class EmployeeProfileDto {
    employee_code;
    rfc;
    curp;
    nss;
    position;
    department;
    hire_date;
    birth_date;
    monthly_salary;
    payment_frequency;
    bank_name;
    clabe;
    bank_account;
    status;
    termination_date;
    vacation_carryover_days;
}
exports.EmployeeProfileDto = EmployeeProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Código interno de empleado' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El código de empleado debe ser texto' }),
    __metadata("design:type", String)
], EmployeeProfileDto.prototype, "employee_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'RFC (12 o 13 caracteres)' }),
    (0, class_validator_1.ValidateIf)((_, value) => !isEmpty(value)),
    (0, class_validator_1.IsString)({ message: 'El RFC debe ser texto' }),
    (0, class_validator_1.Length)(12, 13, { message: 'El RFC debe tener 12 o 13 caracteres' }),
    __metadata("design:type", String)
], EmployeeProfileDto.prototype, "rfc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'CURP (18 caracteres)' }),
    (0, class_validator_1.ValidateIf)((_, value) => !isEmpty(value)),
    (0, class_validator_1.IsString)({ message: 'El CURP debe ser texto' }),
    (0, class_validator_1.Length)(18, 18, { message: 'El CURP debe tener exactamente 18 caracteres' }),
    __metadata("design:type", String)
], EmployeeProfileDto.prototype, "curp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Número de Seguridad Social (IMSS)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El NSS debe ser texto' }),
    __metadata("design:type", String)
], EmployeeProfileDto.prototype, "nss", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Puesto' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El puesto debe ser texto' }),
    __metadata("design:type", String)
], EmployeeProfileDto.prototype, "position", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Área / departamento' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El departamento debe ser texto' }),
    __metadata("design:type", String)
], EmployeeProfileDto.prototype, "department", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Fecha de ingreso (YYYY-MM-DD). Base para antigüedad y vacaciones.',
    }),
    (0, class_validator_1.ValidateIf)((_, value) => !isEmpty(value)),
    (0, class_validator_1.IsISO8601)({}, { message: 'La fecha de ingreso debe tener formato YYYY-MM-DD' }),
    __metadata("design:type", String)
], EmployeeProfileDto.prototype, "hire_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Fecha de nacimiento (YYYY-MM-DD)' }),
    (0, class_validator_1.ValidateIf)((_, value) => !isEmpty(value)),
    (0, class_validator_1.IsISO8601)({}, { message: 'La fecha de nacimiento debe tener formato YYYY-MM-DD' }),
    __metadata("design:type", String)
], EmployeeProfileDto.prototype, "birth_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Sueldo mensual bruto' }),
    (0, class_validator_1.ValidateIf)((_, value) => value !== null && value !== undefined && value !== ''),
    (0, class_validator_1.IsNumber)({}, { message: 'El sueldo mensual debe ser un número' }),
    (0, class_validator_1.Min)(0, { message: 'El sueldo mensual no puede ser negativo' }),
    __metadata("design:type", Number)
], EmployeeProfileDto.prototype, "monthly_salary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        enum: employee_payment_frequency_enum_1.EmployeePaymentFrequency,
        description: 'Periodicidad de pago',
    }),
    (0, class_validator_1.ValidateIf)((_, value) => !isEmpty(value)),
    (0, class_validator_1.IsEnum)(employee_payment_frequency_enum_1.EmployeePaymentFrequency, {
        message: 'La frecuencia de pago debe ser monthly, biweekly o weekly',
    }),
    __metadata("design:type", String)
], EmployeeProfileDto.prototype, "payment_frequency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Banco' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El banco debe ser texto' }),
    __metadata("design:type", String)
], EmployeeProfileDto.prototype, "bank_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'CLABE interbancaria (18 dígitos)' }),
    (0, class_validator_1.ValidateIf)((_, value) => !isEmpty(value)),
    (0, class_validator_1.IsString)({ message: 'La CLABE debe ser texto' }),
    (0, class_validator_1.Matches)(/^\d{18}$/, { message: 'La CLABE debe tener exactamente 18 dígitos' }),
    __metadata("design:type", String)
], EmployeeProfileDto.prototype, "clabe", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Número de cuenta bancaria' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La cuenta bancaria debe ser texto' }),
    __metadata("design:type", String)
], EmployeeProfileDto.prototype, "bank_account", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: employee_status_enum_1.EmployeeStatus }),
    (0, class_validator_1.ValidateIf)((_, value) => !isEmpty(value)),
    (0, class_validator_1.IsEnum)(employee_status_enum_1.EmployeeStatus, {
        message: 'El estatus debe ser active, inactive o terminated',
    }),
    __metadata("design:type", String)
], EmployeeProfileDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Fecha de baja (YYYY-MM-DD)' }),
    (0, class_validator_1.ValidateIf)((_, value) => !isEmpty(value)),
    (0, class_validator_1.IsISO8601)({}, { message: 'La fecha de baja debe tener formato YYYY-MM-DD' }),
    __metadata("design:type", String)
], EmployeeProfileDto.prototype, "termination_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Días de vacaciones extra o no tomados el año anterior. RH los captura; no se calculan solos.',
    }),
    (0, class_validator_1.ValidateIf)((_, value) => value !== null && value !== undefined && value !== ''),
    (0, class_validator_1.IsNumber)({}, { message: 'Los días de arrastre deben ser un número' }),
    (0, class_validator_1.Min)(0, { message: 'Los días de arrastre no pueden ser negativos' }),
    __metadata("design:type", Number)
], EmployeeProfileDto.prototype, "vacation_carryover_days", void 0);
//# sourceMappingURL=employee-profile.dto.js.map