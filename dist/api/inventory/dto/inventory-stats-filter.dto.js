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
exports.InventoryStatsFilterDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class InventoryStatsFilterDto {
    fiscal_configuration_id;
    billing_branch_id;
    warehouse_id;
}
exports.InventoryStatsFilterDto = InventoryStatsFilterDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filtrar por razón social. Requerido si se envía billing_branch_id',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], InventoryStatsFilterDto.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filtrar por sucursal. Requiere fiscal_configuration_id. Requerido si se envía warehouse_id',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], InventoryStatsFilterDto.prototype, "billing_branch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filtrar por almacén. Requiere fiscal_configuration_id y billing_branch_id',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], InventoryStatsFilterDto.prototype, "warehouse_id", void 0);
//# sourceMappingURL=inventory-stats-filter.dto.js.map