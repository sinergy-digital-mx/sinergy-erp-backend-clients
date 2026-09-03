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
exports.ReceivePurchaseOrderDto = exports.ReceivedItemDto = exports.ReceivedLotDto = exports.ReceiptLotMode = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var ReceiptLotMode;
(function (ReceiptLotMode) {
    ReceiptLotMode["SINGLE"] = "single";
    ReceiptLotMode["MULTIPLE"] = "multiple";
})(ReceiptLotMode || (exports.ReceiptLotMode = ReceiptLotMode = {}));
function emptyToUndefined({ value }) {
    if (value === '' || value === null) {
        return undefined;
    }
    return value;
}
class ReceivedLotDto {
    tag_identifier;
    product_uom_id;
    quantity;
    measure;
    measure_uom_id;
}
exports.ReceivedLotDto = ReceivedLotDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], ReceivedLotDto.prototype, "tag_identifier", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ReceivedLotDto.prototype, "product_uom_id", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.001),
    (0, class_validator_1.Max)(999999.999),
    __metadata("design:type", Number)
], ReceivedLotDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.001),
    (0, class_validator_1.Max)(999999.999),
    __metadata("design:type", Number)
], ReceivedLotDto.prototype, "measure", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ReceivedLotDto.prototype, "measure_uom_id", void 0);
class ReceivedItemDto {
    line_item_id;
    product_id;
    product_uom_id;
    quantity;
    unit_total;
    iva_percentage;
    iva_unit;
    ieps_percentage;
    ieps_unit;
    expiration_date;
    lot_mode;
    lots;
    measure;
    measure_uom_id;
}
exports.ReceivedItemDto = ReceivedItemDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ReceivedItemDto.prototype, "line_item_id", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ReceivedItemDto.prototype, "product_id", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ReceivedItemDto.prototype, "product_uom_id", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.001),
    (0, class_validator_1.Max)(999999.999),
    __metadata("design:type", Number)
], ReceivedItemDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ReceivedItemDto.prototype, "unit_total", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ReceivedItemDto.prototype, "iva_percentage", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ReceivedItemDto.prototype, "iva_unit", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ReceivedItemDto.prototype, "ieps_percentage", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ReceivedItemDto.prototype, "ieps_unit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Object)
], ReceivedItemDto.prototype, "expiration_date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ReceiptLotMode),
    __metadata("design:type", String)
], ReceivedItemDto.prototype, "lot_mode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ReceivedLotDto),
    __metadata("design:type", Array)
], ReceivedItemDto.prototype, "lots", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.001),
    (0, class_validator_1.Max)(999999.999),
    __metadata("design:type", Number)
], ReceivedItemDto.prototype, "measure", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ReceivedItemDto.prototype, "measure_uom_id", void 0);
class ReceivePurchaseOrderDto {
    received_items;
}
exports.ReceivePurchaseOrderDto = ReceivePurchaseOrderDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ReceivedItemDto),
    __metadata("design:type", Array)
], ReceivePurchaseOrderDto.prototype, "received_items", void 0);
//# sourceMappingURL=receive-purchase-order.dto.js.map