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
exports.CheckCustomerDuplicatesDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CheckCustomerDuplicatesDto {
    name;
    lastname;
    email;
    phone;
    phone_code;
    fiscal_rfc;
}
exports.CheckCustomerDuplicatesDto = CheckCustomerDuplicatesDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nombre', example: 'Juan' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CheckCustomerDuplicatesDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Apellido', example: 'Pérez' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CheckCustomerDuplicatesDto.prototype, "lastname", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Correo', example: 'juan@ejemplo.com' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CheckCustomerDuplicatesDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Teléfono (nacional o con lada)', example: '6647945661' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CheckCustomerDuplicatesDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Lada', example: '+52' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CheckCustomerDuplicatesDto.prototype, "phone_code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'RFC', example: 'PEGJ800101XXX' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CheckCustomerDuplicatesDto.prototype, "fiscal_rfc", void 0);
//# sourceMappingURL=check-customer-duplicates.dto.js.map