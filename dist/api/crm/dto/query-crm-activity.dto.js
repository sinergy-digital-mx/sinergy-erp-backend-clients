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
exports.QueryCrmActivityDto = exports.CrmAttentionFilter = exports.CrmReportPeriod = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const customer_activity_entity_1 = require("../../../entities/customers/customer-activity.entity");
var CrmReportPeriod;
(function (CrmReportPeriod) {
    CrmReportPeriod["TODAY"] = "today";
    CrmReportPeriod["WEEK"] = "week";
    CrmReportPeriod["MONTH"] = "month";
    CrmReportPeriod["YEAR"] = "year";
    CrmReportPeriod["RANGE"] = "range";
})(CrmReportPeriod || (exports.CrmReportPeriod = CrmReportPeriod = {}));
var CrmAttentionFilter;
(function (CrmAttentionFilter) {
    CrmAttentionFilter["FOLLOW_UP_PENDING"] = "follow_up_pending";
    CrmAttentionFilter["FOLLOW_UP_OVERDUE"] = "follow_up_overdue";
    CrmAttentionFilter["CALL_PENDING"] = "call_pending";
    CrmAttentionFilter["TASK_PENDING"] = "task_pending";
})(CrmAttentionFilter || (exports.CrmAttentionFilter = CrmAttentionFilter = {}));
class QueryCrmActivityDto {
    page = 1;
    limit = 20;
    search;
    type;
    status;
    user_id;
    period = CrmReportPeriod.MONTH;
    date_from;
    date_to;
    attention;
    sort_by;
    sort_order;
}
exports.QueryCrmActivityDto = QueryCrmActivityDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryCrmActivityDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], QueryCrmActivityDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryCrmActivityDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(customer_activity_entity_1.CustomerActivityType),
    __metadata("design:type", String)
], QueryCrmActivityDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(customer_activity_entity_1.CustomerActivityStatus),
    __metadata("design:type", String)
], QueryCrmActivityDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryCrmActivityDto.prototype, "user_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(CrmReportPeriod),
    __metadata("design:type", String)
], QueryCrmActivityDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((dto) => dto.period === CrmReportPeriod.RANGE),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryCrmActivityDto.prototype, "date_from", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((dto) => dto.period === CrmReportPeriod.RANGE),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryCrmActivityDto.prototype, "date_to", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(CrmAttentionFilter),
    __metadata("design:type", String)
], QueryCrmActivityDto.prototype, "attention", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryCrmActivityDto.prototype, "sort_by", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryCrmActivityDto.prototype, "sort_order", void 0);
//# sourceMappingURL=query-crm-activity.dto.js.map