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
exports.QueryPosCollectionsDto = exports.PosCollectionCustomerType = exports.QueryPosTerminalSalesDto = exports.QueryAccountsReceivableDto = exports.QueryAccountsPayableDto = exports.QueryAccountingBaseDto = exports.AccountingReportPeriod = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
var AccountingReportPeriod;
(function (AccountingReportPeriod) {
    AccountingReportPeriod["TODAY"] = "today";
    AccountingReportPeriod["WEEK"] = "week";
    AccountingReportPeriod["MONTH"] = "month";
    AccountingReportPeriod["RANGE"] = "range";
})(AccountingReportPeriod || (exports.AccountingReportPeriod = AccountingReportPeriod = {}));
class QueryAccountingBaseDto {
    billing_branch_id;
    period = AccountingReportPeriod.MONTH;
    date_from;
    date_to;
}
exports.QueryAccountingBaseDto = QueryAccountingBaseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryAccountingBaseDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(AccountingReportPeriod),
    __metadata("design:type", String)
], QueryAccountingBaseDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((dto) => dto.period === AccountingReportPeriod.RANGE),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryAccountingBaseDto.prototype, "date_from", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((dto) => dto.period === AccountingReportPeriod.RANGE),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryAccountingBaseDto.prototype, "date_to", void 0);
class QueryAccountsPayableDto {
    page = 1;
    limit = 20;
    search;
}
exports.QueryAccountsPayableDto = QueryAccountsPayableDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryAccountsPayableDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryAccountsPayableDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryAccountsPayableDto.prototype, "search", void 0);
class QueryAccountsReceivableDto {
    billing_branch_id;
    page = 1;
    limit = 20;
    search;
}
exports.QueryAccountsReceivableDto = QueryAccountsReceivableDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryAccountsReceivableDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryAccountsReceivableDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryAccountsReceivableDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryAccountsReceivableDto.prototype, "search", void 0);
class QueryPosTerminalSalesDto extends QueryAccountingBaseDto {
    page = 1;
    limit = 20;
}
exports.QueryPosTerminalSalesDto = QueryPosTerminalSalesDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryPosTerminalSalesDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryPosTerminalSalesDto.prototype, "limit", void 0);
var PosCollectionCustomerType;
(function (PosCollectionCustomerType) {
    PosCollectionCustomerType["ALL"] = "all";
    PosCollectionCustomerType["WALK_IN"] = "walk_in";
    PosCollectionCustomerType["INVOICED"] = "invoiced";
})(PosCollectionCustomerType || (exports.PosCollectionCustomerType = PosCollectionCustomerType = {}));
class QueryPosCollectionsDto extends QueryAccountingBaseDto {
    customer_type = PosCollectionCustomerType.ALL;
    page = 1;
    limit = 20;
}
exports.QueryPosCollectionsDto = QueryPosCollectionsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(PosCollectionCustomerType),
    __metadata("design:type", String)
], QueryPosCollectionsDto.prototype, "customer_type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryPosCollectionsDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryPosCollectionsDto.prototype, "limit", void 0);
//# sourceMappingURL=query-accounting-base.dto.js.map