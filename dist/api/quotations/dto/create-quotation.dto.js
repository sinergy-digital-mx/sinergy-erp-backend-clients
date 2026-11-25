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
    advance_amount;
    advance_uso_cfdi;
    advance_metodo_pago;
    advance_case;
    advance_stamp_environment;
    advance_forma_pago;
    advance_iva_percentage;
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
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "global_discount_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Anticipo con IVA que caja debe cobrar. Parcial o total de la cotización. Exige datos fiscales del cliente.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], CreateQuotationDto.prototype, "advance_amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Uso CFDI del anticipo (catálogo SAT). Solo con advance_amount. Si se omite, caja timbra con G01.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(4),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "advance_uso_cfdi", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        enum: ['PUE', 'PPD'],
        description: 'Método de pago del CFDI de anticipo. Solo con advance_amount. Si se omite, PUE.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['PUE', 'PPD']),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "advance_metodo_pago", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        enum: ['unknown', 'products'],
        description: 'unknown: el cliente no sabe qué va a llevar. products: la cotización guarda los productos y la factura de anticipo sigue siendo el concepto SAT.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['unknown', 'products']),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "advance_case", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        enum: ['demo', 'production'],
        description: 'Ambiente Finkok del anticipo. Solo con advance_amount. Si se omite, caja usa el ambiente activo.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['demo', 'production'], { message: 'El ambiente del anticipo debe ser demo o producción' }),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "advance_stamp_environment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Forma de pago SAT del anticipo: 01 efectivo, 02 cheque, 03 transferencia, 04 tarjeta.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['01', '02', '03', '04', '28']),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "advance_forma_pago", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'IVA del anticipo cuando la cotización no trae productos (0, 8 o 16).',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsIn)([0, 8, 16]),
    __metadata("design:type", Number)
], CreateQuotationDto.prototype, "advance_iva_percentage", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateQuotationLineItemDto),
    __metadata("design:type", Array)
], CreateQuotationDto.prototype, "line_items", void 0);
//# sourceMappingURL=create-quotation.dto.js.map