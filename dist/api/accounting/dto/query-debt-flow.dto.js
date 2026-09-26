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
exports.QueryDebtFlowDto = exports.DebtFlowPeriod = exports.DebtFlowView = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
var DebtFlowView;
(function (DebtFlowView) {
    DebtFlowView["AGING"] = "aging";
    DebtFlowView["LEDGER"] = "ledger";
})(DebtFlowView || (exports.DebtFlowView = DebtFlowView = {}));
var DebtFlowPeriod;
(function (DebtFlowPeriod) {
    DebtFlowPeriod["TODAY"] = "today";
    DebtFlowPeriod["WEEK"] = "week";
    DebtFlowPeriod["MONTH"] = "month";
    DebtFlowPeriod["YEAR"] = "year";
    DebtFlowPeriod["RANGE"] = "range";
})(DebtFlowPeriod || (exports.DebtFlowPeriod = DebtFlowPeriod = {}));
class QueryDebtFlowDto {
    fiscal_configuration_id;
    billing_branch_id;
    customer_id;
    search;
    view = DebtFlowView.AGING;
    period = DebtFlowPeriod.MONTH;
    date_from;
    date_to;
    page = 1;
    limit = 50;
}
exports.QueryDebtFlowDto = QueryDebtFlowDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryDebtFlowDto.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryDebtFlowDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryDebtFlowDto.prototype, "customer_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], QueryDebtFlowDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(DebtFlowView),
    __metadata("design:type", String)
], QueryDebtFlowDto.prototype, "view", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(DebtFlowPeriod),
    __metadata("design:type", String)
], QueryDebtFlowDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((dto) => dto.period === DebtFlowPeriod.RANGE),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryDebtFlowDto.prototype, "date_from", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((dto) => dto.period === DebtFlowPeriod.RANGE),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryDebtFlowDto.prototype, "date_to", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryDebtFlowDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], QueryDebtFlowDto.prototype, "limit", void 0);
//# sourceMappingURL=query-debt-flow.dto.js.map