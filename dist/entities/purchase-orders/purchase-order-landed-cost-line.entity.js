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
exports.PurchaseOrderLandedCostLine = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const purchase_order_batch_entity_1 = require("./purchase-order-batch.entity");
const user_entity_1 = require("../users/user.entity");
let PurchaseOrderLandedCostLine = class PurchaseOrderLandedCostLine {
    id;
    tenant;
    tenant_id;
    purchase_order_batch;
    purchase_order_batch_id;
    concept;
    amount;
    currency;
    sort_order;
    creator;
    created_by;
    updated_by;
    created_at;
    updated_at;
};
exports.PurchaseOrderLandedCostLine = PurchaseOrderLandedCostLine;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PurchaseOrderLandedCostLine.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], PurchaseOrderLandedCostLine.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PurchaseOrderLandedCostLine.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => purchase_order_batch_entity_1.PurchaseOrderBatch, (po) => po.landed_cost_lines, {
        onDelete: 'CASCADE',
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'purchase_order_batch_id' }),
    __metadata("design:type", purchase_order_batch_entity_1.PurchaseOrderBatch)
], PurchaseOrderLandedCostLine.prototype, "purchase_order_batch", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PurchaseOrderLandedCostLine.prototype, "purchase_order_batch_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120 }),
    __metadata("design:type", String)
], PurchaseOrderLandedCostLine.prototype, "concept", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2 }),
    __metadata("design:type", Number)
], PurchaseOrderLandedCostLine.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['MXN', 'USD'],
        default: 'MXN',
    }),
    __metadata("design:type", String)
], PurchaseOrderLandedCostLine.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PurchaseOrderLandedCostLine.prototype, "sort_order", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], PurchaseOrderLandedCostLine.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PurchaseOrderLandedCostLine.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], PurchaseOrderLandedCostLine.prototype, "updated_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PurchaseOrderLandedCostLine.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PurchaseOrderLandedCostLine.prototype, "updated_at", void 0);
exports.PurchaseOrderLandedCostLine = PurchaseOrderLandedCostLine = __decorate([
    (0, typeorm_1.Entity)('inv_s_purchase_order_landed_cost_line'),
    (0, typeorm_1.Index)('idx_po_landed_cost_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('idx_po_landed_cost_po_id', ['purchase_order_batch_id'])
], PurchaseOrderLandedCostLine);
//# sourceMappingURL=purchase-order-landed-cost-line.entity.js.map