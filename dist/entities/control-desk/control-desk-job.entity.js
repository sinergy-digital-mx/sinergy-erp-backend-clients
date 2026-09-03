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
exports.ControlDeskJob = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const sales_order_entity_1 = require("../sales-orders/sales-order.entity");
const billing_branch_entity_1 = require("../billing/billing-branch.entity");
const control_desk_position_entity_1 = require("./control-desk-position.entity");
const control_desk_pick_task_entity_1 = require("./control-desk-pick-task.entity");
let ControlDeskJob = class ControlDeskJob {
    id;
    tenant;
    tenant_id;
    sales_order;
    sales_order_id;
    billing_branch;
    billing_branch_id;
    position;
    position_id;
    status;
    has_shortage;
    created_by;
    created_at;
    updated_by;
    updated_at;
    tasks;
};
exports.ControlDeskJob = ControlDeskJob;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ControlDeskJob.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], ControlDeskJob.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ControlDeskJob.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sales_order_entity_1.SalesOrder, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'sales_order_id' }),
    __metadata("design:type", sales_order_entity_1.SalesOrder)
], ControlDeskJob.prototype, "sales_order", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ControlDeskJob.prototype, "sales_order_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => billing_branch_entity_1.BillingBranch, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'billing_branch_id' }),
    __metadata("design:type", billing_branch_entity_1.BillingBranch)
], ControlDeskJob.prototype, "billing_branch", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ControlDeskJob.prototype, "billing_branch_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => control_desk_position_entity_1.ControlDeskPosition, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'position_id' }),
    __metadata("design:type", Object)
], ControlDeskJob.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], ControlDeskJob.prototype, "position_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, default: 'released' }),
    __metadata("design:type", String)
], ControlDeskJob.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: 0 }),
    __metadata("design:type", Boolean)
], ControlDeskJob.prototype, "has_shortage", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ControlDeskJob.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ControlDeskJob.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ControlDeskJob.prototype, "updated_by", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ControlDeskJob.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => control_desk_pick_task_entity_1.ControlDeskPickTask, (task) => task.job),
    __metadata("design:type", Array)
], ControlDeskJob.prototype, "tasks", void 0);
exports.ControlDeskJob = ControlDeskJob = __decorate([
    (0, typeorm_1.Entity)('control_desk_jobs'),
    (0, typeorm_1.Index)('idx_cd_jobs_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('idx_cd_jobs_tenant_status', ['tenant_id', 'status']),
    (0, typeorm_1.Index)('idx_cd_jobs_tenant_branch', ['tenant_id', 'billing_branch_id']),
    (0, typeorm_1.Index)('uq_cd_jobs_sales_order', ['sales_order_id'], { unique: true }),
    (0, typeorm_1.Index)('uq_cd_jobs_position', ['position_id'], { unique: true })
], ControlDeskJob);
//# sourceMappingURL=control-desk-job.entity.js.map