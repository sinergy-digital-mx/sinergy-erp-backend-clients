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
exports.UpdateVendorDto = void 0;
const class_validator_1 = require("class-validator");
const vendor_type_enum_1 = require("../../../entities/vendor/vendor-type.enum");
const vendor_banking_dto_1 = require("./vendor-banking.dto");
class UpdateVendorDto extends vendor_banking_dto_1.VendorBankingDto {
    vendor_type;
    name;
    company_name;
    street;
    city;
    state;
    zip_code;
    country;
    razon_social;
    rfc;
    persona_type;
    tax_id;
    legal_name;
    status;
    credit_days;
    credit_limit;
}
exports.UpdateVendorDto = UpdateVendorDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(vendor_type_enum_1.VendorType),
    __metadata("design:type", String)
], UpdateVendorDto.prototype, "vendor_type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVendorDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVendorDto.prototype, "company_name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVendorDto.prototype, "street", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVendorDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVendorDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVendorDto.prototype, "zip_code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVendorDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.vendor_type === vendor_type_enum_1.VendorType.NATIONAL),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVendorDto.prototype, "razon_social", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.vendor_type === vendor_type_enum_1.VendorType.NATIONAL),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVendorDto.prototype, "rfc", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.vendor_type === vendor_type_enum_1.VendorType.NATIONAL),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['Persona Física', 'Persona Moral']),
    __metadata("design:type", String)
], UpdateVendorDto.prototype, "persona_type", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.vendor_type === vendor_type_enum_1.VendorType.INTERNATIONAL),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVendorDto.prototype, "tax_id", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.vendor_type === vendor_type_enum_1.VendorType.INTERNATIONAL),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVendorDto.prototype, "legal_name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['active', 'inactive']),
    __metadata("design:type", String)
], UpdateVendorDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateVendorDto.prototype, "credit_days", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVendorDto.prototype, "credit_limit", void 0);
//# sourceMappingURL=update-vendor.dto.js.map