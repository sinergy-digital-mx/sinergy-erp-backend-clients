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
exports.InventoryBatchMovementListResponseDto = exports.InventoryBatchMovementDto = exports.InventoryBatchMovementChangeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class InventoryBatchMovementChangeDto {
    field;
    field_label;
    from;
    to;
}
exports.InventoryBatchMovementChangeDto = InventoryBatchMovementChangeDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryBatchMovementChangeDto.prototype, "field", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryBatchMovementChangeDto.prototype, "field_label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryBatchMovementChangeDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryBatchMovementChangeDto.prototype, "to", void 0);
class InventoryBatchMovementDto {
    id;
    occurred_at;
    type;
    type_label;
    title;
    description;
    direction;
    quantity;
    actor_id;
    actor_name;
    authorized_by_id;
    authorized_by_name;
    authorized_at;
    changes;
    metadata;
}
exports.InventoryBatchMovementDto = InventoryBatchMovementDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryBatchMovementDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], InventoryBatchMovementDto.prototype, "occurred_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryBatchMovementDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryBatchMovementDto.prototype, "type_label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InventoryBatchMovementDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryBatchMovementDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['in', 'out', 'adjust'] }),
    __metadata("design:type", String)
], InventoryBatchMovementDto.prototype, "direction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryBatchMovementDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryBatchMovementDto.prototype, "actor_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryBatchMovementDto.prototype, "actor_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryBatchMovementDto.prototype, "authorized_by_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryBatchMovementDto.prototype, "authorized_by_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryBatchMovementDto.prototype, "authorized_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [InventoryBatchMovementChangeDto] }),
    __metadata("design:type", Array)
], InventoryBatchMovementDto.prototype, "changes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: 'object', additionalProperties: true }),
    __metadata("design:type", Object)
], InventoryBatchMovementDto.prototype, "metadata", void 0);
class InventoryBatchMovementListResponseDto {
    data;
    total;
}
exports.InventoryBatchMovementListResponseDto = InventoryBatchMovementListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [InventoryBatchMovementDto] }),
    __metadata("design:type", Array)
], InventoryBatchMovementListResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InventoryBatchMovementListResponseDto.prototype, "total", void 0);
//# sourceMappingURL=inventory-batch-movement.dto.js.map