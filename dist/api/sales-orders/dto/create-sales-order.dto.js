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
exports.CreateSalesOrderDto = exports.CreateSalesOrderLineItemDto = void 0;
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateSalesOrderLineItemDto {
    product_id;
    product_uom_id;
    quantity;
    unit_price;
    discount_percentage = 0;
    product_discount_id;
    iva_percentage = 0;
    ieps_percentage = 0;
}
exports.CreateSalesOrderLineItemDto = CreateSalesOrderLineItemDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSalesOrderLineItemDto.prototype, "product_id", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSalesOrderLineItemDto.prototype, "product_uom_id", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateSalesOrderLineItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Precio unitario. Hasta 4 decimales (p. ej. 2.150). No redondear a 2.',
        example: 2.15,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSalesOrderLineItemDto.prototype, "unit_price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSalesOrderLineItemDto.prototype, "discount_percentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Descuento de producto seleccionado en POS/venta. Tiene prioridad sobre discount_percentage.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSalesOrderLineItemDto.prototype, "product_discount_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSalesOrderLineItemDto.prototype, "iva_percentage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSalesOrderLineItemDto.prototype, "ieps_percentage", void 0);
class CreateSalesOrderDto {
    fiscal_configuration_id;
    billing_branch_id;
    warehouse_id;
    customer_id;
    expected_delivery_date;
    sales_order_type;
    seller_user_id;
    assigned_seller_user_id;
    pos_daily_shift_id;
    fiscal_razon_social;
    payment_status;
    notes;
    requires_selection_assembly;
    global_discount_id;
    line_items;
}
exports.CreateSalesOrderDto = CreateSalesOrderDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSalesOrderDto.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Sucursal. Obligatoria en MANUAL. En POS, si se omite se toma del almacén.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSalesOrderDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Almacén. Obligatorio en POS. En MANUAL no se envía: el inventario sale de los almacenes de la sucursal.',
    }),
    (0, class_validator_1.ValidateIf)((dto) => dto.sales_order_type === 'POS' || dto.warehouse_id != null),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSalesOrderDto.prototype, "warehouse_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Cliente. Obligatorio en órdenes MANUAL. En POS es opcional (mostrador si se omite).',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSalesOrderDto.prototype, "customer_id", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateSalesOrderDto.prototype, "expected_delivery_date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['POS', 'MANUAL']),
    __metadata("design:type", String)
], CreateSalesOrderDto.prototype, "sales_order_type", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((dto) => dto.sales_order_type === 'POS'),
    (0, class_validator_1.IsUUID)(),
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Vendedor. Obligatorio en POS. En MANUAL, si se omite se usa el usuario que crea la orden.',
    }),
    __metadata("design:type", String)
], CreateSalesOrderDto.prototype, "seller_user_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Comisionado (quien cobra comisión). Si se omite, se toma del vendedor asignado del cliente; si el cliente no tiene, se usa el vendedor.',
    }),
    __metadata("design:type", String)
], CreateSalesOrderDto.prototype, "assigned_seller_user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Opcional. Si no se envía, se resuelve el corte abierto de cobranza de la sucursal.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSalesOrderDto.prototype, "pos_daily_shift_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSalesOrderDto.prototype, "fiscal_razon_social", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['Pendiente', 'Pagado']),
    __metadata("design:type", String)
], CreateSalesOrderDto.prototype, "payment_status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSalesOrderDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        default: false,
        description: 'Si true (solo MANUAL), la orden entra en En Selección y requiere corroboración en Control de almacén. Ignorado en POS.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSalesOrderDto.prototype, "requires_selection_assembly", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Descuento global seleccionado en POS/venta (ej. Descuento de carpintero). Se aplica sobre el subtotal neto después de descuentos por línea.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSalesOrderDto.prototype, "global_discount_id", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateSalesOrderLineItemDto),
    __metadata("design:type", Array)
], CreateSalesOrderDto.prototype, "line_items", void 0);
//# sourceMappingURL=create-sales-order.dto.js.map