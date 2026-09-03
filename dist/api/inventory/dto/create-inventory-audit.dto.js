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
exports.CreateInventoryAuditDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CreateInventoryAuditDto {
    warehouse_id;
    product_id;
    include_empty_lots;
    notes;
}
exports.CreateInventoryAuditDto = CreateInventoryAuditDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Almacén a auditar' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateInventoryAuditDto.prototype, "warehouse_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Si se envía, el conteo cubre solo lotes de este producto',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateInventoryAuditDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Incluir lotes con existencia 0. Default false.',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === true || value === 'true' || value === 1 || value === '1'),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateInventoryAuditDto.prototype, "include_empty_lots", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateInventoryAuditDto.prototype, "notes", void 0);
//# sourceMappingURL=create-inventory-audit.dto.js.map