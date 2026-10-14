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
exports.QueryAverageCostReportDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const query_accounting_base_dto_1 = require("./query-accounting-base.dto");
class QueryAverageCostReportDto {
    billing_branch_id;
    period = query_accounting_base_dto_1.AccountingReportPeriod.MONTH;
    date_from;
    date_to;
    page = 1;
    limit = 20;
    search;
}
exports.QueryAverageCostReportDto = QueryAverageCostReportDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryAverageCostReportDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(query_accounting_base_dto_1.AccountingReportPeriod),
    __metadata("design:type", String)
], QueryAverageCostReportDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((dto) => dto.period === query_accounting_base_dto_1.AccountingReportPeriod.RANGE),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryAverageCostReportDto.prototype, "date_from", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((dto) => dto.period === query_accounting_base_dto_1.AccountingReportPeriod.RANGE),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryAverageCostReportDto.prototype, "date_to", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryAverageCostReportDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryAverageCostReportDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], QueryAverageCostReportDto.prototype, "search", void 0);
//# sourceMappingURL=query-average-cost-report.dto.js.map