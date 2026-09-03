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
exports.PosSaleCollection = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const sales_order_entity_1 = require("../sales-orders/sales-order.entity");
const pos_daily_shift_entity_1 = require("./pos-daily-shift.entity");
const customer_entity_1 = require("../customers/customer.entity");
const user_entity_1 = require("../users/user.entity");
const pos_sale_payment_method_enum_1 = require("./pos-sale-payment-method.enum");
let PosSaleCollection = class PosSaleCollection {
    id;
    tenant_id;
    tenant;
    sales_order_id;
    sales_order;
    pos_daily_shift_id;
    pos_daily_shift;
    customer_id;
    customer;
    payment_method;
    order_total_mxn;
    amount_cash_mxn;
    amount_cash_usd;
    usd_exchange_rate;
    amount_transfer_mxn;
    transfer_reference;
    amount_card_mxn;
    amount_credit_mxn;
    card_reference;
    received_cash_mxn;
    received_cash_usd;
    change_cash_mxn;
    change_cash_usd;
    collected_by_user_id;
    collected_by_user;
    notes;
    created_at;
};
exports.PosSaleCollection = PosSaleCollection;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PosSaleCollection.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PosSaleCollection.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], PosSaleCollection.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PosSaleCollection.prototype, "sales_order_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sales_order_entity_1.SalesOrder, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'sales_order_id' }),
    __metadata("design:type", sales_order_entity_1.SalesOrder)
], PosSaleCollection.prototype, "sales_order", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PosSaleCollection.prototype, "pos_daily_shift_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => pos_daily_shift_entity_1.PosDailyShift, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'pos_daily_shift_id' }),
    __metadata("design:type", pos_daily_shift_entity_1.PosDailyShift)
], PosSaleCollection.prototype, "pos_daily_shift", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PosSaleCollection.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_entity_1.Customer, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_id' }),
    __metadata("design:type", customer_entity_1.Customer)
], PosSaleCollection.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: pos_sale_payment_method_enum_1.PosSalePaymentMethod,
    }),
    __metadata("design:type", String)
], PosSaleCollection.prototype, "payment_method", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], PosSaleCollection.prototype, "order_total_mxn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PosSaleCollection.prototype, "amount_cash_mxn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PosSaleCollection.prototype, "amount_cash_usd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 4, nullable: true }),
    __metadata("design:type", Object)
], PosSaleCollection.prototype, "usd_exchange_rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PosSaleCollection.prototype, "amount_transfer_mxn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, nullable: true }),
    __metadata("design:type", Object)
], PosSaleCollection.prototype, "transfer_reference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PosSaleCollection.prototype, "amount_card_mxn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PosSaleCollection.prototype, "amount_credit_mxn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, nullable: true }),
    __metadata("design:type", Object)
], PosSaleCollection.prototype, "card_reference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PosSaleCollection.prototype, "received_cash_mxn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PosSaleCollection.prototype, "received_cash_usd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PosSaleCollection.prototype, "change_cash_mxn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PosSaleCollection.prototype, "change_cash_usd", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PosSaleCollection.prototype, "collected_by_user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'collected_by_user_id' }),
    __metadata("design:type", user_entity_1.User)
], PosSaleCollection.prototype, "collected_by_user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], PosSaleCollection.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PosSaleCollection.prototype, "created_at", void 0);
exports.PosSaleCollection = PosSaleCollection = __decorate([
    (0, typeorm_1.Entity)('pos_sale_collections'),
    (0, typeorm_1.Index)('uq_pos_sale_collection_order', ['sales_order_id'], { unique: true }),
    (0, typeorm_1.Index)('idx_pos_sale_collection_shift', ['pos_daily_shift_id'])
], PosSaleCollection);
//# sourceMappingURL=pos-sale-collection.entity.js.map