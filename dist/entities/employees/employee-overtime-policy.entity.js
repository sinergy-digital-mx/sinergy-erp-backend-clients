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
exports.EmployeeOvertimePolicy = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
let EmployeeOvertimePolicy = class EmployeeOvertimePolicy {
    id;
    tenant;
    tenant_id;
    workday_hours;
    daily_double_hours;
    weekly_double_hours;
    double_multiplier;
    excess_multiplier;
    created_at;
    updated_at;
};
exports.EmployeeOvertimePolicy = EmployeeOvertimePolicy;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EmployeeOvertimePolicy.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], EmployeeOvertimePolicy.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], EmployeeOvertimePolicy.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 4, scale: 2, default: 8 }),
    __metadata("design:type", Number)
], EmployeeOvertimePolicy.prototype, "workday_hours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 4, scale: 2, default: 3 }),
    __metadata("design:type", Number)
], EmployeeOvertimePolicy.prototype, "daily_double_hours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 9 }),
    __metadata("design:type", Number)
], EmployeeOvertimePolicy.prototype, "weekly_double_hours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 6, scale: 2, default: 2 }),
    __metadata("design:type", Number)
], EmployeeOvertimePolicy.prototype, "double_multiplier", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 6, scale: 2, default: 3 }),
    __metadata("design:type", Number)
], EmployeeOvertimePolicy.prototype, "excess_multiplier", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], EmployeeOvertimePolicy.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], EmployeeOvertimePolicy.prototype, "updated_at", void 0);
exports.EmployeeOvertimePolicy = EmployeeOvertimePolicy = __decorate([
    (0, typeorm_1.Entity)('employee_overtime_policies'),
    (0, typeorm_1.Index)('IDX_employee_overtime_policies_tenant', ['tenant_id'], { unique: true })
], EmployeeOvertimePolicy);
//# sourceMappingURL=employee-overtime-policy.entity.js.map