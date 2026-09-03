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
exports.CreateLeadActivityDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const lead_activity_entity_1 = require("../../../entities/leads/lead-activity.entity");
class CreateLeadActivityDto {
    type;
    status = lead_activity_entity_1.ActivityStatus.COMPLETED;
    title;
    description;
    duration_minutes;
    outcome;
    follow_up_date;
    notes;
    metadata;
}
exports.CreateLeadActivityDto = CreateLeadActivityDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type of activity',
        enum: lead_activity_entity_1.ActivityType,
        example: lead_activity_entity_1.ActivityType.CALL
    }),
    (0, class_validator_1.IsEnum)(lead_activity_entity_1.ActivityType),
    __metadata("design:type", String)
], CreateLeadActivityDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Status of the activity',
        enum: lead_activity_entity_1.ActivityStatus,
        example: lead_activity_entity_1.ActivityStatus.COMPLETED,
        required: false
    }),
    (0, class_validator_1.IsEnum)(lead_activity_entity_1.ActivityStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateLeadActivityDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Title of the activity',
        example: 'Follow-up call with prospect'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLeadActivityDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Detailed description of the activity',
        example: 'Discussed pricing and next steps'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLeadActivityDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Duration of the activity in minutes',
        example: 30,
        minimum: 1,
        maximum: 1440,
        required: false
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(1440),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateLeadActivityDto.prototype, "duration_minutes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Outcome or result of the activity',
        example: 'Interested in premium package',
        required: false
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateLeadActivityDto.prototype, "outcome", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Date for follow-up activity',
        example: '2024-02-01T10:00:00Z',
        required: false
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateLeadActivityDto.prototype, "follow_up_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Additional notes about the activity',
        example: 'Customer seemed very interested, send proposal by Friday'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLeadActivityDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Additional metadata as key-value pairs',
        example: { call_quality: 'excellent', customer_mood: 'positive' },
        required: false
    }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateLeadActivityDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-lead-activity.dto.js.map