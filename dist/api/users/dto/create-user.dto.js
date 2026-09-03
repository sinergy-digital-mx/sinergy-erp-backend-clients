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
exports.CreateUserDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const pos_user_type_enum_1 = require("../../../entities/users/pos-user-type.enum");
const employee_profile_dto_1 = require("../../employees/dto/employee-profile.dto");
class CreateUserDto {
    status_id;
    email;
    password;
    first_name;
    last_name;
    phone;
    language_code;
    billing_branch_id;
    billing_branch_ids;
    primary_billing_branch_id;
    is_pos_user;
    pos_user_code;
    pos_user_type;
    is_employee;
    is_manager;
    employee;
    warehouse_ids;
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User status ID', example: 1 }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateUserDto.prototype, "status_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User email', example: 'user@example.com' }),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User password' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "first_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "last_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "language_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        nullable: true,
        description: 'Sucursal activa / principal. Si no envías billing_branch_ids, se trata como asignación única. null = acceso a todas (solo no POS).',
    }),
    (0, class_validator_1.ValidateIf)((_, value) => value !== null),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], CreateUserDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        type: [String],
        description: 'Sucursales asignadas. Vacío o omitido con billing_branch_id null = acceso a todas (solo no POS). POS requiere al menos una.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CreateUserDto.prototype, "billing_branch_ids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        nullable: true,
        description: 'Sucursal principal. Debe estar en billing_branch_ids.',
    }),
    (0, class_validator_1.ValidateIf)((_, value) => value !== null),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], CreateUserDto.prototype, "primary_billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Indica si el usuario opera en POS',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateUserDto.prototype, "is_pos_user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Código numérico que se ingresa en el POS al vender. Aplica a vendedores y a terminales (p. ej. gerentes).',
        example: 33456,
    }),
    (0, class_validator_1.ValidateIf)((dto) => dto.pos_user_code != null),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateUserDto.prototype, "pos_user_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        enum: pos_user_type_enum_1.PosUserType,
        description: 'Tipo de terminal POS. Obligatorio si is_pos_user es true. AMBOS solo si es gerente.',
    }),
    (0, class_validator_1.ValidateIf)((dto) => dto.is_pos_user === true),
    (0, class_validator_1.IsEnum)(pos_user_type_enum_1.PosUserType),
    __metadata("design:type", String)
], CreateUserDto.prototype, "pos_user_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Indica si el usuario es empleado (tab "Empleado" del modal)',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateUserDto.prototype, "is_employee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Indica si el usuario es gerente (tab "Gerente" del modal)',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateUserDto.prototype, "is_manager", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        type: employee_profile_dto_1.EmployeeProfileDto,
        description: 'Datos de RH/nómina. Requerido cuando is_employee es true.',
    }),
    (0, class_validator_1.ValidateIf)((dto) => dto.is_employee === true),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => employee_profile_dto_1.EmployeeProfileDto),
    __metadata("design:type", employee_profile_dto_1.EmployeeProfileDto)
], CreateUserDto.prototype, "employee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        type: [String],
        description: 'Almacenes de Mesa de Control asignados al usuario',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CreateUserDto.prototype, "warehouse_ids", void 0);
//# sourceMappingURL=create-user.dto.js.map