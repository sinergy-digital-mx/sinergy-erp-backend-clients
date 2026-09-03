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
exports.SalesGoal = exports.SalesGoalPeriodType = exports.SalesGoalMetricType = exports.SalesGoalScope = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const billing_branch_entity_1 = require("../billing/billing-branch.entity");
const role_entity_1 = require("../rbac/role.entity");
const user_entity_1 = require("../users/user.entity");
var SalesGoalScope;
(function (SalesGoalScope) {
    SalesGoalScope["BRANCH"] = "branch";
    SalesGoalScope["USER_ROLE"] = "user_role";
})(SalesGoalScope || (exports.SalesGoalScope = SalesGoalScope = {}));
var SalesGoalMetricType;
(function (SalesGoalMetricType) {
    SalesGoalMetricType["SALES_COUNT"] = "sales_count";
    SalesGoalMetricType["AMOUNT"] = "amount";
})(SalesGoalMetricType || (exports.SalesGoalMetricType = SalesGoalMetricType = {}));
var SalesGoalPeriodType;
(function (SalesGoalPeriodType) {
    SalesGoalPeriodType["MONTH"] = "month";
    SalesGoalPeriodType["WEEK"] = "week";
    SalesGoalPeriodType["YEAR"] = "year";
    SalesGoalPeriodType["CUSTOM"] = "custom";
})(SalesGoalPeriodType || (exports.SalesGoalPeriodType = SalesGoalPeriodType = {}));
let SalesGoal = class SalesGoal {
    id;
    tenant;
    tenant_id;
    goal_scope;
    billing_branch;
    billing_branch_id;
    role;
    role_id;
    metric_type;
    target_value;
    period_type;
    period_year;
    period_month;
    period_start;
    period_end;
    is_active;
    notes;
    creator;
    created_by;
    created_at;
    updated_at;
};
exports.SalesGoal = SalesGoal;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SalesGoal.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], SalesGoal.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], SalesGoal.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: SalesGoalScope }),
    __metadata("design:type", String)
], SalesGoal.prototype, "goal_scope", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => billing_branch_entity_1.BillingBranch, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'billing_branch_id' }),
    __metadata("design:type", billing_branch_entity_1.BillingBranch)
], SalesGoal.prototype, "billing_branch", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], SalesGoal.prototype, "billing_branch_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => role_entity_1.Role, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'role_id' }),
    __metadata("design:type", Object)
], SalesGoal.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], SalesGoal.prototype, "role_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: SalesGoalMetricType }),
    __metadata("design:type", String)
], SalesGoal.prototype, "metric_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2 }),
    __metadata("design:type", Number)
], SalesGoal.prototype, "target_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: SalesGoalPeriodType, default: SalesGoalPeriodType.MONTH }),
    __metadata("design:type", String)
], SalesGoal.prototype, "period_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], SalesGoal.prototype, "period_year", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], SalesGoal.prototype, "period_month", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], SalesGoal.prototype, "period_start", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], SalesGoal.prototype, "period_end", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], SalesGoal.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], SalesGoal.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", Object)
], SalesGoal.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], SalesGoal.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], SalesGoal.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], SalesGoal.prototype, "updated_at", void 0);
exports.SalesGoal = SalesGoal = __decorate([
    (0, typeorm_1.Entity)('sales_goals'),
    (0, typeorm_1.Index)('idx_sales_goals_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('idx_sales_goals_branch', ['billing_branch_id']),
    (0, typeorm_1.Index)('idx_sales_goals_period', ['period_type', 'period_year', 'period_month'])
], SalesGoal);
//# sourceMappingURL=sales-goal.entity.js.map