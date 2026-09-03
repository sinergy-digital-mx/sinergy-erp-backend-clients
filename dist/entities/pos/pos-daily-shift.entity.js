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
exports.PosDailyShift = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const user_entity_1 = require("../users/user.entity");
const billing_branch_entity_1 = require("../billing/billing-branch.entity");
const pos_daily_shift_status_enum_1 = require("./pos-daily-shift-status.enum");
const pos_partial_shift_entity_1 = require("./pos-partial-shift.entity");
let PosDailyShift = class PosDailyShift {
    id;
    tenant_id;
    tenant;
    terminal_user_id;
    terminal_user;
    billing_branch_id;
    billing_branch;
    shift_date;
    opening_cash_mxn;
    opening_cash_usd;
    closing_cash_mxn;
    closing_cash_usd;
    expected_cash_mxn;
    expected_cash_usd;
    cash_difference_mxn;
    cash_difference_usd;
    closing_denominations;
    status;
    closed_at;
    notes;
    partial_shifts;
    created_at;
    updated_at;
};
exports.PosDailyShift = PosDailyShift;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PosDailyShift.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PosDailyShift.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], PosDailyShift.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PosDailyShift.prototype, "terminal_user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'terminal_user_id' }),
    __metadata("design:type", user_entity_1.User)
], PosDailyShift.prototype, "terminal_user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PosDailyShift.prototype, "billing_branch_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => billing_branch_entity_1.BillingBranch),
    (0, typeorm_1.JoinColumn)({ name: 'billing_branch_id' }),
    __metadata("design:type", billing_branch_entity_1.BillingBranch)
], PosDailyShift.prototype, "billing_branch", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], PosDailyShift.prototype, "shift_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PosDailyShift.prototype, "opening_cash_mxn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PosDailyShift.prototype, "opening_cash_usd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], PosDailyShift.prototype, "closing_cash_mxn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], PosDailyShift.prototype, "closing_cash_usd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], PosDailyShift.prototype, "expected_cash_mxn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], PosDailyShift.prototype, "expected_cash_usd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], PosDailyShift.prototype, "cash_difference_mxn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], PosDailyShift.prototype, "cash_difference_usd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], PosDailyShift.prototype, "closing_denominations", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: pos_daily_shift_status_enum_1.PosDailyShiftStatus,
        default: pos_daily_shift_status_enum_1.PosDailyShiftStatus.OPEN,
    }),
    __metadata("design:type", String)
], PosDailyShift.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], PosDailyShift.prototype, "closed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], PosDailyShift.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => pos_partial_shift_entity_1.PosPartialShift, (partial) => partial.daily_shift),
    __metadata("design:type", Array)
], PosDailyShift.prototype, "partial_shifts", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PosDailyShift.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PosDailyShift.prototype, "updated_at", void 0);
exports.PosDailyShift = PosDailyShift = __decorate([
    (0, typeorm_1.Entity)('pos_daily_shifts'),
    (0, typeorm_1.Index)('idx_pos_daily_shifts_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('idx_pos_daily_shifts_terminal_date', ['terminal_user_id', 'shift_date'])
], PosDailyShift);
//# sourceMappingURL=pos-daily-shift.entity.js.map