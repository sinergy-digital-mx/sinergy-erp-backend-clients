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
exports.Employee = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const user_entity_1 = require("../users/user.entity");
const employee_status_enum_1 = require("./employee-status.enum");
const employee_payment_frequency_enum_1 = require("./employee-payment-frequency.enum");
const employee_leave_request_entity_1 = require("./employee-leave-request.entity");
let Employee = class Employee {
    id;
    tenant;
    tenant_id;
    user;
    user_id;
    employee_code;
    rfc;
    curp;
    nss;
    position;
    department;
    hire_date;
    vacation_carryover_days;
    birth_date;
    monthly_salary;
    payment_frequency;
    bank_name;
    clabe;
    bank_account;
    photo_s3_key;
    status;
    termination_date;
    metadata;
    leave_requests;
    created_at;
    updated_at;
};
exports.Employee = Employee;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Employee.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], Employee.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], Employee.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Employee.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], Employee.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], Employee.prototype, "employee_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 13, nullable: true }),
    __metadata("design:type", Object)
], Employee.prototype, "rfc", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 18, nullable: true }),
    __metadata("design:type", Object)
], Employee.prototype, "curp", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], Employee.prototype, "nss", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", Object)
], Employee.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", Object)
], Employee.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], Employee.prototype, "hire_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 1, default: 0 }),
    __metadata("design:type", Number)
], Employee.prototype, "vacation_carryover_days", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], Employee.prototype, "birth_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], Employee.prototype, "monthly_salary", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: employee_payment_frequency_enum_1.EmployeePaymentFrequency,
        default: employee_payment_frequency_enum_1.EmployeePaymentFrequency.BIWEEKLY,
    }),
    __metadata("design:type", String)
], Employee.prototype, "payment_frequency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], Employee.prototype, "bank_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 18, nullable: true }),
    __metadata("design:type", Object)
], Employee.prototype, "clabe", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, nullable: true }),
    __metadata("design:type", Object)
], Employee.prototype, "bank_account", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], Employee.prototype, "photo_s3_key", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: employee_status_enum_1.EmployeeStatus,
        default: employee_status_enum_1.EmployeeStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], Employee.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], Employee.prototype, "termination_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Employee.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => employee_leave_request_entity_1.EmployeeLeaveRequest, (request) => request.employee),
    __metadata("design:type", Array)
], Employee.prototype, "leave_requests", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Employee.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Employee.prototype, "updated_at", void 0);
exports.Employee = Employee = __decorate([
    (0, typeorm_1.Entity)('employees'),
    (0, typeorm_1.Index)('IDX_employees_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('IDX_employees_user', ['user_id'], { unique: true }),
    (0, typeorm_1.Index)('IDX_employees_status', ['status'])
], Employee);
//# sourceMappingURL=employee.entity.js.map