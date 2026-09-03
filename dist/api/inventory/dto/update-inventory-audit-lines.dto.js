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
exports.UpdateInventoryAuditLinesDto = exports.UpdateInventoryAuditLineDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class UpdateInventoryAuditLineDto {
    id;
    counted_quantity;
    reason;
}
exports.UpdateInventoryAuditLineDto = UpdateInventoryAuditLineDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID de la línea de auditoría' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateInventoryAuditLineDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Cantidad física contada. 0 es válido (lote vacío).',
        example: 12.5,
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateInventoryAuditLineDto.prototype, "counted_quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Motivo obligatorio si hay diferencia vs el sistema',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateInventoryAuditLineDto.prototype, "reason", void 0);
class UpdateInventoryAuditLinesDto {
    lines;
}
exports.UpdateInventoryAuditLinesDto = UpdateInventoryAuditLinesDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [UpdateInventoryAuditLineDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UpdateInventoryAuditLineDto),
    __metadata("design:type", Array)
], UpdateInventoryAuditLinesDto.prototype, "lines", void 0);
//# sourceMappingURL=update-inventory-audit-lines.dto.js.map