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
exports.QuerySalesGoalsDto = exports.UpdateSalesGoalDto = exports.CreateSalesGoalDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const sales_goal_entity_1 = require("../../../entities/goals/sales-goal.entity");
class CreateSalesGoalDto {
    goal_scope;
    billing_branch_id;
    role_id;
    metric_type;
    target_value;
    period_type = sales_goal_entity_1.SalesGoalPeriodType.MONTH;
    period_year;
    period_month;
    notes;
    is_active = true;
}
exports.CreateSalesGoalDto = CreateSalesGoalDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: sales_goal_entity_1.SalesGoalScope }),
    (0, class_validator_1.IsEnum)(sales_goal_entity_1.SalesGoalScope),
    __metadata("design:type", String)
], CreateSalesGoalDto.prototype, "goal_scope", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSalesGoalDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Obligatorio si goal_scope = user_role' }),
    (0, class_validator_1.ValidateIf)((dto) => dto.goal_scope === sales_goal_entity_1.SalesGoalScope.USER_ROLE),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSalesGoalDto.prototype, "role_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: sales_goal_entity_1.SalesGoalMetricType }),
    (0, class_validator_1.IsEnum)(sales_goal_entity_1.SalesGoalMetricType),
    __metadata("design:type", String)
], CreateSalesGoalDto.prototype, "metric_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 100 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], CreateSalesGoalDto.prototype, "target_value", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: sales_goal_entity_1.SalesGoalPeriodType, default: sales_goal_entity_1.SalesGoalPeriodType.MONTH }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(sales_goal_entity_1.SalesGoalPeriodType),
    __metadata("design:type", String)
], CreateSalesGoalDto.prototype, "period_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2026 }),
    (0, class_validator_1.ValidateIf)((dto) => (dto.period_type ?? sales_goal_entity_1.SalesGoalPeriodType.MONTH) === sales_goal_entity_1.SalesGoalPeriodType.MONTH),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2000),
    (0, class_validator_1.Max)(2100),
    __metadata("design:type", Number)
], CreateSalesGoalDto.prototype, "period_year", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 6 }),
    (0, class_validator_1.ValidateIf)((dto) => (dto.period_type ?? sales_goal_entity_1.SalesGoalPeriodType.MONTH) === sales_goal_entity_1.SalesGoalPeriodType.MONTH),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], CreateSalesGoalDto.prototype, "period_month", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSalesGoalDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSalesGoalDto.prototype, "is_active", void 0);
class UpdateSalesGoalDto {
    goal_scope;
    billing_branch_id;
    role_id;
    metric_type;
    target_value;
    period_type;
    period_year;
    period_month;
    notes;
    is_active;
}
exports.UpdateSalesGoalDto = UpdateSalesGoalDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: sales_goal_entity_1.SalesGoalScope }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(sales_goal_entity_1.SalesGoalScope),
    __metadata("design:type", String)
], UpdateSalesGoalDto.prototype, "goal_scope", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateSalesGoalDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], UpdateSalesGoalDto.prototype, "role_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: sales_goal_entity_1.SalesGoalMetricType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(sales_goal_entity_1.SalesGoalMetricType),
    __metadata("design:type", String)
], UpdateSalesGoalDto.prototype, "metric_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], UpdateSalesGoalDto.prototype, "target_value", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: sales_goal_entity_1.SalesGoalPeriodType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(sales_goal_entity_1.SalesGoalPeriodType),
    __metadata("design:type", String)
], UpdateSalesGoalDto.prototype, "period_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2000),
    (0, class_validator_1.Max)(2100),
    __metadata("design:type", Number)
], UpdateSalesGoalDto.prototype, "period_year", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], UpdateSalesGoalDto.prototype, "period_month", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UpdateSalesGoalDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'true = Activa, false = Inactiva' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateSalesGoalDto.prototype, "is_active", void 0);
class QuerySalesGoalsDto {
    billing_branch_id;
    goal_scope;
    period_year;
    period_month;
    is_active;
}
exports.QuerySalesGoalsDto = QuerySalesGoalsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QuerySalesGoalsDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: sales_goal_entity_1.SalesGoalScope }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(sales_goal_entity_1.SalesGoalScope),
    __metadata("design:type", String)
], QuerySalesGoalsDto.prototype, "goal_scope", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2000),
    __metadata("design:type", Number)
], QuerySalesGoalsDto.prototype, "period_year", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], QuerySalesGoalsDto.prototype, "period_month", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === undefined || value === null || value === '')
            return undefined;
        return value === true || value === 'true' || value === '1';
    }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QuerySalesGoalsDto.prototype, "is_active", void 0);
//# sourceMappingURL=create-sales-goal.dto.js.map