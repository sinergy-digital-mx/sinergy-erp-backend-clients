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
exports.QueryCustomerSalesReportDto = exports.CustomerSalesReportPeriod = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
var CustomerSalesReportPeriod;
(function (CustomerSalesReportPeriod) {
    CustomerSalesReportPeriod["TODAY"] = "today";
    CustomerSalesReportPeriod["WEEK"] = "week";
    CustomerSalesReportPeriod["MONTH"] = "month";
    CustomerSalesReportPeriod["YEAR"] = "year";
    CustomerSalesReportPeriod["RANGE"] = "range";
})(CustomerSalesReportPeriod || (exports.CustomerSalesReportPeriod = CustomerSalesReportPeriod = {}));
class QueryCustomerSalesReportDto {
    fiscal_configuration_id;
    billing_branch_id;
    period = CustomerSalesReportPeriod.MONTH;
    date_from;
    date_to;
    limit;
}
exports.QueryCustomerSalesReportDto = QueryCustomerSalesReportDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryCustomerSalesReportDto.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryCustomerSalesReportDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(CustomerSalesReportPeriod),
    __metadata("design:type", String)
], QueryCustomerSalesReportDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((dto) => dto.period === CustomerSalesReportPeriod.RANGE),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryCustomerSalesReportDto.prototype, "date_from", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((dto) => dto.period === CustomerSalesReportPeriod.RANGE),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryCustomerSalesReportDto.prototype, "date_to", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(200),
    __metadata("design:type", Number)
], QueryCustomerSalesReportDto.prototype, "limit", void 0);
//# sourceMappingURL=query-customer-sales-report.dto.js.map