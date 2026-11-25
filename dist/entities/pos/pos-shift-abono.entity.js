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
exports.PosShiftAbono = void 0;
const typeorm_1 = require("typeorm");
const pos_sale_payment_method_enum_1 = require("./pos-sale-payment-method.enum");
let PosShiftAbono = class PosShiftAbono {
    id;
    tenant_id;
    sales_order_id;
    pos_daily_shift_id;
    sales_order_payment_id;
    payment_method;
    amount_mxn;
    amount_cash_mxn;
    amount_transfer_mxn;
    amount_card_mxn;
    amount_check_mxn;
    reference_number;
    created_by;
    created_at;
};
exports.PosShiftAbono = PosShiftAbono;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PosShiftAbono.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PosShiftAbono.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], PosShiftAbono.prototype, "sales_order_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], PosShiftAbono.prototype, "pos_daily_shift_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], PosShiftAbono.prototype, "sales_order_payment_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], PosShiftAbono.prototype, "payment_method", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], PosShiftAbono.prototype, "amount_mxn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PosShiftAbono.prototype, "amount_cash_mxn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PosShiftAbono.prototype, "amount_transfer_mxn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PosShiftAbono.prototype, "amount_card_mxn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PosShiftAbono.prototype, "amount_check_mxn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, nullable: true }),
    __metadata("design:type", Object)
], PosShiftAbono.prototype, "reference_number", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PosShiftAbono.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PosShiftAbono.prototype, "created_at", void 0);
exports.PosShiftAbono = PosShiftAbono = __decorate([
    (0, typeorm_1.Entity)('pos_shift_abonos'),
    (0, typeorm_1.Index)('idx_pos_shift_abono_shift', ['pos_daily_shift_id']),
    (0, typeorm_1.Index)('idx_pos_shift_abono_order', ['sales_order_id'])
], PosShiftAbono);
//# sourceMappingURL=pos-shift-abono.entity.js.map