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
exports.CreateInventoryTransferDto = exports.CreateInventoryTransferLineDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateInventoryTransferLineDto {
    inventory_batch_id;
    quantity;
}
exports.CreateInventoryTransferLineDto = CreateInventoryTransferLineDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID del lote origen del cual se toma stock' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInventoryTransferLineDto.prototype, "inventory_batch_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cantidad a transferir desde este lote', example: 10.5 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.001),
    __metadata("design:type", Number)
], CreateInventoryTransferLineDto.prototype, "quantity", void 0);
class CreateInventoryTransferDto {
    product_id;
    uom_id;
    source_warehouse_id;
    destination_warehouse_id;
    notes;
    lines;
}
exports.CreateInventoryTransferDto = CreateInventoryTransferDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInventoryTransferDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInventoryTransferDto.prototype, "uom_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Almacén de origen' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInventoryTransferDto.prototype, "source_warehouse_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Almacén de destino' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInventoryTransferDto.prototype, "destination_warehouse_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryTransferDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [CreateInventoryTransferLineDto],
        description: 'Una o más líneas tomando cantidad de lotes origen',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateInventoryTransferLineDto),
    __metadata("design:type", Array)
], CreateInventoryTransferDto.prototype, "lines", void 0);
//# sourceMappingURL=create-inventory-transfer.dto.js.map