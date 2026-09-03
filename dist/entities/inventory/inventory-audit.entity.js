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
exports.InventoryAudit = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const warehouse_entity_1 = require("../warehouse/warehouse.entity");
const product_entity_1 = require("../products/product.entity");
const user_entity_1 = require("../users/user.entity");
const inventory_audit_status_enum_1 = require("./inventory-audit-status.enum");
const inventory_audit_line_entity_1 = require("./inventory-audit-line.entity");
let InventoryAudit = class InventoryAudit {
    id;
    tenant;
    tenant_id;
    folio;
    warehouse;
    warehouse_id;
    product;
    product_id;
    include_empty_lots;
    status;
    notes;
    created_by_user;
    created_by;
    created_at;
    updated_at;
    submitted_by_user;
    submitted_by;
    submitted_at;
    authorized_by_user;
    authorized_by;
    authorized_at;
    rejected_by_user;
    rejected_by;
    rejected_at;
    rejection_reason;
    cancelled_by_user;
    cancelled_by;
    cancelled_at;
    cancellation_reason;
    lines;
};
exports.InventoryAudit = InventoryAudit;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InventoryAudit.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], InventoryAudit.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InventoryAudit.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], InventoryAudit.prototype, "folio", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'warehouse_id' }),
    __metadata("design:type", warehouse_entity_1.Warehouse)
], InventoryAudit.prototype, "warehouse", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InventoryAudit.prototype, "warehouse_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { onDelete: 'RESTRICT', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", Object)
], InventoryAudit.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAudit.prototype, "product_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: 0 }),
    __metadata("design:type", Boolean)
], InventoryAudit.prototype, "include_empty_lots", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: inventory_audit_status_enum_1.InventoryAuditStatus,
        default: inventory_audit_status_enum_1.InventoryAuditStatus.DRAFT,
    }),
    __metadata("design:type", String)
], InventoryAudit.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], InventoryAudit.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], InventoryAudit.prototype, "created_by_user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InventoryAudit.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], InventoryAudit.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], InventoryAudit.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'submitted_by' }),
    __metadata("design:type", Object)
], InventoryAudit.prototype, "submitted_by_user", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAudit.prototype, "submitted_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], InventoryAudit.prototype, "submitted_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'authorized_by' }),
    __metadata("design:type", Object)
], InventoryAudit.prototype, "authorized_by_user", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAudit.prototype, "authorized_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], InventoryAudit.prototype, "authorized_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'rejected_by' }),
    __metadata("design:type", Object)
], InventoryAudit.prototype, "rejected_by_user", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAudit.prototype, "rejected_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], InventoryAudit.prototype, "rejected_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], InventoryAudit.prototype, "rejection_reason", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'cancelled_by' }),
    __metadata("design:type", Object)
], InventoryAudit.prototype, "cancelled_by_user", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], InventoryAudit.prototype, "cancelled_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], InventoryAudit.prototype, "cancelled_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], InventoryAudit.prototype, "cancellation_reason", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => inventory_audit_line_entity_1.InventoryAuditLine, (line) => line.inventory_audit),
    __metadata("design:type", Array)
], InventoryAudit.prototype, "lines", void 0);
exports.InventoryAudit = InventoryAudit = __decorate([
    (0, typeorm_1.Entity)('inv_s_inventory_audits'),
    (0, typeorm_1.Index)('idx_audit_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('idx_audit_folio', ['tenant_id', 'folio'], { unique: true }),
    (0, typeorm_1.Index)('idx_audit_warehouse', ['warehouse_id']),
    (0, typeorm_1.Index)('idx_audit_status', ['tenant_id', 'status']),
    (0, typeorm_1.Index)('idx_audit_created_at', ['created_at'])
], InventoryAudit);
//# sourceMappingURL=inventory-audit.entity.js.map