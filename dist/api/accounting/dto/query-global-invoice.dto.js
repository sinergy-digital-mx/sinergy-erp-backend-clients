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
exports.CancelGlobalInvoiceDto = exports.CreateGlobalInvoiceDto = exports.QueryGlobalInvoiceDto = void 0;
const class_validator_1 = require("class-validator");
class QueryGlobalInvoiceDto {
    month;
    billing_branch_id;
}
exports.QueryGlobalInvoiceDto = QueryGlobalInvoiceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}$/, { message: 'Indica el mes con formato AAAA-MM' }),
    __metadata("design:type", String)
], QueryGlobalInvoiceDto.prototype, "month", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryGlobalInvoiceDto.prototype, "billing_branch_id", void 0);
class CreateGlobalInvoiceDto {
    month;
    billing_branch_id;
    order_ids;
    environment;
}
exports.CreateGlobalInvoiceDto = CreateGlobalInvoiceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}$/, { message: 'Indica el mes con formato AAAA-MM' }),
    __metadata("design:type", String)
], CreateGlobalInvoiceDto.prototype, "month", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateGlobalInvoiceDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CreateGlobalInvoiceDto.prototype, "order_ids", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['demo', 'production']),
    __metadata("design:type", String)
], CreateGlobalInvoiceDto.prototype, "environment", void 0);
class CancelGlobalInvoiceDto {
    environment;
}
exports.CancelGlobalInvoiceDto = CancelGlobalInvoiceDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['demo', 'production']),
    __metadata("design:type", String)
], CancelGlobalInvoiceDto.prototype, "environment", void 0);
//# sourceMappingURL=query-global-invoice.dto.js.map