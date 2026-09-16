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
exports.ReplacePosSaleCartDto = void 0;
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const create_sales_order_dto_1 = require("../../sales-orders/dto/create-sales-order.dto");
class ReplacePosSaleCartDto {
    line_items;
    customer_id;
    global_discount_id;
}
exports.ReplacePosSaleCartDto = ReplacePosSaleCartDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'La orden debe tener al menos un producto' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => create_sales_order_dto_1.CreateSalesOrderLineItemDto),
    __metadata("design:type", Array)
], ReplacePosSaleCartDto.prototype, "line_items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Cliente. Si se omite se usa mostrador.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ReplacePosSaleCartDto.prototype, "customer_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Descuento global. Si se omite se quita.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ReplacePosSaleCartDto.prototype, "global_discount_id", void 0);
//# sourceMappingURL=replace-pos-sale-cart.dto.js.map