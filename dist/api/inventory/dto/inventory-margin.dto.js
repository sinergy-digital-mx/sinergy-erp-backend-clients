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
exports.ProductMarginResponseDto = exports.ProductMarginUomDto = exports.InventoryMarginExplanationDto = exports.InventoryMarginGroupDto = exports.InventoryMarginLineDto = exports.InventoryMarginDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class InventoryMarginDto {
    unit_price;
    price_list_name;
    unit_cost;
    margin_amount;
    margin_percentage;
    source;
    source_label;
    hint;
    purchase_count;
    configuration_count;
    missing_count;
    cost_basis;
    purchase_folio;
}
exports.InventoryMarginDto = InventoryMarginDto;
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryMarginDto.prototype, "unit_price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryMarginDto.prototype, "price_list_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryMarginDto.prototype, "unit_cost", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryMarginDto.prototype, "margin_amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryMarginDto.prototype, "margin_percentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['purchase', 'configuration', 'mixed', 'none'] }),
    __metadata("design:type", String)
], InventoryMarginDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryMarginDto.prototype, "source_label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryMarginDto.prototype, "hint", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InventoryMarginDto.prototype, "purchase_count", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InventoryMarginDto.prototype, "configuration_count", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InventoryMarginDto.prototype, "missing_count", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryMarginDto.prototype, "cost_basis", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryMarginDto.prototype, "purchase_folio", void 0);
class InventoryMarginLineDto {
    label;
    detail;
    amount;
    currency;
    included;
}
exports.InventoryMarginLineDto = InventoryMarginLineDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryMarginLineDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryMarginLineDto.prototype, "detail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryMarginLineDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true, enum: ['MXN', 'USD'] }),
    __metadata("design:type", Object)
], InventoryMarginLineDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], InventoryMarginLineDto.prototype, "included", void 0);
class InventoryMarginGroupDto {
    title;
    note;
    lines;
}
exports.InventoryMarginGroupDto = InventoryMarginGroupDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryMarginGroupDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryMarginGroupDto.prototype, "note", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [InventoryMarginLineDto] }),
    __metadata("design:type", Array)
], InventoryMarginGroupDto.prototype, "lines", void 0);
class InventoryMarginExplanationDto {
    margin;
    headline;
    formula_sentence;
    price_note;
    cost_note;
    groups;
}
exports.InventoryMarginExplanationDto = InventoryMarginExplanationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: InventoryMarginDto }),
    __metadata("design:type", InventoryMarginDto)
], InventoryMarginExplanationDto.prototype, "margin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryMarginExplanationDto.prototype, "headline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryMarginExplanationDto.prototype, "formula_sentence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryMarginExplanationDto.prototype, "price_note", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryMarginExplanationDto.prototype, "cost_note", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [InventoryMarginGroupDto] }),
    __metadata("design:type", Array)
], InventoryMarginExplanationDto.prototype, "groups", void 0);
class ProductMarginUomDto {
    uom_id;
    uom_name;
    margin_detail;
}
exports.ProductMarginUomDto = ProductMarginUomDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ProductMarginUomDto.prototype, "uom_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ProductMarginUomDto.prototype, "uom_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: InventoryMarginExplanationDto }),
    __metadata("design:type", InventoryMarginExplanationDto)
], ProductMarginUomDto.prototype, "margin_detail", void 0);
class ProductMarginResponseDto {
    product_id;
    product_name;
    product_sku;
    uoms;
    empty_reason;
}
exports.ProductMarginResponseDto = ProductMarginResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ProductMarginResponseDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ProductMarginResponseDto.prototype, "product_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ProductMarginResponseDto.prototype, "product_sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ProductMarginUomDto] }),
    __metadata("design:type", Array)
], ProductMarginResponseDto.prototype, "uoms", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], ProductMarginResponseDto.prototype, "empty_reason", void 0);
//# sourceMappingURL=inventory-margin.dto.js.map