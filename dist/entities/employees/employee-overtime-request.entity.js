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
exports.EmployeeOvertimeRequest = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const employee_entity_1 = require("./employee.entity");
const overtime_status_enum_1 = require("./overtime-status.enum");
let EmployeeOvertimeRequest = class EmployeeOvertimeRequest {
    id;
    tenant;
    tenant_id;
    employee;
    employee_id;
    work_date;
    start_time;
    end_time;
    requested_hours;
    reason;
    notes;
    status;
    approved_hours;
    hourly_rate;
    double_hours;
    excess_hours;
    amount;
    paid_amount;
    payment_detail;
    created_by;
    reviewed_by;
    reviewed_at;
    review_notes;
    paid_by;
    paid_at;
    created_at;
    updated_at;
};
exports.EmployeeOvertimeRequest = EmployeeOvertimeRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EmployeeOvertimeRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], EmployeeOvertimeRequest.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], EmployeeOvertimeRequest.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => employee_entity_1.Employee, (employee) => employee.overtime_requests, {
        onDelete: 'CASCADE',
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'employee_id' }),
    __metadata("design:type", employee_entity_1.Employee)
], EmployeeOvertimeRequest.prototype, "employee", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'employee_id' }),
    __metadata("design:type", String)
], EmployeeOvertimeRequest.prototype, "employee_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], EmployeeOvertimeRequest.prototype, "work_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 5 }),
    __metadata("design:type", String)
], EmployeeOvertimeRequest.prototype, "start_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 5 }),
    __metadata("design:type", String)
], EmployeeOvertimeRequest.prototype, "end_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 6, scale: 2 }),
    __metadata("design:type", Number)
], EmployeeOvertimeRequest.prototype, "requested_hours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], EmployeeOvertimeRequest.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], EmployeeOvertimeRequest.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: overtime_status_enum_1.OvertimeStatus,
        default: overtime_status_enum_1.OvertimeStatus.PENDING,
    }),
    __metadata("design:type", String)
], EmployeeOvertimeRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 6, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], EmployeeOvertimeRequest.prototype, "approved_hours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 4, nullable: true }),
    __metadata("design:type", Object)
], EmployeeOvertimeRequest.prototype, "hourly_rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 6, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], EmployeeOvertimeRequest.prototype, "double_hours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 6, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], EmployeeOvertimeRequest.prototype, "excess_hours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], EmployeeOvertimeRequest.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], EmployeeOvertimeRequest.prototype, "paid_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], EmployeeOvertimeRequest.prototype, "payment_detail", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], EmployeeOvertimeRequest.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], EmployeeOvertimeRequest.prototype, "reviewed_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], EmployeeOvertimeRequest.prototype, "reviewed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], EmployeeOvertimeRequest.prototype, "review_notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], EmployeeOvertimeRequest.prototype, "paid_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], EmployeeOvertimeRequest.prototype, "paid_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], EmployeeOvertimeRequest.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], EmployeeOvertimeRequest.prototype, "updated_at", void 0);
exports.EmployeeOvertimeRequest = EmployeeOvertimeRequest = __decorate([
    (0, typeorm_1.Entity)('employee_overtime_requests'),
    (0, typeorm_1.Index)('IDX_employee_overtime_requests_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('IDX_employee_overtime_requests_employee', ['employee_id']),
    (0, typeorm_1.Index)('IDX_employee_overtime_requests_status', ['status']),
    (0, typeorm_1.Index)('IDX_employee_overtime_requests_employee_date', ['employee_id', 'work_date'])
], EmployeeOvertimeRequest);
//# sourceMappingURL=employee-overtime-request.entity.js.map