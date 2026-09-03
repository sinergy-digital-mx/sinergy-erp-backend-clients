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
exports.StampSalesOrderInvoiceDto = void 0;
const class_validator_1 = require("class-validator");
class StampSalesOrderInvoiceDto {
    xml;
    series;
    folio;
    tipo_comprobante;
    certificate_serial;
    environment;
}
exports.StampSalesOrderInvoiceDto = StampSalesOrderInvoiceDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StampSalesOrderInvoiceDto.prototype, "xml", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StampSalesOrderInvoiceDto.prototype, "series", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StampSalesOrderInvoiceDto.prototype, "folio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StampSalesOrderInvoiceDto.prototype, "tipo_comprobante", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StampSalesOrderInvoiceDto.prototype, "certificate_serial", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['demo', 'production']),
    __metadata("design:type", String)
], StampSalesOrderInvoiceDto.prototype, "environment", void 0);
//# sourceMappingURL=stamp-sales-order-invoice.dto.js.map