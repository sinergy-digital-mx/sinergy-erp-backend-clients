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
exports.EmployeeLeaveRequest = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const employee_entity_1 = require("./employee.entity");
const leave_type_enum_1 = require("./leave-type.enum");
const leave_status_enum_1 = require("./leave-status.enum");
let EmployeeLeaveRequest = class EmployeeLeaveRequest {
    id;
    tenant;
    tenant_id;
    employee;
    employee_id;
    type;
    start_date;
    end_date;
    days;
    reason;
    status;
    is_paid;
    created_by;
    reviewed_by;
    reviewed_at;
    review_notes;
    created_at;
    updated_at;
};
exports.EmployeeLeaveRequest = EmployeeLeaveRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EmployeeLeaveRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], EmployeeLeaveRequest.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], EmployeeLeaveRequest.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => employee_entity_1.Employee, (employee) => employee.leave_requests, {
        onDelete: 'CASCADE',
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'employee_id' }),
    __metadata("design:type", employee_entity_1.Employee)
], EmployeeLeaveRequest.prototype, "employee", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'employee_id' }),
    __metadata("design:type", String)
], EmployeeLeaveRequest.prototype, "employee_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: leave_type_enum_1.LeaveType }),
    __metadata("design:type", String)
], EmployeeLeaveRequest.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], EmployeeLeaveRequest.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], EmployeeLeaveRequest.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 1 }),
    __metadata("design:type", Number)
], EmployeeLeaveRequest.prototype, "days", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], EmployeeLeaveRequest.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: leave_status_enum_1.LeaveStatus, default: leave_status_enum_1.LeaveStatus.PENDING }),
    __metadata("design:type", String)
], EmployeeLeaveRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: 1 }),
    __metadata("design:type", Boolean)
], EmployeeLeaveRequest.prototype, "is_paid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], EmployeeLeaveRequest.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], EmployeeLeaveRequest.prototype, "reviewed_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], EmployeeLeaveRequest.prototype, "reviewed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], EmployeeLeaveRequest.prototype, "review_notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], EmployeeLeaveRequest.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], EmployeeLeaveRequest.prototype, "updated_at", void 0);
exports.EmployeeLeaveRequest = EmployeeLeaveRequest = __decorate([
    (0, typeorm_1.Entity)('employee_leave_requests'),
    (0, typeorm_1.Index)('IDX_employee_leave_requests_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('IDX_employee_leave_requests_employee', ['employee_id']),
    (0, typeorm_1.Index)('IDX_employee_leave_requests_status', ['status'])
], EmployeeLeaveRequest);
//# sourceMappingURL=employee-leave-request.entity.js.map