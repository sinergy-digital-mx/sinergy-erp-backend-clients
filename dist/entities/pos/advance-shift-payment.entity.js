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
exports.AdvanceShiftPayment = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const pos_daily_shift_entity_1 = require("./pos-daily-shift.entity");
const pos_sale_payment_method_enum_1 = require("./pos-sale-payment-method.enum");
let AdvanceShiftPayment = class AdvanceShiftPayment {
    id;
    tenant_id;
    tenant;
    quotation_id;
    sales_order_id;
    electronic_invoice_id;
    pos_daily_shift_id;
    pos_daily_shift;
    payment_method;
    amount_mxn;
    document_folio;
    collected_by_user_id;
    sales_order_payment_id;
    voided_at;
    created_at;
};
exports.AdvanceShiftPayment = AdvanceShiftPayment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AdvanceShiftPayment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AdvanceShiftPayment.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], AdvanceShiftPayment.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], AdvanceShiftPayment.prototype, "quotation_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], AdvanceShiftPayment.prototype, "sales_order_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], AdvanceShiftPayment.prototype, "electronic_invoice_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AdvanceShiftPayment.prototype, "pos_daily_shift_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => pos_daily_shift_entity_1.PosDailyShift, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'pos_daily_shift_id' }),
    __metadata("design:type", pos_daily_shift_entity_1.PosDailyShift)
], AdvanceShiftPayment.prototype, "pos_daily_shift", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], AdvanceShiftPayment.prototype, "payment_method", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], AdvanceShiftPayment.prototype, "amount_mxn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40 }),
    __metadata("design:type", String)
], AdvanceShiftPayment.prototype, "document_folio", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AdvanceShiftPayment.prototype, "collected_by_user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], AdvanceShiftPayment.prototype, "sales_order_payment_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], AdvanceShiftPayment.prototype, "voided_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], AdvanceShiftPayment.prototype, "created_at", void 0);
exports.AdvanceShiftPayment = AdvanceShiftPayment = __decorate([
    (0, typeorm_1.Entity)('advance_shift_payments'),
    (0, typeorm_1.Index)('uq_advance_shift_payment_invoice', ['electronic_invoice_id'], { unique: true }),
    (0, typeorm_1.Index)('idx_advance_shift_payment_shift', ['pos_daily_shift_id']),
    (0, typeorm_1.Index)('idx_advance_shift_payment_quotation', ['quotation_id'])
], AdvanceShiftPayment);
//# sourceMappingURL=advance-shift-payment.entity.js.map