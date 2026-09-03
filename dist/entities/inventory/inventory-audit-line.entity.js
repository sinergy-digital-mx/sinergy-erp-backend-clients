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
exports.InventoryAuditLine = void 0;
const typeorm_1 = require("typeorm");
const inventory_audit_entity_1 = require("./inventory-audit.entity");
const inventory_batch_entity_1 = require("../purchase-orders/inventory-batch.entity");
const user_entity_1 = require("../users/user.entity");
let InventoryAuditLine = class InventoryAuditLine {
    id;
    inventory_audit;
    inventory_audit_id;
    inventory_batch;
    inventory_batch_id;
    system_quantity;
    counted_quantity;
    variance;
    reason;
    is_additional;
    counted_by_user;
    counted_by;
    counted_at;
    quantity_before_post;
    quantity_after_post;
    created_at;
    updated_at;
};
exports.InventoryAuditLine = InventoryAuditLine;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InventoryAuditLine.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => inventory_audit_entity_1.InventoryAudit, (audit) => audit.lines, {
        onDelete: 'CASCADE',
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'inventory_audit_id' }),
    __metadata("design:type", inventory_audit_entity_1.InventoryAudit)
], InventoryAuditLine.prototype, "inventory_audit", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InventoryAuditLine.prototype, "inventory_audit_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => inventory_batch_entity_1.InventoryBatch, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'inventory_batch_id' }),
    __metadata("design:type", inventory_batch_entity_1.InventoryBatch)
], InventoryAuditLine.prototype, "inventory_batch", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InventoryAuditLine.prototype, "inventory_batch_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 3 }),
    __metadata("design:type", Number)
], InventoryAuditLine.prototype, "system_quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 3, nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditLine.prototype, "counted_quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 3, nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditLine.prototype, "variance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditLine.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: 0 }),
    __metadata("design:type", Boolean)
], InventoryAuditLine.prototype, "is_additional", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'counted_by' }),
    __metadata("design:type", Object)
], InventoryAuditLine.prototype, "counted_by_user", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditLine.prototype, "counted_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditLine.prototype, "counted_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 3, nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditLine.prototype, "quantity_before_post", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 3, nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditLine.prototype, "quantity_after_post", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], InventoryAuditLine.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], InventoryAuditLine.prototype, "updated_at", void 0);
exports.InventoryAuditLine = InventoryAuditLine = __decorate([
    (0, typeorm_1.Entity)('inv_s_inventory_audit_lines'),
    (0, typeorm_1.Index)('idx_audit_line_audit', ['inventory_audit_id']),
    (0, typeorm_1.Index)('idx_audit_line_batch', ['inventory_batch_id']),
    (0, typeorm_1.Index)('uq_audit_line_batch', ['inventory_audit_id', 'inventory_batch_id'], {
        unique: true,
    })
], InventoryAuditLine);
//# sourceMappingURL=inventory-audit-line.entity.js.map