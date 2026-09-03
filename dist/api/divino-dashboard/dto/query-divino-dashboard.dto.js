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
exports.QueryRevenueSeriesDto = exports.QueryDivinoDashboardDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class QueryDivinoDashboardDto {
    scope = 'period';
    year;
    month;
}
exports.QueryDivinoDashboardDto = QueryDivinoDashboardDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['period', 'all_time']),
    __metadata("design:type", String)
], QueryDivinoDashboardDto.prototype, "scope", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => (o.scope ?? 'period') === 'period'),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2000),
    (0, class_validator_1.Max)(2100),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryDivinoDashboardDto.prototype, "year", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => (o.scope ?? 'period') === 'period' && o.month != null),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryDivinoDashboardDto.prototype, "month", void 0);
class QueryRevenueSeriesDto extends QueryDivinoDashboardDto {
    period = 'monthly';
}
exports.QueryRevenueSeriesDto = QueryRevenueSeriesDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryRevenueSeriesDto.prototype, "period", void 0);
//# sourceMappingURL=query-divino-dashboard.dto.js.map