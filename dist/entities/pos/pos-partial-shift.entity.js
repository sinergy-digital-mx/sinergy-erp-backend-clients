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
exports.PosPartialShift = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const user_entity_1 = require("../users/user.entity");
const pos_daily_shift_entity_1 = require("./pos-daily-shift.entity");
const pos_partial_shift_denomination_entity_1 = require("./pos-partial-shift-denomination.entity");
let PosPartialShift = class PosPartialShift {
    id;
    tenant_id;
    tenant;
    daily_shift_id;
    daily_shift;
    partial_number;
    removed_total_mxn;
    removed_total_usd;
    sales_total_mxn;
    sales_count;
    performed_by_user_id;
    performed_by_user;
    notes;
    denominations;
    created_at;
};
exports.PosPartialShift = PosPartialShift;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PosPartialShift.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PosPartialShift.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], PosPartialShift.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PosPartialShift.prototype, "daily_shift_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => pos_daily_shift_entity_1.PosDailyShift, (shift) => shift.partial_shifts, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'daily_shift_id' }),
    __metadata("design:type", pos_daily_shift_entity_1.PosDailyShift)
], PosPartialShift.prototype, "daily_shift", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], PosPartialShift.prototype, "partial_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PosPartialShift.prototype, "removed_total_mxn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PosPartialShift.prototype, "removed_total_usd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PosPartialShift.prototype, "sales_total_mxn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PosPartialShift.prototype, "sales_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], PosPartialShift.prototype, "performed_by_user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'performed_by_user_id' }),
    __metadata("design:type", Object)
], PosPartialShift.prototype, "performed_by_user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], PosPartialShift.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => pos_partial_shift_denomination_entity_1.PosPartialShiftDenomination, (denom) => denom.partial_shift, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], PosPartialShift.prototype, "denominations", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PosPartialShift.prototype, "created_at", void 0);
exports.PosPartialShift = PosPartialShift = __decorate([
    (0, typeorm_1.Entity)('pos_partial_shifts'),
    (0, typeorm_1.Index)('idx_pos_partial_shifts_daily', ['daily_shift_id'])
], PosPartialShift);
//# sourceMappingURL=pos-partial-shift.entity.js.map