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
exports.QuerySalesBySellerOrdersDto = exports.QuerySalesBySellerReportDto = exports.SalesReportView = exports.SalesReportPeriod = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
var SalesReportPeriod;
(function (SalesReportPeriod) {
    SalesReportPeriod["TODAY"] = "today";
    SalesReportPeriod["WEEK"] = "week";
    SalesReportPeriod["MONTH"] = "month";
    SalesReportPeriod["YEAR"] = "year";
    SalesReportPeriod["RANGE"] = "range";
})(SalesReportPeriod || (exports.SalesReportPeriod = SalesReportPeriod = {}));
var SalesReportView;
(function (SalesReportView) {
    SalesReportView["SALES"] = "sales";
    SalesReportView["COMMISSIONS"] = "commissions";
})(SalesReportView || (exports.SalesReportView = SalesReportView = {}));
class QuerySalesBySellerReportDto {
    view = SalesReportView.SALES;
    fiscal_configuration_id;
    billing_branch_id;
    period = SalesReportPeriod.MONTH;
    date_from;
    date_to;
    commission_rate;
}
exports.QuerySalesBySellerReportDto = QuerySalesBySellerReportDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SalesReportView),
    __metadata("design:type", String)
], QuerySalesBySellerReportDto.prototype, "view", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QuerySalesBySellerReportDto.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QuerySalesBySellerReportDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SalesReportPeriod),
    __metadata("design:type", String)
], QuerySalesBySellerReportDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((dto) => dto.period === SalesReportPeriod.RANGE),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QuerySalesBySellerReportDto.prototype, "date_from", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((dto) => dto.period === SalesReportPeriod.RANGE),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QuerySalesBySellerReportDto.prototype, "date_to", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], QuerySalesBySellerReportDto.prototype, "commission_rate", void 0);
class QuerySalesBySellerOrdersDto extends QuerySalesBySellerReportDto {
    seller_id;
    page = 1;
    limit = 50;
}
exports.QuerySalesBySellerOrdersDto = QuerySalesBySellerOrdersDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QuerySalesBySellerOrdersDto.prototype, "seller_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QuerySalesBySellerOrdersDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QuerySalesBySellerOrdersDto.prototype, "limit", void 0);
//# sourceMappingURL=query-sales-by-seller-report.dto.js.map