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
exports.ControlDeskPickTask = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const warehouse_entity_1 = require("../warehouse/warehouse.entity");
const user_entity_1 = require("../users/user.entity");
const control_desk_job_entity_1 = require("./control-desk-job.entity");
const control_desk_pick_line_entity_1 = require("./control-desk-pick-line.entity");
let ControlDeskPickTask = class ControlDeskPickTask {
    id;
    tenant;
    tenant_id;
    job;
    job_id;
    warehouse;
    warehouse_id;
    status;
    started_at;
    starter;
    started_by;
    completed_at;
    completer;
    completed_by;
    created_at;
    updated_at;
    lines;
};
exports.ControlDeskPickTask = ControlDeskPickTask;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ControlDeskPickTask.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], ControlDeskPickTask.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ControlDeskPickTask.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => control_desk_job_entity_1.ControlDeskJob, (job) => job.tasks, {
        onDelete: 'CASCADE',
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'job_id' }),
    __metadata("design:type", control_desk_job_entity_1.ControlDeskJob)
], ControlDeskPickTask.prototype, "job", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ControlDeskPickTask.prototype, "job_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'warehouse_id' }),
    __metadata("design:type", warehouse_entity_1.Warehouse)
], ControlDeskPickTask.prototype, "warehouse", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ControlDeskPickTask.prototype, "warehouse_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, default: 'pending' }),
    __metadata("design:type", String)
], ControlDeskPickTask.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], ControlDeskPickTask.prototype, "started_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'started_by' }),
    __metadata("design:type", Object)
], ControlDeskPickTask.prototype, "starter", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], ControlDeskPickTask.prototype, "started_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], ControlDeskPickTask.prototype, "completed_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'completed_by' }),
    __metadata("design:type", Object)
], ControlDeskPickTask.prototype, "completer", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], ControlDeskPickTask.prototype, "completed_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ControlDeskPickTask.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ControlDeskPickTask.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => control_desk_pick_line_entity_1.ControlDeskPickLine, (line) => line.task),
    __metadata("design:type", Array)
], ControlDeskPickTask.prototype, "lines", void 0);
exports.ControlDeskPickTask = ControlDeskPickTask = __decorate([
    (0, typeorm_1.Entity)('control_desk_pick_tasks'),
    (0, typeorm_1.Index)('idx_cd_tasks_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('idx_cd_tasks_job', ['job_id']),
    (0, typeorm_1.Index)('idx_cd_tasks_warehouse', ['tenant_id', 'warehouse_id', 'status']),
    (0, typeorm_1.Index)('uq_cd_tasks_job_warehouse', ['job_id', 'warehouse_id'], { unique: true })
], ControlDeskPickTask);
//# sourceMappingURL=control-desk-pick-task.entity.js.map