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
exports.AssignUserBranchDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AssignUserBranchDto {
    billing_branch_id;
    billing_branch_ids;
    primary_billing_branch_id;
}
exports.AssignUserBranchDto = AssignUserBranchDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        nullable: true,
        description: 'Sucursal activa / principal. Compatibilidad: si no envías billing_branch_ids, asigna solo esta. null = acceso a todas (solo no POS).',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.ValidateIf)((_, value) => value !== null),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], AssignUserBranchDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        type: [String],
        description: 'Sucursales asignadas. Vacío = acceso a todas (solo no POS).',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], AssignUserBranchDto.prototype, "billing_branch_ids", void 0);
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
], AssignUserBranchDto.prototype, "primary_billing_branch_id", void 0);
//# sourceMappingURL=assign-user-branch.dto.js.map