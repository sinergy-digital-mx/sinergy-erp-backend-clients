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
exports.CreateQuotationDto = exports.CreateQuotationLineItemDto = void 0;
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateQuotationLineItemDto {
    product_id;
    product_uom_id;
    quantity;
    unit_price;
    discount_percentage = 0;
    product_discount_id;
    iva_percentage = 0;
    ieps_percentage = 0;
}
exports.CreateQuotationLineItemDto = CreateQuotationLineItemDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateQuotationLineItemDto.prototype, "product_id", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateQuotationLineItemDto.prototype, "product_uom_id", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateQuotationLineItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Precio unitario capturado en POS o en el alta manual. Hasta 4 decimales (p. ej. 2.150). Se persiste tal cual y se reusa al convertir a OV.',
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateQuotationLineItemDto.prototype, "unit_price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateQuotationLineItemDto.prototype, "discount_percentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Descuento de producto seleccionado en POS. Tiene prioridad sobre discount_percentage.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateQuotationLineItemDto.prototype, "product_discount_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateQuotationLineItemDto.prototype, "iva_percentage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateQuotationLineItemDto.prototype, "ieps_percentage", void 0);
class CreateQuotationDto {
    fiscal_configuration_id;
    billing_branch_id;
    warehouse_id;
    customer_id;
    expected_delivery_date;
    quotation_type;
    seller_user_id;
    assigned_seller_user_id;
    fiscal_razon_social;
    notes;
    global_discount_id;
    line_items;
}
exports.CreateQuotationDto = CreateQuotationDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Sucursal. Obligatoria en MANUAL. En POS, si se omite se toma del almacén.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Almacén. Obligatorio en POS. En MANUAL no se envía.',
    }),
    (0, class_validator_1.ValidateIf)((dto) => dto.quotation_type === 'POS' || dto.warehouse_id != null),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "warehouse_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Cliente. Obligatorio en MANUAL. En POS es opcional (mostrador si se omite).',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateQuotationDto.prototype, "customer_id", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "expected_delivery_date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['POS', 'MANUAL']),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "quotation_type", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((dto) => dto.quotation_type === 'POS'),
    (0, class_validator_1.IsUUID)(),
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Vendedor. Obligatorio en POS.',
    }),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "seller_user_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "assigned_seller_user_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "fiscal_razon_social", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "global_discount_id", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateQuotationLineItemDto),
    __metadata("design:type", Array)
], CreateQuotationDto.prototype, "line_items", void 0);
//# sourceMappingURL=create-quotation.dto.js.map