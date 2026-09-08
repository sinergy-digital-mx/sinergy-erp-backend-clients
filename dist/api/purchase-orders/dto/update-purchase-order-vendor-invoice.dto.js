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
exports.UpdatePurchaseOrderVendorInvoiceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdatePurchaseOrderVendorInvoiceDto {
    vendor_invoice_number;
}
exports.UpdatePurchaseOrderVendorInvoiceDto = UpdatePurchaseOrderVendorInvoiceDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        nullable: true,
        description: 'Número de factura del proveedor. Enviar null o cadena vacía para borrar.',
        example: 'A-12345',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", Object)
], UpdatePurchaseOrderVendorInvoiceDto.prototype, "vendor_invoice_number", void 0);
//# sourceMappingURL=update-purchase-order-vendor-invoice.dto.js.map