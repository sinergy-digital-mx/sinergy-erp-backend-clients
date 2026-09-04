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
exports.QueryStockFlowDto = exports.StockFlowView = exports.StockFlowPeriod = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
var StockFlowPeriod;
(function (StockFlowPeriod) {
    StockFlowPeriod["TODAY"] = "today";
    StockFlowPeriod["WEEK"] = "week";
    StockFlowPeriod["MONTH"] = "month";
    StockFlowPeriod["YEAR"] = "year";
    StockFlowPeriod["RANGE"] = "range";
})(StockFlowPeriod || (exports.StockFlowPeriod = StockFlowPeriod = {}));
var StockFlowView;
(function (StockFlowView) {
    StockFlowView["SUMMARY"] = "summary";
    StockFlowView["LEDGER"] = "ledger";
    StockFlowView["TOTALIZED"] = "totalized";
})(StockFlowView || (exports.StockFlowView = StockFlowView = {}));
class QueryStockFlowDto {
    period = StockFlowPeriod.MONTH;
    date_from;
    date_to;
    view = StockFlowView.SUMMARY;
    fiscal_configuration_id;
    billing_branch_id;
    product_id;
    search;
}
exports.QueryStockFlowDto = QueryStockFlowDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: StockFlowPeriod, default: StockFlowPeriod.MONTH }),
    (0, class_validator_1.IsEnum)(StockFlowPeriod),
    __metadata("design:type", String)
], QueryStockFlowDto.prototype, "period", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Requerido si period=range (ISO o YYYY-MM-DD)' }),
    (0, class_validator_1.ValidateIf)((o) => o.period === StockFlowPeriod.RANGE),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryStockFlowDto.prototype, "date_from", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Requerido si period=range' }),
    (0, class_validator_1.ValidateIf)((o) => o.period === StockFlowPeriod.RANGE),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryStockFlowDto.prototype, "date_to", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: StockFlowView, default: StockFlowView.SUMMARY }),
    (0, class_validator_1.IsEnum)(StockFlowView),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryStockFlowDto.prototype, "view", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Razón social (obligatoria)' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryStockFlowDto.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Sucursal opcional. En totalizado, omitir = todas las de la razón social',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryStockFlowDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryStockFlowDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Búsqueda por SKU o nombre de producto' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], QueryStockFlowDto.prototype, "search", void 0);
//# sourceMappingURL=query-stock-flow.dto.js.map