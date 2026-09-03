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
exports.QueryDailyShiftDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const pos_daily_shift_status_enum_1 = require("../../../entities/pos/pos-daily-shift-status.enum");
class QueryDailyShiftDto {
    terminal_user_id;
    billing_branch_id;
    shift_date;
    status;
}
exports.QueryDailyShiftDto = QueryDailyShiftDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryDailyShiftDto.prototype, "terminal_user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryDailyShiftDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryDailyShiftDto.prototype, "shift_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: pos_daily_shift_status_enum_1.PosDailyShiftStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(pos_daily_shift_status_enum_1.PosDailyShiftStatus),
    __metadata("design:type", String)
], QueryDailyShiftDto.prototype, "status", void 0);
//# sourceMappingURL=query-daily-shift.dto.js.map