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
exports.QueryLeadActivityDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const lead_activity_entity_1 = require("../../../entities/leads/lead-activity.entity");
class QueryLeadActivityDto {
    type;
    status;
    from_date;
    to_date;
    user_id;
    outcome;
    page = 1;
    limit = 10;
    sort_by = 'activity_date';
    sort_order = 'DESC';
}
exports.QueryLeadActivityDto = QueryLeadActivityDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by activity type',
        enum: lead_activity_entity_1.ActivityType,
        required: false
    }),
    (0, class_validator_1.IsEnum)(lead_activity_entity_1.ActivityType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryLeadActivityDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by activity status',
        enum: lead_activity_entity_1.ActivityStatus,
        required: false
    }),
    (0, class_validator_1.IsEnum)(lead_activity_entity_1.ActivityStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryLeadActivityDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter activities from this date',
        example: '2024-01-01T00:00:00Z',
        required: false
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryLeadActivityDto.prototype, "from_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter activities to this date',
        example: '2024-01-31T23:59:59Z',
        required: false
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryLeadActivityDto.prototype, "to_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by user who created the activity',
        example: 'user-uuid-here',
        required: false
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryLeadActivityDto.prototype, "user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by activity outcome',
        example: 'Interested',
        required: false
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryLeadActivityDto.prototype, "outcome", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Page number for pagination',
        example: 1,
        minimum: 1,
        required: false
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], QueryLeadActivityDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of items per page',
        example: 10,
        minimum: 1,
        required: false
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], QueryLeadActivityDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Field to sort by',
        example: 'activity_date',
        required: false
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryLeadActivityDto.prototype, "sort_by", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sort order',
        enum: ['ASC', 'DESC'],
        example: 'DESC',
        required: false
    }),
    (0, class_validator_1.IsEnum)(['ASC', 'DESC']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryLeadActivityDto.prototype, "sort_order", void 0);
//# sourceMappingURL=query-lead-activity.dto.js.map