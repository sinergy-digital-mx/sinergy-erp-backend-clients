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
exports.UpdatePurchaseOrderRealCostDto = exports.PurchaseOrderRealCostLineIgiDto = exports.PurchaseOrderExtraCostDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class PurchaseOrderExtraCostDto {
    concept;
    amount;
    currency;
}
exports.PurchaseOrderExtraCostDto = PurchaseOrderExtraCostDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], PurchaseOrderExtraCostDto.prototype, "concept", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PurchaseOrderExtraCostDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['MXN', 'USD']),
    __metadata("design:type", String)
], PurchaseOrderExtraCostDto.prototype, "currency", void 0);
class PurchaseOrderRealCostLineIgiDto {
    line_item_id;
    igi_percentage;
}
exports.PurchaseOrderRealCostLineIgiDto = PurchaseOrderRealCostLineIgiDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PurchaseOrderRealCostLineIgiDto.prototype, "line_item_id", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], PurchaseOrderRealCostLineIgiDto.prototype, "igi_percentage", void 0);
class UpdatePurchaseOrderRealCostDto {
    customs_date;
    customs_exchange_rate;
    extra_costs;
    line_items;
}
exports.UpdatePurchaseOrderRealCostDto = UpdatePurchaseOrderRealCostDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value === '' || value === null ? null : value)),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Object)
], UpdatePurchaseOrderRealCostDto.prototype, "customs_date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === '' || value === null || value === undefined ? null : Number(value)),
    (0, class_validator_1.ValidateIf)((_, value) => value != null),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 4 }),
    (0, class_validator_1.Min)(0.0001),
    __metadata("design:type", Object)
], UpdatePurchaseOrderRealCostDto.prototype, "customs_exchange_rate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(80),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PurchaseOrderExtraCostDto),
    __metadata("design:type", Array)
], UpdatePurchaseOrderRealCostDto.prototype, "extra_costs", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PurchaseOrderRealCostLineIgiDto),
    __metadata("design:type", Array)
], UpdatePurchaseOrderRealCostDto.prototype, "line_items", void 0);
//# sourceMappingURL=update-purchase-order-real-cost.dto.js.map