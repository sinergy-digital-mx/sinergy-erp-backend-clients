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
exports.QueryLeadsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class QueryLeadsDto {
    page;
    limit;
    search;
    status_id;
    email_contacted;
    customer_answered;
    contacted_no_reply;
    awaiting_agent_reply;
    agent_replied_back;
    group_id;
    last_email_thread_status;
    no_email_threads;
    has_unread_threads;
}
exports.QueryLeadsDto = QueryLeadsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Page number (1-based)',
        minimum: 1,
        default: 1,
        example: 1
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryLeadsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Number of items per page',
        minimum: 1,
        maximum: 100,
        default: 20,
        example: 20
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], QueryLeadsDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Search term for name, lastname, email, phone, or company_name',
        example: 'john'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryLeadsDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by status ID',
        example: 1
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], QueryLeadsDto.prototype, "status_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by email contact status',
        example: true
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueryLeadsDto.prototype, "email_contacted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by customer response status',
        example: true
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueryLeadsDto.prototype, "customer_answered", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter for leads contacted but not yet replied by customer',
        example: true
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueryLeadsDto.prototype, "contacted_no_reply", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter for leads where customer replied but agent has not replied back',
        example: true
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueryLeadsDto.prototype, "awaiting_agent_reply", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by agent reply status',
        example: true
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueryLeadsDto.prototype, "agent_replied_back", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by lead group ID',
        example: 'uuid-here'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryLeadsDto.prototype, "group_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by last email thread status',
        enum: ['draft', 'sent', 'replied', 'closed', 'archived'],
        example: 'replied'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryLeadsDto.prototype, "last_email_thread_status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter for leads with no email threads',
        example: true
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueryLeadsDto.prototype, "no_email_threads", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter for leads with unread email threads',
        example: true
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueryLeadsDto.prototype, "has_unread_threads", void 0);
//# sourceMappingURL=query-leads.dto.js.map