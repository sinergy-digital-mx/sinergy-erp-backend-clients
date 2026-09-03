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
exports.PurchaseOrderActivity = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const user_entity_1 = require("../users/user.entity");
const purchase_order_batch_entity_1 = require("./purchase-order-batch.entity");
let PurchaseOrderActivity = class PurchaseOrderActivity {
    id;
    tenant;
    tenant_id;
    purchase_order_batch;
    purchase_order_batch_id;
    type;
    title;
    description;
    actor;
    actor_id;
    occurred_at;
    changes;
    metadata;
    created_at;
};
exports.PurchaseOrderActivity = PurchaseOrderActivity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PurchaseOrderActivity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], PurchaseOrderActivity.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 36 }),
    __metadata("design:type", String)
], PurchaseOrderActivity.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => purchase_order_batch_entity_1.PurchaseOrderBatch, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'purchase_order_batch_id' }),
    __metadata("design:type", purchase_order_batch_entity_1.PurchaseOrderBatch)
], PurchaseOrderActivity.prototype, "purchase_order_batch", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 36 }),
    __metadata("design:type", String)
], PurchaseOrderActivity.prototype, "purchase_order_batch_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], PurchaseOrderActivity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], PurchaseOrderActivity.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], PurchaseOrderActivity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'actor_id' }),
    __metadata("design:type", Object)
], PurchaseOrderActivity.prototype, "actor", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 36, nullable: true }),
    __metadata("design:type", Object)
], PurchaseOrderActivity.prototype, "actor_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PurchaseOrderActivity.prototype, "occurred_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], PurchaseOrderActivity.prototype, "changes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], PurchaseOrderActivity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PurchaseOrderActivity.prototype, "created_at", void 0);
exports.PurchaseOrderActivity = PurchaseOrderActivity = __decorate([
    (0, typeorm_1.Entity)('inv_s_purchase_order_activities'),
    (0, typeorm_1.Index)('idx_po_activity_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('idx_po_activity_order', ['purchase_order_batch_id']),
    (0, typeorm_1.Index)('idx_po_activity_occurred', ['purchase_order_batch_id', 'occurred_at'])
], PurchaseOrderActivity);
//# sourceMappingURL=purchase-order-activity.entity.js.map