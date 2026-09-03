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
exports.ReviewLeaveRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const leave_status_enum_1 = require("../../../entities/employees/leave-status.enum");
class ReviewLeaveRequestDto {
    status;
    review_notes;
}
exports.ReviewLeaveRequestDto = ReviewLeaveRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: [leave_status_enum_1.LeaveStatus.APPROVED, leave_status_enum_1.LeaveStatus.REJECTED],
        description: 'Resolución de la solicitud',
    }),
    (0, class_validator_1.IsEnum)(leave_status_enum_1.LeaveStatus, {
        message: 'El estatus debe ser approved o rejected',
    }),
    __metadata("design:type", String)
], ReviewLeaveRequestDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Notas de la resolución' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Las notas de revisión deben ser texto' }),
    (0, class_validator_1.MaxLength)(500, {
        message: 'Las notas de revisión no pueden superar 500 caracteres',
    }),
    __metadata("design:type", String)
], ReviewLeaveRequestDto.prototype, "review_notes", void 0);
//# sourceMappingURL=review-leave-request.dto.js.map