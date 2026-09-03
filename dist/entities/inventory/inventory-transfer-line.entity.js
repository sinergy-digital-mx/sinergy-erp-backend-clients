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
exports.InventoryTransferLine = void 0;
const typeorm_1 = require("typeorm");
const inventory_transfer_entity_1 = require("./inventory-transfer.entity");
const inventory_batch_entity_1 = require("../purchase-orders/inventory-batch.entity");
let InventoryTransferLine = class InventoryTransferLine {
    id;
    inventory_transfer;
    inventory_transfer_id;
    source_inventory_batch;
    source_inventory_batch_id;
    quantity;
    destination_inventory_batch;
    destination_inventory_batch_id;
    created_at;
};
exports.InventoryTransferLine = InventoryTransferLine;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InventoryTransferLine.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => inventory_transfer_entity_1.InventoryTransfer, (transfer) => transfer.lines, {
        onDelete: 'CASCADE',
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'inventory_transfer_id' }),
    __metadata("design:type", inventory_transfer_entity_1.InventoryTransfer)
], InventoryTransferLine.prototype, "inventory_transfer", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InventoryTransferLine.prototype, "inventory_transfer_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => inventory_batch_entity_1.InventoryBatch, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'source_inventory_batch_id' }),
    __metadata("design:type", inventory_batch_entity_1.InventoryBatch)
], InventoryTransferLine.prototype, "source_inventory_batch", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InventoryTransferLine.prototype, "source_inventory_batch_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 3 }),
    __metadata("design:type", Number)
], InventoryTransferLine.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => inventory_batch_entity_1.InventoryBatch, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'destination_inventory_batch_id' }),
    __metadata("design:type", inventory_batch_entity_1.InventoryBatch)
], InventoryTransferLine.prototype, "destination_inventory_batch", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InventoryTransferLine.prototype, "destination_inventory_batch_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], InventoryTransferLine.prototype, "created_at", void 0);
exports.InventoryTransferLine = InventoryTransferLine = __decorate([
    (0, typeorm_1.Entity)('inv_s_inventory_transfer_lines'),
    (0, typeorm_1.Index)('idx_transfer_line_transfer', ['inventory_transfer_id']),
    (0, typeorm_1.Index)('idx_transfer_line_source_batch', ['source_inventory_batch_id']),
    (0, typeorm_1.Index)('idx_transfer_line_dest_batch', ['destination_inventory_batch_id'])
], InventoryTransferLine);
//# sourceMappingURL=inventory-transfer-line.entity.js.map