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
exports.QueryStockReplenishmentDto = exports.STOCK_COVER_DAY_OPTIONS = exports.STOCK_PERIOD_DAY_OPTIONS = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
exports.STOCK_PERIOD_DAY_OPTIONS = [30, 60, 90];
exports.STOCK_COVER_DAY_OPTIONS = [15, 30, 45, 60];
class QueryStockReplenishmentDto {
    vendor_id;
    period_days;
    cover_days;
}
exports.QueryStockReplenishmentDto = QueryStockReplenishmentDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryStockReplenishmentDto.prototype, "vendor_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsIn)(exports.STOCK_PERIOD_DAY_OPTIONS),
    __metadata("design:type", Object)
], QueryStockReplenishmentDto.prototype, "period_days", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsIn)(exports.STOCK_COVER_DAY_OPTIONS),
    __metadata("design:type", Object)
], QueryStockReplenishmentDto.prototype, "cover_days", void 0);
//# sourceMappingURL=query-stock-replenishment.dto.js.map