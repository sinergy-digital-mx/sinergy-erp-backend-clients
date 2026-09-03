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
exports.PosPartialShiftDenomination = void 0;
const typeorm_1 = require("typeorm");
const pos_partial_shift_entity_1 = require("./pos-partial-shift.entity");
let PosPartialShiftDenomination = class PosPartialShiftDenomination {
    id;
    partial_shift_id;
    partial_shift;
    currency;
    denomination;
    bill_count;
    amount;
};
exports.PosPartialShiftDenomination = PosPartialShiftDenomination;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PosPartialShiftDenomination.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PosPartialShiftDenomination.prototype, "partial_shift_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => pos_partial_shift_entity_1.PosPartialShift, (partial) => partial.denominations, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'partial_shift_id' }),
    __metadata("design:type", pos_partial_shift_entity_1.PosPartialShift)
], PosPartialShiftDenomination.prototype, "partial_shift", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['MXN', 'USD'] }),
    __metadata("design:type", String)
], PosPartialShiftDenomination.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], PosPartialShiftDenomination.prototype, "denomination", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], PosPartialShiftDenomination.prototype, "bill_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], PosPartialShiftDenomination.prototype, "amount", void 0);
exports.PosPartialShiftDenomination = PosPartialShiftDenomination = __decorate([
    (0, typeorm_1.Entity)('pos_partial_shift_denominations'),
    (0, typeorm_1.Index)('idx_pos_partial_denom_partial', ['partial_shift_id'])
], PosPartialShiftDenomination);
//# sourceMappingURL=pos-partial-shift-denomination.entity.js.map