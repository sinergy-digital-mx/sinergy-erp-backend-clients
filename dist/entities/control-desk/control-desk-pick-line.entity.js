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
exports.ControlDeskPickLine = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const warehouse_entity_1 = require("../warehouse/warehouse.entity");
const sales_order_detail_entity_1 = require("../sales-orders/sales-order-detail.entity");
const control_desk_pick_task_entity_1 = require("./control-desk-pick-task.entity");
let ControlDeskPickLine = class ControlDeskPickLine {
    id;
    tenant;
    tenant_id;
    task;
    task_id;
    sales_order_detail;
    sales_order_detail_id;
    warehouse;
    warehouse_id;
    quantity_base_requested;
    quantity_base_picked;
    status;
    created_at;
    updated_at;
};
exports.ControlDeskPickLine = ControlDeskPickLine;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ControlDeskPickLine.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], ControlDeskPickLine.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ControlDeskPickLine.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => control_desk_pick_task_entity_1.ControlDeskPickTask, (task) => task.lines, {
        onDelete: 'CASCADE',
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'task_id' }),
    __metadata("design:type", control_desk_pick_task_entity_1.ControlDeskPickTask)
], ControlDeskPickLine.prototype, "task", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ControlDeskPickLine.prototype, "task_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sales_order_detail_entity_1.SalesOrderDetail, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'sales_order_detail_id' }),
    __metadata("design:type", sales_order_detail_entity_1.SalesOrderDetail)
], ControlDeskPickLine.prototype, "sales_order_detail", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ControlDeskPickLine.prototype, "sales_order_detail_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'warehouse_id' }),
    __metadata("design:type", warehouse_entity_1.Warehouse)
], ControlDeskPickLine.prototype, "warehouse", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ControlDeskPickLine.prototype, "warehouse_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 3 }),
    __metadata("design:type", Number)
], ControlDeskPickLine.prototype, "quantity_base_requested", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 3, default: 0 }),
    __metadata("design:type", Number)
], ControlDeskPickLine.prototype, "quantity_base_picked", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, default: 'pending' }),
    __metadata("design:type", String)
], ControlDeskPickLine.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ControlDeskPickLine.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ControlDeskPickLine.prototype, "updated_at", void 0);
exports.ControlDeskPickLine = ControlDeskPickLine = __decorate([
    (0, typeorm_1.Entity)('control_desk_pick_lines'),
    (0, typeorm_1.Index)('idx_cd_lines_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('idx_cd_lines_task', ['task_id']),
    (0, typeorm_1.Index)('idx_cd_lines_detail', ['sales_order_detail_id'])
], ControlDeskPickLine);
//# sourceMappingURL=control-desk-pick-line.entity.js.map