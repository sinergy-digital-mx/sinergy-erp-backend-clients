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
exports.UpsertCustomerPriceListsDto = exports.CustomerPriceListAssignmentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CustomerPriceListAssignmentDto {
    price_list_id;
    is_default;
}
exports.CustomerPriceListAssignmentDto = CustomerPriceListAssignmentDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CustomerPriceListAssignmentDto.prototype, "price_list_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CustomerPriceListAssignmentDto.prototype, "is_default", void 0);
class UpsertCustomerPriceListsDto {
    price_lists;
}
exports.UpsertCustomerPriceListsDto = UpsertCustomerPriceListsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CustomerPriceListAssignmentDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CustomerPriceListAssignmentDto),
    __metadata("design:type", Array)
], UpsertCustomerPriceListsDto.prototype, "price_lists", void 0);
//# sourceMappingURL=upsert-customer-price-lists.dto.js.map